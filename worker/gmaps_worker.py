"""ReviewMitra Google Maps worker (SeleniumBase, undetected-Chrome mode).

What this does
---------------
Drives a real Chrome (UC mode) using an EXISTING logged-in Chrome profile
directory, so the Google account that manages the business (publicdocc@gmail.com
for New Lucky Restaurant) is already signed in. This worker NEVER logs in by
itself and never types a password: the one-time login is done by the owner
(worker types the email only, the owner taps Yes + the number on their phone,
the session is saved to the persistent profile — see worker/README.md).

All Google Maps selectors live in worker/gmaps_selectors.py (ONE config file).
If Google's layout changes, fix them there.

Modes (CLI)
-----------
* sync        : resolve a Maps link, read business name/rating/total from
                the page, open Reviews (Newest), scroll until no new items
                load, expand every "More", capture ALL reviews, and print
                {business, reviews, fetchedCount, totalReviewsShown,
                completenessPct} as JSON. Never pads, never invents.
* list-reviews: open the business Maps page, list its reviews (read-only).
* post-reply  : find one review, click Reply, type, submit, then READ THE
                REPLY BACK from the page and only report success when the
                reply text is actually visible under the review. In dry-run
                mode it types nothing and submits nothing.

The same functions are imported by worker/app.py (FastAPI service), so the
CLI and the HTTP service can never drift apart.

Usage (from the Reviewmitra repo root)
--------------------------------------
  worker/.venv/bin/python worker/gmaps_worker.py sync \
      --business-url https://share.google/Rd7mruMQjwTihYs01 \
      --profile-dir /path/to/chrome-profile --headless

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
import hashlib
import json
import os
import random
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gmaps_selectors as SEL  # noqa: E402  (single source of truth for Maps selectors)

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

_EXTRACT_JS = SEL.extract_reviews_js()
_SCROLL_JS = SEL.SCROLL_PANEL_JS
_EXPAND_JS = SEL.EXPAND_MORE_JS
_COUNT_JS = SEL.COUNT_CARDS_JS
_BUSINESS_INFO_JS = SEL.BUSINESS_INFO_JS


def stable_external_id(reviewer_name: str, date_text: str, text: str) -> str:
    """Stable dedupe key: sha256 of reviewerName + date text + review text.

    The same review always maps to the same id across re-syncs, so a
    re-sync upserts instead of duplicating. Prefixed so worker-synced
    reviews are distinguishable from legacy ids (gp_, gpn_, gmap_ld_).
    """
    raw = "|".join([reviewer_name or "", date_text or "", text or ""])
    return "gmaps_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


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


def _random_delay(lo: float = 1.0, hi: float = 2.5) -> float:
    """Human-like pause between scrolls (Google blocks metronomic bots)."""
    d = random.uniform(lo, hi)
    time.sleep(d)
    return d


def get_business_info(sb) -> dict:
    """Read business name / address / rating / total review count / placeId
    FROM THE PAGE (never typed, never guessed). Returns the raw values;
    missing fields are None."""
    try:
        info = sb.execute_script(_BUSINESS_INFO_JS) or {}
    except Exception as exc:
        log(f"business-info extraction failed: {exc}")
        info = {}
    # The Maps app rewrites the place URL as it boots (the !16s/g/...
    # kgmid segment can appear/disappear), so window.location.href
    # inside the JS is not always the URL the driver reports. Extract
    # the placeId from the driver's URL too (Python regex, verified).
    if not info.get("placeId"):
        try:
            cur = sb.get_current_url() or ""
            m = re.search(r"ChIJ[a-zA-Z0-9_-]{18,40}", cur)
            if m:
                info["placeId"] = m.group(0)
            else:
                km = re.search(r"/g/([a-zA-Z0-9_]{6,40})", cur)
                if km:
                    info["placeId"] = "/g/" + km.group(1)
            if info.get("placeId"):
                log(f"placeId from driver URL: {info['placeId']}")
        except Exception:
            pass
    return {
        "name": info.get("name"),
        "address": info.get("address"),
        "rating": info.get("rating"),
        "totalReviewsShown": info.get("totalReviewsShown"),
        "placeId": info.get("placeId"),
    }


def sort_reviews_newest(sb) -> bool:
    """Try to set the Reviews sort to Newest. Best-effort: the owner view
    usually already defaults to Newest. Returns True if a Newest option
    was clicked (or was already active)."""
    try:
        # Open the sort menu (button showing the current sort / "Sort").
        for label in ("Most relevant", "Sort"):
            try:
                sb.click_xpath(f"//button[contains(., '{label}')]")
                sb.sleep(1.0)
                break
            except Exception:
                continue
        # Click "Newest" in the menu, if it appears.
        try:
            sb.click_xpath("//*[contains(text(), 'Newest')]")
            sb.sleep(1.5)
            log("sort set to Newest")
            return True
        except Exception:
            pass
        log("sort menu: 'Newest' option not found (page may already sort Newest)")
        return False
    except Exception as exc:
        log(f"sort-to-Newest failed (continuing): {exc}")
        return False


def expand_all_more(sb) -> int:
    """Click every 'More' (expand long text) and 'More Reviews' button."""
    try:
        return int(sb.execute_script(_EXPAND_JS) or 0)
    except Exception:
        return 0


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


def sync_reviews(sb, maps_url: str, max_rounds: int = 80) -> dict:
    """Full sync for one Maps link (the POST /sync implementation).

    Resolves the link, reads business info from the page, opens Reviews,
    sorts Newest, scrolls the panel until no new items load (human-like
    random delays), expands every 'More', and captures ALL reviews.
    Returns {business, reviews, fetchedCount, totalReviewsShown,
    completenessPct, complete} where complete is True only when
    fetched >= 95% of the total Google shows. Never pads, never invents:
    when Google shows fewer reviews than the total (e.g. logged-out it
    shows only 5 of 942), fetchedCount stays small and complete is False
    with the exact numbers.
    """
    final_url = open_business_reviews(sb, maps_url, open_tab=False)
    # Read business info from the PLACE OVERVIEW first: once the Reviews
    # tab opens, the name/address header is replaced by the reviews list
    # (the first h1 on the page then reads "Results").
    info = get_business_info(sb)
    log(f"business on page: {info}")
    open_reviews_tab(sb)

    sort_reviews_newest(sb)

    reviews: list[dict] = []
    seen: set[str] = set()
    prev_count = -1
    stable_rounds = 0
    for round_no in range(max_rounds):
        expand_all_more(sb)
        for r in _extract_reviews_js(sb):
            key = r.get("review_key") or ""
            if not key or key in seen:
                continue
            seen.add(key)
            ext_id = stable_external_id(r.get("author") or "", r.get("date") or "", r.get("text") or "")
            reviews.append(
                {
                    "externalId": ext_id,
                    "reviewerName": r.get("author") or "",
                    "rating": r.get("rating"),
                    "text": r.get("text") or "",
                    "dateText": r.get("date") or "",
                    "ownerReply": None,  # owner reply text is not exposed in the card JS; has_owner_reply flags it
                    "hasOwnerReply": bool(r.get("has_owner_reply")),
                    "hasReplyButton": bool(r.get("has_reply_button")),
                    "review_key": key,
                }
            )
        if len(reviews) == prev_count:
            stable_rounds += 1
            if stable_rounds >= 3:
                log(f"scroll stable after {round_no + 1} rounds ({len(reviews)} reviews)")
                break
        else:
            stable_rounds = 0
        prev_count = len(reviews)
        try:
            sb.execute_script(_SCROLL_JS)
        except Exception:
            pass
        _random_delay(1.0, 2.5)

    # One last expand + extract pass so long texts are complete.
    expand_all_more(sb)
    sb.sleep(1.0)
    for r in _extract_reviews_js(sb):
        key = r.get("review_key") or ""
        if not key or key in seen:
            continue
        seen.add(key)
        reviews.append(
            {
                "externalId": stable_external_id(r.get("author") or "", r.get("date") or "", r.get("text") or ""),
                "reviewerName": r.get("author") or "",
                "rating": r.get("rating"),
                "text": r.get("text") or "",
                "dateText": r.get("date") or "",
                "ownerReply": None,
                "hasOwnerReply": bool(r.get("has_owner_reply")),
                "hasReplyButton": bool(r.get("has_reply_button")),
                "review_key": key,
            }
        )

    # Refresh business info (total count is most reliable after load).
    info2 = get_business_info(sb)
    for k, v in info2.items():
        if v is not None:
            info[k] = v

    total = info.get("totalReviewsShown")
    fetched = len(reviews)
    completeness = (fetched / total * 100.0) if total else None
    complete = bool(total) and fetched >= 0.95 * total
    return {
        "business": {
            "name": info.get("name"),
            "address": info.get("address"),
            "rating": info.get("rating"),
            "totalReviewsShown": total,
            "placeId": info.get("placeId"),
        },
        "reviews": reviews,
        "fetchedCount": fetched,
        "totalReviewsShown": total,
        "completenessPct": round(completeness, 1) if completeness is not None else None,
        "complete": complete,
        "place_url": final_url,
    }


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


def open_reviews_tab(sb) -> bool:
    """Click the "Reviews" tab and wait for review cards. Returns True if
    the tab was clicked. The list loads via RPC after the click and is
    empty for several seconds."""
    clicked_tab = False
    for sel in SEL.REVIEWS_TAB:
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
    return clicked_tab


def open_business_reviews(sb, business_url: str, open_tab: bool = True) -> str:
    """Open the business page and land on its place page, then (unless
    open_tab=False) open its Reviews tab. Returns the final URL.

    Pass open_tab=False when the caller needs to read business
    info from the place overview first (the name/address header is
    replaced by the reviews list once the tab is open).

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
            from urllib.parse import parse_qs, quote, urlparse

            qs = parse_qs(urlparse(url).query)
            q = qs.get("q", [""])[0]
            kgmid = qs.get("kgmid", [""])[0]
            # Wait for the Search page title to settle: it is more
            # specific than the bare q param ("New Lucky Restaurant
            # Mumbai", not just the name) when Google recognises the
            # local query — but it is set a beat after load, so a
            # bare title read here once produced a bare, ambiguous
            # query that matched the wrong businesses.
            title_query = ""
            for _ in range(15):
                title_query = (sb.get_title() or "").replace(" - Google Search", "").strip()
                if q and q.lower() in title_query.lower():
                    break
                sb.sleep(1.0)
            log(f"search page: q={q!r} title={title_query!r} kgmid={kgmid!r}")
            # NOTE: the redirect's kgmid (/g/...) pins the exact
            # business, but the Maps place URL built from it
            # (data=!4m2!3m1!1s/g/...) does NOT resolve to the place
            # header (30s wait, verified 2026-11-09), so it is NOT
            # used for navigation. The kgmid is still recorded as the
            # placeId when it appears in the final place URL.
            # The Search page title is more specific than the bare q
            # param: "New Lucky Restaurant Mumbai", not just the name.
            # Prefer it when it contains q (same business + location).
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
            or bool(sb.find_elements(SEL.SEARCH_RESULT_LINK)),
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
    for sel in SEL.CONSENT_BUTTONS:
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
            results = sb.find_elements(SEL.SEARCH_RESULT_LINK) or []
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

    # Click the "Reviews" tab if asked (callers that read business info
    # first do it themselves via open_reviews_tab()).
    if open_tab:
        open_reviews_tab(sb)
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
  var cards = Array.from(document.querySelectorAll('%s'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('%s'));
  var card = null;
  for (var i = 0; i < cards.length; i++) {
    var r = cards[i].getAttribute('data-review-id') || '';
    var aEl = cards[i].querySelector('%s');
    var a = aEl ? aEl.textContent.trim() : '';
    if (rid && r === rid) { card = cards[i]; break; }
    if (!rid && author && a.toLowerCase().indexOf(author.toLowerCase()) !== -1) { card = cards[i]; break; }
  }
  if (!card) return false;
  var b = card.querySelector("%s");
  if (!b) return false;
  b.click();
  return true;
})();""" % (
    "%s", "%s",
    SEL.REVIEW_CARD, SEL.REVIEW_CARD_FALLBACK, SEL.REVIEW_AUTHOR,
    SEL.REVIEW_REPLY_BUTTON,
)


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
        return bool(
            sb.execute_script(
                """(function(){
  var rid = %s;
  var cards = Array.from(document.querySelectorAll('%s'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('%s'));
  for (var i = 0; i < cards.length; i++) {
    var r = cards[i].getAttribute('data-review-id') || '';
    if (r === rid) {
      return !!cards[i].querySelector("%s");
    }
  }
  return false;
})();"""
                % (json.dumps(rid), SEL.REVIEW_CARD, SEL.REVIEW_CARD_FALLBACK, SEL.REVIEW_REPLY_BUTTON)
            )
        )
    except Exception:
        return False


def _review_rid(review: dict) -> str:
    """The data-review-id for a review dict ('' when the key is a fallback)."""
    key = review.get("review_key") or ""
    return "" if "|" in key else key


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


def post_reply_to_review(
    sb,
    maps_url: str,
    reply_text: str,
    external_id: str = "",
    reviewer_name: str = "",
    review_text: str = "",
    dry_run: bool = False,
) -> dict:
    """Post a reply to one review and VERIFY it on the page (the POST /reply
    implementation). Returns {posted, verified, review, place_url, error}.

    Matching: by externalId first (the worker's stable hash is NOT Google's
    data-review-id, so matching falls back to reviewerName + text snippet).
    Only when logged in as the owner is a Reply control present; logged-out
    this honestly returns posted=False with "no Reply control".
    """
    final_url = open_business_reviews(sb, maps_url)
    # Prefer matching by reviewer name + text snippet (the stable externalId
    # is our own hash, not Google's data-review-id).
    review = find_review(sb, author=reviewer_name, snippet=(review_text or "")[:120])
    if not review:
        return {
            "posted": False,
            "verified": False,
            "place_url": final_url,
            "error": "review not found on the page",
            "reviewerName": reviewer_name,
        }

    log(f"matched review by {review['author']!r} ({review['rating']} stars)")
    if review["has_owner_reply"]:
        return {
            "posted": False,
            "verified": False,
            "place_url": final_url,
            "error": "review already has an owner reply",
            "review": review,
        }

    if not reply_control_present(sb, review):
        return {
            "posted": False,
            "verified": False,
            "place_url": final_url,
            "error": "no Reply control found -- are we logged in as the business owner?",
            "review": review,
        }

    if dry_run:
        log("DRY-RUN: Reply control exists, review found. NOT typing, NOT submitting.")
        return {
            "posted": False,
            "verified": False,
            "dry_run": True,
            "place_url": final_url,
            "review": review,
            "would_post_reply": reply_text,
            "note": "dry-run: nothing was typed or submitted",
        }

    # --- LIVE PATH (only runs when dry_run is False) ---
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
        sb.type(box_sel, reply_text)
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
        check = find_review(sb, author=reviewer_name, snippet=(review_text or "")[:120])
        if not check:
            # The refresh may have reset the panel to Overview; reopen
            # the Reviews tab and look once more.
            try:
                sb.click("button[aria-label*='Reviews']")
                sb.sleep(3)
            except Exception:
                pass
            check = find_review(sb, author=reviewer_name, snippet=(review_text or "")[:120])
        # Verified only when the reply text is visible under the review,
        # or the review now shows an owner reply.
        verified = bool(
            check
            and (
                reply_text[:60] in (check["text"] or "")
                or check["has_owner_reply"]
            )
        )
        return {
            "posted": verified,
            "verified": verified,
            "place_url": final_url,
            "review": check or review,
            "error": None if verified else "reply text not visible after posting",
        }
    except Exception as exc:
        return {"posted": False, "verified": False, "place_url": final_url, "error": str(exc)}


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_sync(args) -> int:
    # NOTE: SeleniumBase's SB context manager swallows exceptions raised
    # inside the `with` block (it records the failure and returns normally),
    # so the try/except MUST be inside the `with`, or a fatal error would
    # silently produce no JSON result.
    with make_sb(args.profile_dir, args.headless) as sb:
        try:
            result = sync_reviews(sb, args.business_url)
            emit({"ok": True, "action": "sync", **result})
            return 0 if result["complete"] else 0
        except Exception as exc:
            log(f"fatal: {exc}")
            emit({"ok": False, "action": "sync", "error": str(exc)})
            return 1


def cmd_list_reviews(args) -> int:
    with make_sb(args.profile_dir, args.headless) as sb:
        try:
            final_url = open_business_reviews(sb, args.business_url)
            reviews = extract_reviews(sb, max_reviews=args.max_reviews)
            if not reviews:
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
    with make_sb(args.profile_dir, args.headless) as sb:
        try:
            result = post_reply_to_review(
                sb,
                args.business_url,
                args.reply_text,
                reviewer_name=args.review_author,
                review_text=args.review_snippet,
                dry_run=args.dry_run,
            )
            emit({"ok": result.get("posted") or result.get("dry_run", False), "action": "post-reply", **result})
            return 0 if (result.get("posted") or result.get("dry_run")) else 1
        except Exception as exc:
            log(f"fatal: {exc}")
            emit({"ok": False, "action": "post-reply", "error": str(exc)})
            return 1


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="ReviewMitra Google Maps worker")
    sub = p.add_subparsers(dest="command", required=True)

    ps = sub.add_parser("sync", help="full sync: business info + all reviews")
    ps.add_argument("--business-url", required=True)
    ps.add_argument("--profile-dir", default=None)
    ps.add_argument("--headless", action="store_true", default=True)
    ps.add_argument("--no-headless", dest="headless", action="store_false")
    ps.set_defaults(func=cmd_sync)

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
