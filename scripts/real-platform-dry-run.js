const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SESSIONS_DIR = path.resolve(__dirname, "../qa/sessions");
const SHOTS_DIR = path.resolve(__dirname, "../reports/shots");

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

const PLATFORM_CONFIGS = {
  google: {
    name: "Google Maps (New Lucky Restaurant)",
    url: "https://share.google/vcSLE2StgGsjimFkX",
    replyText:
      "Thank you sincerely for dining with us at New Lucky Restaurant! We truly appreciate your feedback and look forward to welcoming you back soon.",
    selectors: {
      replyBtn: 'button:has-text("Reply"), button[aria-label*="Reply"], [data-value="Reply"]',
      textbox: 'textarea, div[role="textbox"][aria-label*="Reply"], div[contenteditable="true"]',
    },
  },
  justdial: {
    name: "Justdial (Hotel Sana Bharkawada)",
    url: "https://jsdl.in/DT-99UI6IAAQEQ",
    replyText:
      "Thank you for choosing Hotel Sana! We appreciate your support and hope to serve you again with top hospitality.",
    selectors: {
      replyBtn: 'button:has-text("Reply"), a:has-text("Respond"), text=Owner Response, .reply-btn',
      textbox: 'textarea, input[name="replyText"], div[role="textbox"]',
    },
  },
  facebook: {
    name: "Facebook (Islamic Caps Rampuri)",
    url: "https://www.facebook.com/islamiccapsrampuri/",
    replyText:
      "Thank you for reaching out to Islamic Caps Rampuri! We are grateful for your appreciation of our craftsmanship.",
    selectors: {
      replyBtn: 'div[role="button"]:has-text("Reply"), div[role="button"]:has-text("Comment")',
      textbox: 'div[role="textbox"][aria-label*="comment" i], form textarea',
    },
  },
  indiamart: {
    name: "IndiaMART (A One Clothing / VR Enterprise)",
    url: "https://www.indiamart.com/vrenterpriseahmedabad/",
    replyText:
      "Thank you for visiting VR Enterprise / A One Clothing. We appreciate your interest in our wholesale collection.",
    selectors: {
      replyBtn: 'button:has-text("Reply"), a:has-text("Reply"), text=Reply to feedback',
      textbox: 'textarea, input[type="text"], div[role="textbox"]',
    },
  },
};

async function testRealPlatformReplyBox(platformKey) {
  const p = PLATFORM_CONFIGS[platformKey];
  if (!p) throw new Error(`Unknown platform: ${platformKey}`);

  console.log(`\n======================================================`);
  console.log(`▶ TESTING REAL REPLY BOX ON: ${p.name}`);
  console.log(`Target URL: ${p.url}`);
  console.log(`======================================================\n`);

  const sessionPath = path.join(SESSIONS_DIR, `${platformKey}-state.json`);
  const hasSession = fs.existsSync(sessionPath);
  console.log(`Session file exists (${platformKey}-state.json): ${hasSession}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-http2",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const contextOptions = {
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  };

  if (hasSession) {
    console.log(`Loading authenticated context from ${sessionPath}`);
    contextOptions.storageState = sessionPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const result = {
    platform: platformKey,
    name: p.name,
    hasSession,
    status: "BLOCKED",
    screenshot: "",
    reason: "",
  };

  try {
    let targetUrl = p.url;
    if (targetUrl.includes("jsdl.in") || targetUrl.includes("share.google")) {
      try {
        console.log(`Resolving short URL: ${targetUrl}...`);
        const headRes = await fetch(targetUrl, { redirect: "follow" });
        if (headRes.url && headRes.url.startsWith("http")) {
          targetUrl = headRes.url;
          console.log(`Resolved canonical URL: ${targetUrl}`);
        }
      } catch (e) {
        console.log(`Could not resolve short URL: ${e.message}`);
      }
    }

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));

    const finalUrl = page.url();
    console.log(`Final Page URL: ${finalUrl}`);

    // Check for login wall / gate
    const requiresLogin =
      finalUrl.includes("/login") ||
      finalUrl.includes("/signin") ||
      (await page.locator('text=Log In, text=Sign In, text=Sign in to Google, text=Log into Facebook').first().isVisible().catch(() => false));

    // Look for real reply box or reply button
    const replyBtn = page.locator(p.selectors.replyBtn).first();
    const canSeeReplyBtn = await replyBtn.isVisible().catch(() => false);

    let textBox = page.locator(p.selectors.textbox).first();
    let canSeeTextBox = await textBox.isVisible().catch(() => false);

    if (canSeeReplyBtn && !canSeeTextBox) {
      console.log(`Found reply button on real page. Clicking to open real reply box...`);
      await replyBtn.click().catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
      canSeeTextBox = await textBox.isVisible().catch(() => false);
    }

    if (canSeeTextBox) {
      console.log(`✓ Real platform reply box is VISIBLE! Typing draft AI reply...`);
      await textBox.fill(p.replyText).catch(async () => {
        await textBox.type(p.replyText, { delay: 30 });
      });
      await new Promise((r) => setTimeout(r, 2000));

      const shotFile = `real-replybox-${platformKey}-typed.png`;
      const shotPath = path.join(SHOTS_DIR, shotFile);
      await page.screenshot({ path: shotPath });
      console.log(`📸 Screenshot captured with reply typed (NOT SUBMITTED): reports/shots/${shotFile}`);

      result.status = "PREVIEW_TYPED";
      result.screenshot = shotFile;
      result.reason = `Real platform reply box opened and AI reply typed. Strictly NOT submitted. Awaiting "APPROVE LIVE".`;
    } else {
      const shotFile = `real-replybox-${platformKey}-blocked.png`;
      const shotPath = path.join(SHOTS_DIR, shotFile);
      await page.screenshot({ path: shotPath });
      console.log(`📸 Screenshot captured of blocked view: reports/shots/${shotFile}`);

      result.status = "BLOCKED";
      result.screenshot = shotFile;
      result.reason = hasSession
        ? `Logged in session active, but vendor reply button not visible on public listing view (Owner permissions or vendor panel access required).`
        : `No authenticated merchant session. Platform requires owner login/OTP to display reply box.`;
    }
  } catch (err) {
    console.error(`Error during test on ${platformKey}:`, err.message);
    const shotFile = `real-replybox-${platformKey}-error.png`;
    const shotPath = path.join(SHOTS_DIR, shotFile);
    try {
      await page.screenshot({ path: shotPath });
    } catch (e) {}
    result.status = "BLOCKED";
    result.screenshot = shotFile;
    result.reason = `Navigation / selector error: ${err.message}`;
  } finally {
    await browser.close();
  }

  return result;
}

async function runAll() {
  const platforms = ["google", "justdial", "facebook", "indiamart"];
  const summary = [];
  for (const plat of platforms) {
    const res = await testRealPlatformReplyBox(plat);
    summary.push(res);
  }
  console.log(`\n======================================================`);
  console.log(`📊 REAL PLATFORM REPLY BOX AUDIT SUMMARY`);
  console.log(`======================================================`);
  console.table(summary);
  return summary;
}

if (require.main === module) {
  const target = process.argv[2];
  if (target && PLATFORM_CONFIGS[target]) {
    testRealPlatformReplyBox(target).then((r) => console.log(JSON.stringify(r, null, 2)));
  } else {
    runAll();
  }
}

module.exports = { testRealPlatformReplyBox, runAll };
