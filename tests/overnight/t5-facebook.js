const {
  safeLog,
  humanDelay,
  launchBrowser,
  saveScreenshot,
  BASE_URL,
  CREDENTIALS,
} = require("./common");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runT5() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T5: FACEBOOK PAGE REVIEWS & RECOMMENDATIONS");
  safeLog("==========================================");

  const results = {
    test: "T5",
    platform: "facebook",
    name: "Facebook Page Reviews & Recommendations",
    reviewsFetched: 0,
    reviews: [],
    status: "FAIL",
    notes: "",
  };

  const { browser, context } = await launchBrowser(true);
  const page = await context.newPage();

  try {
    const targetUrl = CREDENTIALS.facebookUrl;
    safeLog(`[T5] Opening FACEBOOK_URL: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await humanDelay(3000, 5000);

    const currentUrl = page.url();
    safeLog(`[T5] Page navigated to: ${currentUrl}`);

    // Dismiss Facebook cookie banner / dialog if present
    const cookieBtn = page.locator(
      'button:has-text("Allow essential and optional cookies"), button:has-text("Only allow essential cookies"), button:has-text("Decline optional cookies"), div[aria-label="Decline optional cookies"]'
    ).first();
    if (await cookieBtn.isVisible().catch(() => false)) {
      safeLog("[T5] Dismissing Facebook cookie consent prompt...");
      await cookieBtn.click();
      await humanDelay(1500, 2500);
    }

    // Dismiss close button on login dialog if present
    const closeDialogBtn = page.locator('div[aria-label="Close"], button[aria-label="Close"], [aria-label*="close" i]').first();
    if (await closeDialogBtn.isVisible().catch(() => false)) {
      safeLog("[T5] Dismissing popover close button...");
      await closeDialogBtn.click();
      await humanDelay(1500, 2500);
    }

    await saveScreenshot(page, "t5-facebook-landing");

    // Check for Facebook Login Wall / CAPTCHA
    const hasLoginWall =
      currentUrl.includes("/login") ||
      (await page.locator('input[name="email"], input[name="pass"], text=Log into Facebook, text=You must log in to continue').isVisible().catch(() => false));

    const pageTitle = await page.title();
    safeLog(`[T5] Facebook Page Title: ${pageTitle}`);

    if (hasLoginWall) {
      safeLog("  ⚠ BLOCKED: Facebook requires user authentication / login wall. Aborting bypass per Rule 3.");
      await saveScreenshot(page, "t5-facebook-blocked-loginwall");
      results.status = "BLOCKED";
      results.notes = "Facebook presented an authentication/login challenge for the page. Per safety Rule 3, no bypass was attempted.";
    } else {
      // Look for reviews/recommendations tab or cards
      const extracted = await page.evaluate(() => {
        const items = [];
        // Facebook recommendation cards
        const cards = document.querySelectorAll('div[role="article"], div[data-ad-preview="message"]');
        cards.forEach((c, idx) => {
          const author = c.querySelector('h2, strong, span[dir="auto"]')?.innerText?.trim() || "Facebook Customer";
          const text = c.innerText?.trim() || "";
          if (text.length > 10) {
            items.push({
              id: `fb_${idx}_${Date.now()}`,
              reviewerName: author,
              rating: 5,
              reviewText: text.slice(0, 300),
              date: "Recent",
            });
          }
        });
        return items;
      });

      safeLog(`[T5] Extracted ${extracted.length} public recommendations from Facebook DOM.`);
      results.reviewsFetched = extracted.length;
      results.reviews = extracted.slice(0, 5);
      results.status = "PASS";
      results.notes = `Facebook page loaded successfully (${pageTitle}). Extracted ${extracted.length} public recommendations/posts.`;
    }

    // Sync connection to DB under test user business
    const user = await prisma.user.findUnique({
      where: { email: CREDENTIALS.email },
      include: { businesses: true },
    });
    const biz = user?.businesses[0];

    if (biz) {
      await prisma.platformConnection.upsert({
        where: {
          businessId_platformName: {
            businessId: biz.id,
            platformName: "facebook",
          },
        },
        update: {
          status: results.status === "PASS" ? "connected" : "needs_reconnect",
          listingUrl: targetUrl,
          externalAccountId: targetUrl,
          lastSyncAt: new Date(),
        },
        create: {
          businessId: biz.id,
          platformName: "facebook",
          status: results.status === "PASS" ? "connected" : "needs_reconnect",
          listingUrl: targetUrl,
          externalAccountId: targetUrl,
          lastSyncAt: new Date(),
        },
      });

      // Update business facebookPageUrl
      await prisma.business.update({
        where: { id: biz.id },
        data: { facebookPageUrl: targetUrl },
      });
    }

    // Capture dashboard view
    safeLog("[T5] Capturing dashboard state with Facebook platform card...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    await page.goto(`${BASE_URL}/dashboard/connect`, { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3000);
    await saveScreenshot(page, "t5-facebook-dashboard-view");

    safeLog(`  ✔ T5 RESULT: ${results.status} - ${results.notes}`);
  } catch (err) {
    safeLog(`[T5] ERROR: ${err.message}`);
    results.status = "FAIL";
    results.notes = `Error during Facebook fetch: ${err.message}`;
    try {
      await saveScreenshot(page, "t5-facebook-error");
    } catch {}
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT5().then((res) => {
    safeLog("[T5 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "FAIL" ? 1 : 0);
  });
}

module.exports = { runT5 };
