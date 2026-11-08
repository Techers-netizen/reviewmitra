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
#
# IMPORTANT (2026-11-08, verified on this VM): in SeleniumBase UC mode the
# driver is CDP-based (seleniumbase.undetected.cdp_driver). Elements
# returned by sb.find_elements are CDP Element objects: .text and
# .get_attribute() work, but .find_elements()/.find_element() are None
# (calling them raises "'NoneType' object is not callable"), and raw
# sb.driver.* calls fail (chromedriver HTTP endpoint refuses connections).
# Only sb.* methods and sb.execute_script() work reliably. So ALL
# card-scoped queries are done in ONE JS call (execute_script with an
# IIFE -- a bare `return` at top level is a SyntaxError here), never via
# WebElement.find_elements. Document-level sb.find_elements/sb.click/
# sb.type work fine.
# ---------------------------------------------------------------------------

# A review card on the Maps Reviews tab (verified 2026-11-08):
#   div.jftiEf[data-review-id] -- the full card (author div.d4r55,
#   text span.wiI7pd, date span.rsqaWe, rating span.kvMYJc[aria-label]).
# div[data-review-id] also matches inner duplicate divs (same rid), so
# extraction dedupes by rid and prefers div.jftiEf.
REVIEW_CARD_SELECTORS = [
    "div.jftiEf",
    "div[data-review-id]",
]

_EXTRACT_JS = """(function(){
  var cards = Array.from(document.querySelectorAll('div.jftiEf'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('div[data-review-id]'));
  var seen = {};
  var out = [];
  cards.forEach(function(card, idx){
    var rid = card.getAttribute('data-review-id') || '';
    if (!rid) {
      var inner = card.querySelector('[data-review-id]');
      if (inner) rid = inner.getAttribute('data-review-id') || '';
    }
    var authorEl = card.querySelector('div.d4r55');
    var textEl = card.querySelector('span.wiI7pd');
    var dateEl = card.querySelector('span.rsqaWe');
    var ratingEl = card.querySelector('span.kvMYJc[aria-label]');
    var rating = null;
    if (ratingEl) {
      var m = /(\\d)\\s*star/.exec(ratingEl.getAttribute('aria-label') || '');
      if (m) rating = parseInt(m[1], 10);
    }
    var txt = textEl ? textEl.textContent.trim() : '';
    var auth = authorEl ? authorEl.textContent.trim() : '';
    var dt = dateEl ? dateEl.textContent.trim() : '';
    var key = rid || (auth + '|' + dt + '|' + txt.slice(0, 60));
    if (!key || seen[key]) return;
    if (!auth && !txt) return;
    seen[key] = true;
    var replyBtn = card.querySelector("button[aria-label*='Reply'], button[aria-label*='Respond']");
    out.push({
      review_key: key,
      author: auth,
      rating: rating,
      text: txt,
      date: dt,
      has_owner_reply: (card.textContent || '').indexOf('Response from the owner') !== -1,
      has_reply_button: !!replyBtn,
      card_index: idx
    });
  });
  return out;
})();"""

_SCROLL_JS = """(function(){
  var els = document.querySelectorAll('div.m6QErb.DxyBCb.kA9KIf.dS8AEf');
  if (!els.length) return -1;
  var el = els[els.length - 1];
  el.scrollTop = el.scrollHeight;
  return el.scrollTop;
})();"""


def _extract_reviews_js(sb) -> list[dict]:
    """One JS round-trip: return the currently-visible parsed reviews."""
    try:
        out = sb.execute_script(_EXTRACT_JS)
    except Exception as exc:
        log(f"JS extraction failed: {exc}")
        return []
    return out or []


def _text(el) -> str:
    try:
        return (el.text or "").strip()
    except Exception:
        return ""


