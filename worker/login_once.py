"""One-time owner login for the ReviewMitra Maps worker.

Types the EMAIL ONLY. Never types a password. The owner completes the
sign-in on their phone via the Google prompt (tap Yes + the number shown
on the sign-in page). The session is saved to the persistent Chrome
profile (WORKER_PROFILE_DIR, default worker/profiles/google-owner), which
the worker then reuses for the full sync and replies.

Usage (headed, under a virtual display):
    xvfb-run -a worker/.venv/bin/python worker/login_once.py

Env:
    WORKER_LOGIN_EMAIL   (default publicdocc@gmail.com)
    WORKER_PROFILE_DIR   (default worker/profiles/google-owner)
    LOGIN_WAIT_SECONDS   (default 300)

Exit codes: 0 = signed in and profile saved; 2 = password required
(only option — worker stops, it never types a password); 3 = captcha /
challenge the worker cannot clear — pause and ask the owner; 1 = other
failure (see the log).
"""

import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gmaps_worker import log, make_sb

EMAIL = os.environ.get("WORKER_LOGIN_EMAIL", "publicdocc@gmail.com")
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE_DIR = os.environ.get("WORKER_PROFILE_DIR") or os.path.join(
    HERE, "profiles", "google-owner"
)
WAIT_SECONDS = int(os.environ.get("LOGIN_WAIT_SECONDS", "300"))
HEADLESS = os.environ.get("LOGIN_HEADLESS", "false").lower() == "true"


def _visible(sb, selector):
    try:
        return sb.is_element_visible(selector)
    except Exception:
        return False


def _click_text_button(sb, text):
    """Click a button/link containing the given text. Returns True if clicked."""
    for sel in (
        f'button:contains("{text}")',
        f'a:contains("{text}")',
        f'div[role="button"]:contains("{text}")',
    ):
        try:
            if _visible(sb, sel):
                sb.click(sel)
                log(f"login: clicked {text!r} via {sel}")
                return True
        except Exception as e:
            log(f"login: click {text!r} via {sel} failed: {e}")
    return False


def _js(sb, script):
    """Run JS in the page. Returns the result (None on error).
    SeleniumBase's execute_script evaluates the script directly (CDP), so
    a top-level `return` is a SyntaxError — wrap everything in an IIFE."""
    try:
        return sb.execute_script("(function(){ " + script + " })()")
    except Exception as e:
        log(f"login: js failed: {e}")
        return None


def _wait_js(sb, script, timeout=90, label=""):
    """Poll a JS predicate until it returns truthy. Returns the last value."""
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = _js(sb, script)
        if last:
            return last
        time.sleep(2)
    log(f"login: timed out waiting for {label}")
    return last


def _set_email_js(sb, email):
    """Set the sign-in email field via JS (native setter + input event so
    Google's framework registers the value). Returns True on success."""
    script = (
        "const el = document.querySelector('input#identifierId');"
        "if (!el) return false;"
        "const setter = Object.getOwnPropertyDescriptor("
        "window.HTMLInputElement.prototype, 'value').set;"
        f"setter.call(el, {email!r});"
        "el.dispatchEvent(new Event('input', {bubbles: true}));"
        "el.dispatchEvent(new Event('change', {bubbles: true}));"
        "return el.value;"
    )
    return _js(sb, script)


def _click_next_js(sb):
    script = (
        "const b = document.querySelector('#identifierNext') "
        "|| [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Next');"
        "if (!b) return false; b.click(); return true;"
    )
    return _js(sb, script)
    """Read the 2FA number Google shows on the challenge page, if any."""
    try:
        body = sb.get_text("body")
    except Exception:
        return None
    m = re.search(r"tap\s+(\d{1,3})\b", body, re.IGNORECASE)
    return m.group(1) if m else None


def _signed_in(sb):
    """True when the browser is signed in to the Google account."""
    try:
        url = sb.get_current_url()
    except Exception:
        return False
    if "myaccount.google.com" in url:
        return True
    # accounts.google.com without a signin/challenge path means signed in.
    if "accounts.google.com" in url and "signin" not in url and "challenge" not in url:
        return True
    return False


def main() -> int:
    os.makedirs(PROFILE_DIR, exist_ok=True)
    log(f"login: profile dir {PROFILE_DIR} (email only, no password)")
    with make_sb(PROFILE_DIR, headless=HEADLESS) as sb:
        sb.open("https://accounts.google.com/signin")
        sb.sleep(10)
        try:
            log(f"login: url={sb.get_current_url()} title={sb.get_title()!r}")
        except Exception as e:
            log(f"login: could not read url/title: {e}")
        try:
            sb.save_screenshot(os.path.join(HERE, "logs-login-1.png"))
        except Exception:
            pass
        # Google may show a cookie-consent page first ("Before you continue").
        for consent in ("I agree", "Accept all", "Reject all"):
            if _click_text_button(sb, consent):
                log(f"login: consent page — clicked {consent!r}")
                sb.sleep(5)
                break
        # The email field is rendered by JS; SeleniumBase's CDP element
        # lookup is flaky in this environment (same parse bug the worker
        # fixed), so drive it via JS instead.
        if not _wait_js(
            sb,
            "return !!document.querySelector('input#identifierId')",
            timeout=90,
            label="email field",
        ):
            try:
                log(f"login: still no email field; url={sb.get_current_url()} title={sb.get_title()!r}")
                sb.save_screenshot(os.path.join(HERE, "logs-login-2.png"))
                src = sb.get_page_source()[:1500]
                log(f"login: page source head: {src!r}")
            except Exception as e:
                log(f"login: diagnostics failed: {e}")
            log("login: email field never appeared")
            return 1
        val = _set_email_js(sb, EMAIL)
        log(f"login: email set via JS -> {val!r}")
        if not _click_next_js(sb):
            log("login: Next button not found via JS")
            return 1
        log("login: email entered, waiting for Google's next step")
        deadline = time.time() + WAIT_SECONDS
        prompt_clicked = False
        last_number = None
        while time.time() < deadline:
            if _signed_in(sb):
                log("login: SIGNED IN")
                return 0
            # Password page -> use the phone prompt instead of a password.
            # (JS-driven: CDP element lookup is flaky here.)
            has_password = _js(sb, "return !!document.querySelector('input[type=\"password\"]')")
            if has_password and not prompt_clicked:
                clicked = _js(
                    sb,
                    "const b=[...document.querySelectorAll('button')]"
                    ".find(x=>x.textContent.trim()==='Try another way');"
                    "if(!b) return false; b.click(); return true;",
                )
                if clicked:
                    log("login: asked for another way (phone prompt)")
                    time.sleep(3)
                    picked = _js(
                        sb,
                        "const opts=[...document.querySelectorAll('button, div[role=\"button\"]')];"
                        "const t=opts.find(x=>/Tap Yes on your phone/i.test(x.textContent));"
                        "if(!t) return false; t.click(); return true;",
                    )
                    if picked:
                        prompt_clicked = True
                        log("login: phone-prompt option clicked — waiting for the tap")
                    else:
                        log("login: no phone-prompt option found after 'Try another way'")
                        return 2
                else:
                    log("login: password page with no 'Try another way' — stopping (no password)")
                    return 2
            num = _page_number(sb)
            if num and num != last_number:
                last_number = num
                log(f"LOGIN_NUMBER={num} — owner: tap Yes + {num} on your phone now")
            time.sleep(5)
        log("login: timed out waiting for the phone tap")
        return 1


if __name__ == "__main__":
    sys.exit(main())
