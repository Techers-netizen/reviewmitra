"""Single source of truth for Google Maps selectors (ReviewMitra worker).

Google Maps changes its DOM classes often. Every selector the worker uses
lives HERE and nowhere else — gmaps_worker.py builds its JS from this file.
If Google's layout changes, fix the selectors here and the worker, the
FastAPI service and the CLI all pick them up.

Verified against the live New Lucky Restaurant page on 2026-11-08
(owner Reviews dialog, 100 review articles loaded, Reply buttons on 85).
Logged-out, Google shows only 5 reviews and no lazy-load on scroll.
"""

# --- Review cards (Reviews tab / owner Reviews dialog) ---------------------
REVIEW_CARD = "div.jftiEf"
REVIEW_CARD_FALLBACK = "div[data-review-id]"
REVIEW_AUTHOR = "div.d4r55"
REVIEW_TEXT = "span.wiI7pd"
REVIEW_DATE = "span.rsqaWe"
REVIEW_RATING = "span.kvMYJc[aria-label]"
REVIEW_REPLY_BUTTON = "button[aria-label*='Reply'], button[aria-label*='Respond']"
REVIEW_OWNER_REPLY_MARKER = "Response from the owner"

# "More" button that expands a long review's text.
REVIEW_MORE_BUTTON_TEXTS = ["More", "See more"]

# Button at the bottom of the owner Reviews dialog that loads more reviews.
MORE_REVIEWS_BUTTON_TEXTS = ["More Reviews", "More reviews", "See more reviews"]

# --- Reviews tab + sort ------------------------------------------------------
REVIEWS_TAB = [
    "button[aria-label*='Reviews']",
    "button[data-tab-index='1']",
]
SORT_BUTTON_TEXTS = ["Sort", "Most relevant", "Newest", "Highest", "Lowest"]
SORT_NEWEST_TEXTS = ["Newest"]

# --- Business header (place page) --------------------------------------------
BUSINESS_NAME = ["h1.DUwDvf", "h1"]
# Rating stars span in the header (aria-label like "3.9 stars").
BUSINESS_RATING_ARIA = "div.F7nice span[aria-label]"
# Review-count text: the Reviews tab / header shows e.g. "942 reviews" or "(942)".
BUSINESS_ADDRESS = ["button[data-item-id='address']", "button[aria-label*='Address']"]

# --- Reviews panel scroll container ------------------------------------------
REVIEWS_PANEL = "div.m6QErb.DxyBCb.kA9KIf.dS8AEf"

# --- Consent dialog ------------------------------------------------------------
CONSENT_BUTTONS = [
    "//button[contains(., 'Accept all')]",
    "//button[contains(., 'Reject all')]",
    "//button[contains(., 'I agree')]",
]

# --- Search results (when a Maps search URL is given) -------------------------
SEARCH_RESULT_LINK = "a.hfpxzc[aria-label]"

# --- Business info extraction (JS, built from the selectors above) -----------
# Tries several strategies and returns the first value found for each field.
# Returns {name, address, rating, totalReviewsShown, placeId}.
BUSINESS_NAME = "h1.DUwDvf"