def extract_reviews(sb, max_reviews: int = 50) -> list[dict]:
    """Scroll the reviews panel to load more, then parse visible cards.

    Returns dicts with review_key, author, rating, text, date,
    has_owner_reply, plus has_reply_button and card_index. The list
    loads via RPC after the Reviews tab click, so tolerate a few
    empty rounds before giving up (cards can take seconds to appear).
    """
    reviews: list[dict] = []
    seen: set[str] = set()
    prev_count = -1
    stable_rounds = 0
    for _ in range(15):
        for r in _extract_reviews_js(sb):
            if r.get("review_key") and r["review_key"] not in seen:
                seen.add(r["review_key"])
                reviews.append(r)
                if len(reviews) >= max_reviews:
                    return reviews[:max_reviews]
        if len(reviews) == prev_count:
            stable_rounds += 1
            if stable_rounds >= 2:
                break
        else:
            stable_rounds = 0
        prev_count = len(reviews)
        try:
            sb.execute_script(_SCROLL_JS)
        except Exception:
            pass
        sb.sleep(1.5)
    return reviews[:max_reviews]


def find_review_cards(sb):
    """Return the currently-visible parsed review dicts (JS extraction).

    Kept the old name: callers treat a non-empty return as "cards are
    present". The items are dicts, not WebElements.
    """
    return _extract_reviews_js(sb)


