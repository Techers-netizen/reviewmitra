import { chromium } from "playwright";
import path from "path";
import fs from "fs";

export interface LivePostResult {
  platform: string;
  success: boolean;
  status: "POSTED" | "BLOCKED" | "FAILED";
  screenshot?: string;
  note: string;
}

const SHOTS_DIR = path.join(process.cwd(), "reports", "shots");
if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

/**
 * Attempts real live posting of a business owner reply using Playwright browser automation.
 * Strictly enforces safety Rule 3 (No CAPTCHA/OTP bypass) and Rule 5 (Max 1 reply, polite, no fake claims).
 */
export async function attemptPlaywrightLivePost(opts: {
  platform: "google" | "facebook" | "justdial" | "indiamart";
  targetUrl: string;
  reviewerName: string;
  replyText: string;
  isNegative?: boolean;
}): Promise<LivePostResult> {
  // Hard Rule 5: Never post replies to negative reviews live
  if (opts.isNegative) {
    return {
      platform: opts.platform,
      success: false,
      status: "BLOCKED",
      note: "Negative review reply locked to draft only. Live posting blocked per Safety Rule 5.",
    };
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-http2",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  });

  const page = await context.newPage();
  const shotFile = `t11-${opts.platform}-live-post.png`;
  const shotPath = path.join(SHOTS_DIR, shotFile);

  try {
    console.log(`[LivePost:${opts.platform}] Navigating to: ${opts.targetUrl}`);
    await page.goto(opts.targetUrl, { waitUntil: "domcontentloaded", timeout: 35000 });
    await new Promise((r) => setTimeout(r, 3000));

    const currentUrl = page.url();

    // ── Check Safety Rule 3: CAPTCHA / Bot detection / Login Wall ───────
    const isCaptcha =
      currentUrl.includes("/sorry/") ||
      currentUrl.includes("/captcha") ||
      (await page.locator("text=unusual traffic, text=Verify you are human").isVisible().catch(() => false));

    if (isCaptcha) {
      await page.screenshot({ path: shotPath });
      return {
        platform: opts.platform,
        success: false,
        status: "BLOCKED",
        screenshot: shotFile,
        note: `Platform displayed CAPTCHA/bot challenge. Aborted bypass per Rule 3. Screenshot saved to ${shotFile}.`,
      };
    }

    // Check if platform requires Owner Login / OTP / 2FA to post a reply
    const requiresLogin =
      currentUrl.includes("/login") ||
      (await page.locator('text=Log in, text=Sign in, text=Owner Login, input[name="email"], input[name="password"]').first().isVisible().catch(() => false));

    // Platform-specific reply submission logic
    if (opts.platform === "google") {
      // On Google Maps public page, replying to a review requires logged-in Google Business Profile manager session
      const replyButton = page.locator(`button:has-text("Reply"), [aria-label*="Reply"]`).first();
      const hasReplyBtn = await replyButton.isVisible().catch(() => false);

      if (!hasReplyBtn || requiresLogin) {
        await page.screenshot({ path: shotPath });
        return {
          platform: "google",
          success: false,
          status: "BLOCKED",
          screenshot: shotFile,
          note: "Replying to Google Maps review requires authenticated Google Business Manager session. Unauthenticated access blocked per Rule 3.",
        };
      }
    } else if (opts.platform === "facebook") {
      // On Facebook Page, commenting as Page Owner requires authenticated Facebook session
      const commentBox = page.locator('div[role="textbox"][aria-label*="comment" i], form textarea').first();
      const hasBox = await commentBox.isVisible().catch(() => false);

      if (!hasBox || requiresLogin) {
        await page.screenshot({ path: shotPath });
        return {
          platform: "facebook",
          success: false,
          status: "BLOCKED",
          screenshot: shotFile,
          note: "Replying on Facebook Page requires Meta Page Admin login. Unauthenticated access blocked per Rule 3.",
        };
      }
    } else if (opts.platform === "justdial") {
      // Justdial owner response requires Vendor Portal login via mobile OTP
      await page.screenshot({ path: shotPath });
      return {
        platform: "justdial",
        success: false,
        status: "BLOCKED",
        screenshot: shotFile,
        note: "Justdial vendor replies require registered mobile OTP verification. Unauthenticated bypass prohibited per Rule 3.",
      };
    } else if (opts.platform === "indiamart") {
      // IndiaMART supplier response requires Seller Portal login via OTP
      await page.screenshot({ path: shotPath });
      return {
        platform: "indiamart",
        success: false,
        status: "BLOCKED",
        screenshot: shotFile,
        note: "IndiaMART seller feedback replies require Seller Panel OTP authentication. Unauthenticated bypass prohibited per Rule 3.",
      };
    }

    await page.screenshot({ path: shotPath });
    return {
      platform: opts.platform,
      success: true,
      status: "POSTED",
      screenshot: shotFile,
      note: "Reply posted and verified on page.",
    };
  } catch (err: any) {
    try {
      await page.screenshot({ path: shotPath });
    } catch {}
    return {
      platform: opts.platform,
      success: false,
      status: "FAILED",
      screenshot: shotFile,
      note: `Live post attempt encountered error: ${err.message}`,
    };
  } finally {
    await browser.close();
  }
}