BUSINESS_INFO_JS = """(function(){
  var out = {name: null, address: null, rating: null, totalReviewsShown: null, placeId: null};
  // name: the place title h1 (class DUwDvf). NEVER take the first h1
  // blindly: on a search page that is "Results", and on the Reviews tab
  // the overview header is gone. Prefer the place title, then the page
  // title ("Name - Google Maps" / "Name · address - Google Maps").
  var titleEl = document.querySelector('h1.DUwDvf');
  if (titleEl) out.name = (titleEl.textContent || '').trim() || null;
  if (!out.name) {
    var h1s = document.querySelectorAll('h1');
    for (var i = 0; i < h1s.length; i++) {
      var t = (h1s[i].textContent || '').trim();
      if (!t || t.length < 2 || t.length > 120) continue;
      if (/^(results|search results)$/i.test(t)) continue;
      out.name = t; break;
    }
  }
  if (!out.name) {
    var dt = (document.title || '').replace(/\\s*-\\s*Google Maps\\s*$/i, '').trim();
    if (dt) out.name = dt.split(' · ')[0].trim() || null;
  }
  // address fallback: the page title sometimes carries it
  // ("Name · street, city - Google Maps").
  if (!out.address) {
    var dt2 = (document.title || '').replace(/\\s*-\\s*Google Maps\\s*$/i, '').trim();
    var parts = dt2.split(' · ');
    if (parts.length > 1 && parts[1].trim()) out.address = parts[1].trim();
  }
  // address: Maps address button (data-item-id='address'), or any
  // button whose aria-label starts with "Address:".
  var ab = document.querySelector("button[data-item-id='address']");
  if (ab) {
    var addr = (ab.getAttribute('aria-label') || ab.textContent || '').replace(/^Address:\\s*/i, '').trim();
    if (addr) out.address = addr;
  }
  if (!out.address) {
    var btns = document.querySelectorAll('button[aria-label]');
    for (var k = 0; k < btns.length; k++) {
      var al2 = btns[k].getAttribute('aria-label') || '';
      if (/^Address:\\s*/i.test(al2)) {
        out.address = al2.replace(/^Address:\\s*/i, '').trim() || null;
        break;
      }
    }
  }
  // rating + total: header area spans with aria-labels like "3.9 stars" / "942 reviews"
  var spans = document.querySelectorAll('span[aria-label], button[aria-label]');
  for (var j = 0; j < spans.length; j++) {
    var al = spans[j].getAttribute('aria-label') || '';
    var m;
    if (out.rating === null && (m = /(\\d+(?:\\.\\d+)?)\\s*stars?/i.exec(al))) out.rating = parseFloat(m[1]);
    if (out.totalReviewsShown === null && (m = /([\\d,]+)\\s*reviews?/i.exec(al))) out.totalReviewsShown = parseInt(m[1].replace(/,/g, ''), 10);
    if (out.rating !== null && out.totalReviewsShown !== null) break;
  }
  // total fallback: any visible text "942 reviews" / "942 Google reviews"
  if (out.totalReviewsShown === null) {
    var bodyTxt = document.body ? document.body.innerText || '' : '';
    var tm = /([\\d,]+)\\s+(?:Google\\s+)?reviews?/i.exec(bodyTxt);
    if (tm) out.totalReviewsShown = parseInt(tm[1].replace(/,/g, ''), 10);
  }
  // placeId: ChIJ... in the URL or the page HTML; else the Knowledge
  // Graph id (/g/...) that Maps puts in the place URL (!16s/g/...).
  // Either is a stable identifier for the business.
  var url = window.location.href || '';
  var pm = /(ChIJ[a-zA-Z0-9_-]{18,40})/.exec(url);
  if (pm) out.placeId = pm[1];
  if (!out.placeId) {
    var km = /[/]g[/]([a-zA-Z0-9_]{6,40})/.exec(url);
    if (km) out.placeId = '/g/' + km[1];
  }
  return out;
})();"""

# --- Review extraction (JS, one round-trip; selectors from this file) --------
def extract_reviews_js() -> str:
    return """(function(){
  var cards = Array.from(document.querySelectorAll('%s'));
  if (!cards.length) cards = Array.from(document.querySelectorAll('%s'));
  var seen = {};
  var out = [];
  cards.forEach(function(card, idx){
    var rid = card.getAttribute('data-review-id') || '';
    if (!rid) {
      var inner = card.querySelector('[data-review-id]');
      if (inner) rid = inner.getAttribute('data-review-id') || '';
    }
    var authorEl = card.querySelector('%s');
    var textEl = card.querySelector('%s');
    var dateEl = card.querySelector('%s');
    var ratingEl = card.querySelector('%s');
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
    var replyBtn = card.querySelector("%s");
    out.push({
      review_key: key,
      author: auth,
      rating: rating,
      text: txt,
      date: dt,
      has_owner_reply: (card.textContent || '').indexOf('%s') !== -1,
      has_reply_button: !!replyBtn,
      card_index: idx
    });
  });
  return out;
})();""" % (
        REVIEW_CARD,
        REVIEW_CARD_FALLBACK,
        REVIEW_AUTHOR,
        REVIEW_TEXT,
        REVIEW_DATE,
        REVIEW_RATING,
        REVIEW_REPLY_BUTTON,
        REVIEW_OWNER_REPLY_MARKER,
    )


# --- Scroll the reviews panel to the bottom -----------------------------------
SCROLL_PANEL_JS = """(function(){
  var els = document.querySelectorAll('%s');
  if (!els.length) return -1;
  var el = els[els.length - 1];
  el.scrollTop = el.scrollHeight;
  return el.scrollTop;
})();""" % REVIEWS_PANEL

# --- Click every "More" (expand long review text) + "More Reviews" ----------
EXPAND_MORE_JS = """(function(){
  var clicked = 0;
  var btns = Array.from(document.querySelectorAll('button'));
  btns.forEach(function(b){
    var t = (b.textContent || '').trim();
    if (t === 'More' || t === 'See more' || t === 'More Reviews' || t === 'More reviews' || t === 'See more reviews') {
      try { b.click(); clicked++; } catch (e) {}
    }
  });
  return clicked;
})();"""

# --- Count visible review cards (cheap completeness probe) --------------------
COUNT_CARDS_JS = """(function(){
  var cards = document.querySelectorAll('%s');
  if (!cards.length) cards = document.querySelectorAll('%s');
  return cards.length;
})();""" % (REVIEW_CARD, REVIEW_CARD_FALLBACK)