def _wait_for(sb, predicate, timeout: float = 30, interval: float = 1.0, label: str = "") -> bool:
    """Poll predicate() until truthy or timeout. Returns True if satisfied."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if predicate():
                return True
        except Exception:
            pass
        sb.sleep(interval)
    log(f"wait timed out ({timeout}s): {label}")
    return False


def _url_is_place(url: str) -> bool:
    return "/maps/place/" in (url or "")


def _maps_search_url_for_query(query: str) -> str:
    from urllib.parse import quote

    return f"https://www.google.com/maps/search/{quote(query)}"


def _name_matches_query(query: str, result_name: str) -> bool:
    """True if a Maps search result's name fits the search query.

    Guards against clicking the wrong business: every word of the
    result's name must appear in the query (e.g. result "New One Lucky"
    does NOT match query "New Lucky Restaurant" -- "one" is missing --
    while "New Lucky Restaurant" matches "New Lucky Restaurant Mumbai").
    """
    def words(s: str) -> list[str]:
        return [re.sub(r"[^a-z0-9]", "", w) for w in (s or "").lower().split() if w]

    qw = set(words(query))
    rw = [w for w in words(result_name) if w]
    if len(rw) < 2 or not qw:
        return False
    return all(w in qw for w in rw)


def _query_from_search_url(url: str) -> str:
    """The query text of a /maps/search/<query> URL ('' otherwise)."""
    from urllib.parse import unquote, urlparse

    path = urlparse(url or "").path
    marker = "/maps/search/"
    if marker not in path:
        return ""
    return unquote(path.split(marker, 1)[1].split("/")[0]).strip()


def open_business_reviews(sb, business_url: str) -> str:
    """Open the business page, land on its place page, then open its Reviews
    tab. Returns the final URL.

    Google Maps is heavy and some of its subresource hosts are blocked by
    this VM's egress proxy, so a full page-load wait can hang: cap the load
    timeout and continue with whatever rendered, and retry once on an
    error page.

    Timing matters more than it looks: the Maps app boots client-side, so
    the search URL only redirects to the place URL after a few seconds and
    the review cards only appear a few seconds after the Reviews tab is
    clicked. Fixed short sleeps used to race that boot and the worker saw
    an empty page; every step below now waits for its marker (up to 30s).
    """
    from selenium.common.exceptions import TimeoutException

    try:
        sb.driver.set_page_load_timeout(60)
    except Exception as exc:
        # NOTE: in SeleniumBase UC mode, sb.driver.* calls do not reach the
        # chromedriver HTTP endpoint (connection refused); sb.* methods do.
        # This is best-effort only; SeleniumBase's own default timeout
        # still applies if it fails.
        log(f"set_page_load_timeout unavailable (ignored): {exc}")

    def _open(url: str) -> None:
        try:
            sb.open(url)
        except TimeoutException:
            log("page load timed out; stopping load and continuing")
            try:
                # sb.execute_script works in UC mode; sb.driver.execute_script
                # does NOT (chromedriver endpoint refuses the connection).
                sb.execute_script("window.stop();")
            except Exception:
                pass

    expected_query = _query_from_search_url(business_url)
    for attempt in (1, 2):
        log(f"opening business URL (attempt {attempt}): {business_url}")
        _open(business_url)
        # A share.google link redirects to a mobile Google Search page, not
        # Maps (the app avoids this via workerBusinessUrl, but the worker
        # must cope when given a share link directly, e.g. manual runs).
        url = sb.get_current_url()
        if "/maps/" not in url and "/search" in url:
            from urllib.parse import parse_qs, urlparse

            q = parse_qs(urlparse(url).query).get("q", [""])[0]
            # The Search page title is more specific than the bare q
            # param: "New Lucky Restaurant Mumbai", not just the name.
            # Prefer it when it contains q (same business + location).
            title_query = (sb.get_title() or "").replace(" - Google Search", "").strip()
            if title_query and q and q.lower() in title_query.lower():
                query = title_query
            else:
                query = q or title_query
            if query:
                expected_query = query
                maps_url = _maps_search_url_for_query(query)
                log(f"share link landed on Search; switching to Maps: {maps_url}")
                _open(maps_url)
        # Wait for the place page (the app redirects search -> place
        # client-side) or for place-result links to appear.
        landed = _wait_for(
            sb,
            lambda: _url_is_place(sb.get_current_url())
            or bool(sb.find_elements("a.hfpxzc")),
            timeout=30,
            label="place page or search results",
        )
        url = sb.get_current_url()
        log(f"resolved place URL: {url}")
        if url.startswith("chrome-error://"):
            log("error page; retrying once after a short wait")
            sb.sleep(3)
            continue
        if not landed:
            log("WARNING: place page did not load in 30s; continuing anyway")
        break
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
    # Guard: only click a result whose name matches the search query.
    # Clicking the first result blindly once opened the wrong business
    # ("New One Lucky", New York) for a bare-name search, so a mismatch
    # now fails loudly instead of extracting the wrong business.
    if "/maps/search" in sb.get_current_url():
        clicked = False
        try:
            results = sb.find_elements("a.hfpxzc[aria-label]") or []
        except Exception:
            results = []
        names = []
        for el in results:
            try:
                names.append(el.get_attribute("aria-label") or "")
            except Exception:
                names.append("")
        log(f"search results: {names[:6]}")
        for el, name in zip(results, names):
            if expected_query and not _name_matches_query(expected_query, name):
                continue
            try:
                el.click()
                clicked = True
                log(f"opened place result: {name!r}")
                break
            except Exception:
                continue
        if not clicked:
            raise RuntimeError(
                "no search result matched the business query "
                f"{expected_query!r} (results: {names[:6]}); refusing to "
                "open a possibly wrong business -- pass a Maps search URL "
                "with the business name + city, or the place URL"
            )
        _wait_for(sb, lambda: _url_is_place(sb.get_current_url()), timeout=30, label="place page after result click")
        url = sb.get_current_url()
        log(f"place URL after result click: {url}")

    # Click the "Reviews" tab if present, then wait for review cards: the
    # list loads via RPC after the click and is empty for several seconds.
    clicked_tab = False
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
            clicked_tab = True
            log(f"clicked Reviews tab via {sel}")
            break
        except Exception:
            continue
    if not clicked_tab:
        log("WARNING: Reviews tab not found; continuing on the current panel")
    else:
        _wait_for(
            sb,
            lambda: bool(find_review_cards(sb)),
            timeout=30,
            label="review cards after Reviews tab click",
        )
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


_CLICK_REPLY_JS_TEMPLATE = """(function(){
  var rid = %s;
  var author = %s;
  var cards = Array.from(document.querySelectorAll('div.jftiEf'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('div[data-review-id]'));
  var card = null;
  for (var i = 0; i < cards.length; i++) {
    var r = cards[i].getAttribute('data-review-id') || '';
    var aEl = cards[i].querySelector('div.d4r55');
    var a = aEl ? aEl.textContent.trim() : '';
    if (rid && r === rid) { card = cards[i]; break; }
    if (!rid && author && a.toLowerCase().indexOf(author.toLowerCase()) !== -1) { card = cards[i]; break; }
  }
  if (!card) return false;
  var b = card.querySelector("button[aria-label*='Reply'], button[aria-label*='Respond']");
  if (!b) return false;
  b.click();
  return true;
})();"""

_HAS_REPLY_JS_TEMPLATE = """(function(){
  var rid = %s;
  var cards = Array.from(document.querySelectorAll('div.jftiEf'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('div[data-review-id]'));
  for (var i = 0; i < cards.length; i++) {
    var r = cards[i].getAttribute('data-review-id') || '';
    if (r === rid) {
      return !!cards[i].querySelector("button[aria-label*='Reply'], button[aria-label*='Respond']");
    }
  }
  return false;
})();"""


def _review_rid(review: dict) -> str:
    """The data-review-id for a review dict ('' when the key is a fallback)."""
    key = review.get("review_key") or ""
    return "" if "|" in key else key


def _click_reply_button(sb, review: dict) -> bool:
    """Click the Reply button of the matched review card.

    Primary: JS click scoped to the card (CDP Elements have no working
    .find_elements(), so the card cannot be queried as a WebElement).
    Fallback: document-level sb.click on the card's Reply button.
    Returns True if a click happened.
    """
    rid = _review_rid(review)
    author = review.get("author") or ""
    try:
        if sb.execute_script(_CLICK_REPLY_JS_TEMPLATE % (json.dumps(rid), json.dumps(author))):
            log("clicked Reply button via JS")
            return True
    except Exception as exc:
        log(f"JS Reply click failed: {exc}")
    if rid:
        safe_rid = re.sub(r'["\\]', "", rid)
        for sel in [
            f"div.jftiEf[data-review-id=\"{safe_rid}\"] button[aria-label*='Reply']",
            f"div.jftiEf[data-review-id=\"{safe_rid}\"] button[aria-label*='Respond']",
        ]:
            try:
                sb.click(sel)
                log(f"clicked Reply button via {sel}")
                return True
            except Exception:
                continue
    return False


def reply_control_present(sb, review: dict) -> bool:
    """Check whether the owner Reply/Respond control exists for a review.

    Only meaningful when logged in as the business owner. On a public
    (logged-out) page this is False -- which is itself a useful signal.
    Uses the has_reply_button flag from the JS extraction, with a JS
    re-check by data-review-id as fallback.
    """
    if review.get("has_reply_button"):
        return True
    rid = _review_rid(review)
    if not rid:
        return False
    try:
        return bool(sb.execute_script(_HAS_REPLY_JS_TEMPLATE % json.dumps(rid)))
    except Exception:
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
    #
    # CDP Elements have no working .find_elements()/.send_keys(), so the
    # card is targeted by data-review-id (JS click, sb.click fallback)
    # and typing/posting use document-level sb.* methods.
    try:
        if not _click_reply_button(sb, review):
            raise RuntimeError("Reply button could not be clicked")
        sb.sleep(1.5)
        box_sel = None
        for sel in [
            "textarea[aria-label*='Reply']",
            "textarea[aria-label*='Respond']",
            "div[contenteditable='true']",
            "textarea",
        ]:
            try:
                if sb.find_elements(sel):
                    box_sel = sel
                    break
            except Exception:
                continue
        if box_sel is None:
            raise RuntimeError("reply text box did not appear")
        sb.type(box_sel, args.reply_text)
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
        if not check:
            # The refresh may have reset the panel to Overview; reopen
            # the Reviews tab and look once more.
            try:
                sb.click("button[aria-label*='Reviews']")
                sb.sleep(3)
            except Exception:
                pass
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
