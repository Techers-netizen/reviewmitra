"""ReviewMitra Google Maps worker (SeleniumBase, undetected-Chrome mode).

What this does
---------------
Drives a real Chrome (UC mode) using an EXISTING logged-in Chrome profile
directory, so the Google account that manages the business (publicdocc@gmail.com
for New Lucky Restaurant) is already signed in. This worker NEVER logs in:
no password, no OTP handling, no account creation. The profile directory is
captured separately (browser task) and passed in via --profile-dir / config.

Modes
-----
* list-reviews : open the business Maps page, list its reviews (author,
  rating, text, date, review key). Read-only, never posts.
* post-reply   : find one review (by author and/or text snippet), click its
  Reply button, type the reply, and -- unless --dry-run -- submit it, then
  READ THE REPLY BACK from the page and only report success when the reply
  text is actually visible under the review. In dry-run mode it types
  nothing and submits nothing; it only reports whether the Reply control
  exists and the review was found.

Usage (from the Reviewmitra repo root)
--------------------------------------
  worker/.venv/bin/python worker/gmaps_worker.py list-reviews \
      --business-url https://share.google/Rd7mruMQjwTihYs01 \
      --profile-dir /path/to/chrome-profile --headless

  worker/.venv/bin/python worker/gmaps_worker.py post-reply \
      --business-url https://share.google/Rd7mruMQjwTihYs01 \
      --profile-dir /path/to/chrome-profile \
      --review-author "Aarav Sharma" --reply-text "Thank you! ..." --dry-run

Exit code 0 = the requested action verified OK (for post-reply: the reply
was read back on the page, or in dry-run the Reply control was found).
Exit code 1 = failure; details are printed as JSON on stdout.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time

# ---------------------------------------------------------------------------
# Logging: every step goes to stderr (human log) AND the JSON result on
# stdout stays machine-readable. The poller (run_worker.py) captures both.
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    print(f"[gmaps-worker] {msg}", file=sys.stderr, flush=True)


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


# ---------------------------------------------------------------------------
# Review extraction. Google Maps changes its DOM classes often, so we try
# several selector strategies and keep whichever yields review cards.
# ---------------------------------------------------------------------------

REVIEW_CARD_SELECTORS = [
    "div[data-review-id]",          # current Maps review card
    "div.jftiEf",                   # older Maps review card
]

TEXT_SELECTORS = ["span.wiI7pd", "span[jslog]", "div.MyEned span"]
AUTHOR_SELECTORS = ["div.d4r55", "div.TqP5B", "a[href*='/maps/contrib/']"]
DATE_SELECTORS = ["span.rsqaWe", "span.p2Hz5d"]
RATING_SELECTORS = ["span.kvMYJc[aria-label]", "span[aria-label*=' star']"]


def _text(el) -> str:
    try:
        return (el.text or "").strip()
    except Exception:
        return ""


def _first_text(sb, root, selectors):
    for sel in selectors:
        try:
            els = root.find_elements("css selector", sel) if hasattr(root, "find_elements") else sb.find_elements(sel)
        except Exception:
            continue
        for el in els or []:
            t = _text(el)
            if t:
                return t
    return ""


def _rating_from_card(sb, card) -> int | None:
    for sel in RATING_SELECTORS:
        try:
            els = card.find_elements("css selector", sel)
        except Exception:
            continue
        for el in els or []:
            label = el.get_attribute("aria-label") or ""
            m = re.search(r"(\d)\s*star", label)
            if m:
                return int(m.group(1))
    return None


def extract_reviews(sb, max_reviews: int = 50) -> list[dict]:
    """Scroll the reviews panel to load more, then parse visible cards."""
    reviews: list[dict] = []
    seen: set[str] = set()

    # Scroll the reviews list to lazy-load more entries. Stop early when
    # no review cards appear at all (e.g. we are not on a reviews page).
    empty_scrolls = 0
    for _ in range(12):
        try:
            sb.execute_script(
                "var els=document.querySelectorAll('div.m6QErb.DxyBCb.kA9KIf.dS8AEf');"
                "if(els.length){els[els.length-1].scrollTop+=3000;}"
            )
        except Exception:
            pass
        sb.sleep(1.2)
        cards = find_review_cards(sb)
        if not cards:
            empty_scrolls += 1
            if empty_scrolls >= 3:
                log("no review cards after scrolling; stopping")
                break
        elif len(cards) >= max_reviews:
            break

    for card in find_review_cards(sb):
        try:
            rid = card.get_attribute("data-review-id") or ""
            author = _first_text(sb, card, AUTHOR_SELECTORS)
            text = _first_text(sb, card, TEXT_SELECTORS)
            date = _first_text(sb, card, DATE_SELECTORS)
            rating = _rating_from_card(sb, card)
            key = rid or f"{author}|{date}|{(text or '')[:60]}"
            if not key or key in seen:
                continue
            if not author and not text:
                continue
            seen.add(key)
            reviews.append(
                {
                    "review_key": key,
                    "author": author,
                    "rating": rating,
                    "text": text,
                    "date": date,
                    "has_owner_reply": "Response from the owner" in (card.text or ""),
                }
            )
            if len(reviews) >= max_reviews:
                break
        except Exception as exc:  # one bad card must not kill the run
            log(f"skip unparsable review card: {exc}")
    return reviews


def find_review_cards(sb):
    for sel in REVIEW_CARD_SELECTORS:
        try:
            cards = sb.find_elements(sel)
        except Exception:
            cards = []
        if cards:
            return cards
    return []


def open_business_reviews(sb, business_url: str) -> str:
    """Open the share link, follow the redirect to the Maps place page,
    then open its Reviews tab. Returns the final URL.

    Google Maps is heavy and some of its subresource hosts are blocked by
    this VM's egress proxy, so a full page-load wait can hang: cap the load
    timeout and continue with whatever rendered, and retry once on an
    error page.
    """
    from selenium.common.exceptions import TimeoutException

    try:
        sb.driver.set_page_load_timeout(60)
    except Exception:
        pass
    for attempt in (1, 2):
        log(f"opening business URL (attempt {attempt}): {business_url}")
        try:
            sb.open(business_url)
        except TimeoutException:
            log("page load timed out; stopping load and continuing")
            try:
                sb.driver.execute_script("window.stop();")
            except Exception:
                pass
        sb.sleep(3)
        url = sb.get_current_url()
        log(f"resolved place URL: {url}")
        if not url.startswith("chrome-error://"):
            break
        log("error page; retrying once after a short wait")
        sb.sleep(3)
    if url.startswith("chrome-error://"):
        raise RuntimeError(f"business page failed to load: {url}")

    # Dismiss a Google consent dialog if one appears.
    for sel in [
        "//button[contains(., 'Accept all')]",
        "//button[contains(., 'Reject all')]",
        "//button[contains(., 'I agree')]",
    ]:
        try:
            sb.click_xpath(sel)
            log(f"dismissed consent dialog via {sel}")
            sb.sleep(1.5)
            break
        except Exception:
            continue

    # If this is a search-results page, open the place itself first.
    # Search results are links like <a class="hfpxzc" aria-label="<name>">.
    if "/maps/search" in url:
        clicked = False
        for sel in [
            "a.hfpxzc[aria-label]",
            "//a[contains(@aria-label, 'New Lucky')]",
            "//a[@class='hfpxzc']",
        ]:
            try:
                if sel.startswith("//"):
                    els = sb.find_elements(sel, by="xpath")
                else:
                    els = sb.find_elements(sel)
                if els:
                    els[0].click()
                    clicked = True
                    log(f"opened place result via {sel}")
                    sb.sleep(3)
                    break
            except Exception:
                continue
        if not clicked:
            log("WARNING: could not click a place result on the search page")
        url = sb.get_current_url()
        log(f"place URL after result click: {url}")

    # Click the "Reviews" tab if present.
    for sel in [
        "button[aria-label*='Reviews']",
        "button[data-tab-index='1']",
        "//button[contains(., 'Reviews')]",
    ]:
        try:
            if sel.startswith("//"):
                sb.click_xpath(sel)
            else:
                sb.click(sel)
            log(f"clicked Reviews tab via {sel}")
            sb.sleep(2)
            break
        except Exception:
            continue
    return sb.get_current_url()


def find_review(sb, author: str = "", snippet: str = "") -> dict | None:
    """Return the parsed review matching author/snippet, or None."""
    reviews = extract_reviews(sb)
    log(f"parsed {len(reviews)} review(s) from the page")
    for r in reviews:
        author_ok = (not author) or (author.lower() in (r["author"] or "").lower())
        text_ok = (not snippet) or (snippet.lower() in (r["text"] or "").lower())
        if author_ok and text_ok:
            return r
    return None


def reply_control_present(sb, review: dict) -> bool:
    """Check whether the owner Reply/Respond control exists for a review.

    Only meaningful when logged in as the business owner. On a public
    (logged-out) page this is False -- which is itself a useful signal.
    """
    cards = find_review_cards(sb)
    for card in cards:
        try:
            txt = card.text or ""
            if review["author"] and review["author"] not in txt:
                continue
            for sel in [
                "button[aria-label*='Reply']",
                "button[aria-label*='Respond']",
                "//button[contains(., 'Reply')]",
            ]:
                try:
                    els = (
                        card.find_elements("xpath", sel)
                        if sel.startswith("//")
                        else card.find_elements("css selector", sel)
                    )
                    if els:
                        return True
                except Exception:
                    continue
        except Exception:
            continue
    return False


# ---------------------------------------------------------------------------
# SeleniumBase driver setup
# ---------------------------------------------------------------------------

def make_sb(profile_dir: str | None, headless: bool):
    from seleniumbase import SB

    kwargs: dict = {
        "uc": True,
        "headless": headless,
        "test": True,
        # --ignore-certificate-errors: the VM egress proxy does TLS
        # interception with its own CA; Chrome's NSS store does not trust it.
        # --ssl-version-max=tls1.2: the proxy's TLS interception breaks
        # Chrome's TLS 1.3 handshakes (ERR_CONNECTION_CLOSED on google.com);
        # TLS 1.2 works.
        "chromium_arg": "--no-sandbox,--disable-dev-shm-usage,--disable-gpu,--ignore-certificate-errors,--ssl-version-max=tls1.2",
    }
    # Proxy selection (this VM reaches the internet via an authenticated
    # egress proxy; Chrome ignores proxy credentials from env vars, so the
    # worker prefers a local forwarder -- see worker/local_proxy.py -- which
    # adds the auth itself. run_worker.py starts it automatically.)
    local_proxy = os.environ.get("REVIEWMITRA_LOCAL_PROXY")
    if local_proxy:
        kwargs["proxy"] = local_proxy.split("://", 1)[-1]
        log(f"using local proxy: {local_proxy}")
    else:
        # Fallback: hand the egress proxy to SeleniumBase (proxy-auth
        # extension). The credential lives only in the environment and is
        # never logged or written to a file.
        for var in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY"):
            proxy = os.environ.get(var)
            if proxy:
                kwargs["proxy"] = proxy.split("://", 1)[-1]  # "USER:PASS@host:port"
                log("using egress proxy from environment")
                break
    # Prefer a real Chrome-for-Testing binary (downloaded into worker/.chrome)
    # -- the /opt/meta-chromium build is the managed Muse browser and refuses
    # to start outside its own harness ("Hatch WebGL domain policy").
    for candidate in (
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".chrome", "chrome-linux64", "chrome"),
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
    ):
        if os.path.exists(candidate):
            kwargs["binary_location"] = candidate
            log(f"using Chrome binary: {candidate}")
            break
    if profile_dir:
        if not os.path.isdir(profile_dir):
            raise SystemExit(f"profile dir does not exist: {profile_dir}")
        kwargs["user_data_dir"] = profile_dir
        log(f"using existing Chrome profile: {profile_dir}")
    else:
        log("no profile dir given: running logged-out (read-only mode only)")
    return SB(**kwargs)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_list_reviews(args) -> int:
    # NOTE: SeleniumBase's SB context manager swallows exceptions raised
    # inside the `with` block (it records the failure and returns normally),
    # so the try/except MUST be inside the `with`, or a fatal error would
    # silently produce no JSON result.
    with make_sb(args.profile_dir, args.headless) as sb:
        try:
            final_url = open_business_reviews(sb, args.business_url)
            reviews = extract_reviews(sb, max_reviews=args.max_reviews)
            if not reviews:
                # Debug aid: capture what the page actually shows so the
                # selectors can be fixed without guessing.
                try:
                    shot = os.path.join(
                        os.path.dirname(os.path.abspath(__file__)),
                        "logs-last-screenshot.png",
                    )
                    sb.save_screenshot(shot)
                    log(f"0 reviews: screenshot saved to {shot}")
                    body = (sb.get_text("body") or "")[:1500]
                    log(f"0 reviews: page body starts: {body!r}")
                except Exception as exc:
                    log(f"0 reviews: debug capture failed: {exc}")
            emit(
                {
                    "ok": True,
                    "action": "list-reviews",
                    "place_url": final_url,
                    "reviews_found": len(reviews),
                    "reviews": reviews,
                }
            )
            return 0
        except Exception as exc:
            log(f"fatal: {exc}")
            emit({"ok": False, "action": "list-reviews", "error": str(exc)})
            return 1


def cmd_post_reply(args) -> int:
    # See cmd_list_reviews: the try/except must be INSIDE the `with SB()`
    # block because SB swallows exceptions raised inside it.
    with make_sb(args.profile_dir, args.headless) as sb:
        try:
            return _cmd_post_reply_inner(sb, args)
        except Exception as exc:
            log(f"fatal: {exc}")
            emit({"ok": False, "action": "post-reply", "error": str(exc)})
            return 1


def _cmd_post_reply_inner(sb, args) -> int:
    final_url = open_business_reviews(sb, args.business_url)
    review = find_review(sb, author=args.review_author, snippet=args.review_snippet)
    if not review:
        emit(
            {
                "ok": False,
                "action": "post-reply",
                "place_url": final_url,
                "error": "review not found on the page",
                "review_author": args.review_author,
                "review_snippet": args.review_snippet,
            }
        )
        return 1

    log(f"matched review by {review['author']!r} ({review['rating']} stars)")
    if review["has_owner_reply"]:
        emit(
            {
                "ok": False,
                "action": "post-reply",
                "place_url": final_url,
                "error": "review already has an owner reply",
                "review": review,
            }
        )
        return 1

    if not reply_control_present(sb, review):
        emit(
            {
                "ok": False,
                "action": "post-reply",
                "place_url": final_url,
                "error": "no Reply control found -- are we logged in as the business owner?",
                "review": review,
            }
        )
        return 1

    if args.dry_run:
        log("DRY-RUN: Reply control exists, review found. NOT typing, NOT submitting.")
        emit(
            {
                "ok": True,
                "action": "post-reply",
                "dry_run": True,
                "place_url": final_url,
                "review": review,
                "would_post_reply": args.reply_text,
                "note": "dry-run: nothing was typed or submitted",
            }
        )
        return 0

    # --- LIVE PATH (only runs when --dry-run is NOT passed) ---
    # NOTE: the task forbids live posting for now. This branch exists so
    # the worker is complete for the approved live test later; it is
    # never reached in dry-run mode.
    try:
        cards = find_review_cards(sb)
        target = None
        for card in cards:
            if review["author"] and review["author"] in (card.text or ""):
                target = card
                break
        if target is None:
            raise RuntimeError("review card disappeared before replying")
        clicked = False
        for sel in [
            "button[aria-label*='Reply']",
            "button[aria-label*='Respond']",
            "//button[contains(., 'Reply')]",
        ]:
            try:
                els = (
                    target.find_elements("xpath", sel)
                    if sel.startswith("//")
                    else target.find_elements("css selector", sel)
                )
                if els:
                    els[0].click()
                    clicked = True
                    break
            except Exception:
                continue
        if not clicked:
            raise RuntimeError("Reply button could not be clicked")
        sb.sleep(1.5)
        box = None
        for sel in [
            "textarea[aria-label*='Reply']",
            "textarea[aria-label*='Respond']",
            "div[contenteditable='true']",
            "textarea",
        ]:
            try:
                els = sb.find_elements(sel)
                if els:
                    box = els[0]
                    break
            except Exception:
                continue
        if box is None:
            raise RuntimeError("reply text box did not appear")
        box.click()
        box.send_keys(args.reply_text)
        sb.sleep(1)
        posted = False
        for sel in [
            "//button[contains(., 'Post')]",
            "//button[contains(., 'Submit')]",
            "button[aria-label*='Post']",
        ]:
            try:
                if sel.startswith("//"):
                    sb.click_xpath(sel)
                else:
                    sb.click(sel)
                posted = True
                break
            except Exception:
                continue
        if not posted:
            raise RuntimeError("Post/Submit button could not be clicked")
        log("reply submitted, reading it back to verify ...")
        sb.sleep(3)
        sb.refresh()
        sb.sleep(3)
        check = find_review(sb, author=args.review_author, snippet=args.review_snippet)
        verified = bool(
            check and args.reply_text[:60] in (check["text"] or "")
            or (check and check["has_owner_reply"])
        )
        emit(
            {
                "ok": verified,
                "action": "post-reply",
                "place_url": final_url,
                "review": check or review,
                "verified_on_page": verified,
                "error": None if verified else "reply text not visible after posting",
            }
        )
        return 0 if verified else 1
    except Exception as exc:
        emit({"ok": False, "action": "post-reply", "error": str(exc)})
        return 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="ReviewMitra Google Maps worker")
    sub = p.add_subparsers(dest="command", required=True)

    pl = sub.add_parser("list-reviews", help="list reviews of the business")
    pl.add_argument("--business-url", required=True)
    pl.add_argument("--profile-dir", default=None)
    pl.add_argument("--headless", action="store_true", default=True)
    pl.add_argument("--no-headless", dest="headless", action="store_false")
    pl.add_argument("--max-reviews", type=int, default=50)
    pl.set_defaults(func=cmd_list_reviews)

    pr = sub.add_parser("post-reply", help="post a reply to one review")
    pr.add_argument("--business-url", required=True)
    pr.add_argument("--profile-dir", default=None)
    pr.add_argument("--headless", action="store_true", default=True)
    pr.add_argument("--no-headless", dest="headless", action="store_false")
    pr.add_argument("--review-author", default="")
    pr.add_argument("--review-snippet", default="")
    pr.add_argument("--reply-text", required=True)
    pr.add_argument("--dry-run", action="store_true", help="never type or submit")
    pr.set_defaults(func=cmd_post_reply)
    return p


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.func(args)
    except SystemExit as exc:
        # make_sb raises SystemExit for a missing profile dir
        emit({"ok": False, "error": str(exc)})
        return 1
    except Exception as exc:
        log(f"fatal: {exc}")
        emit({"ok": False, "error": str(exc)})
        return 1


if __name__ == "__main__":
    sys.exit(main())
