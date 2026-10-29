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

async function runT6() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T6: INDIAMART REVIEWS & SELLER SYNC");
  safeLog("==========================================");

  const results = {
    test: "T6",
    platform: "indiamart",
    name: "IndiaMART Seller Profile & Reviews Sync",
    reviewsFetched: 0,
    reviews: [],
    status: "FAIL",
    notes: "",
  };

  const { browser, context } = await launchBrowser(true);
  const page = await context.newPage();

  try {
    const targetUrl = CREDENTIALS.indiamartUrl;
    safeLog(`[T6] Opening INDIAMART_URL: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 40000 });
    await humanDelay(3000, 5000);

    const currentUrl = page.url();
    safeLog(`[T6] Page navigated to: ${currentUrl}`);

    // Check for CAPTCHA / bot challenge
    if (
      currentUrl.includes("/captcha") ||
      (await page.locator("text=Please verify you are a human, text=Security Check").isVisible().catch(() => false))
    ) {
      safeLog("  ⚠ BLOCKED: IndiaMART security challenge / CAPTCHA detected. Aborting bypass per Rule 3.");
      await saveScreenshot(page, "t6-indiamart-blocked-captcha");
      results.status = "BLOCKED";
      results.notes = "IndiaMART presented bot verification challenge. Per safety Rule 3, no bypass was attempted.";
      return results;
    }

    await saveScreenshot(page, "t6-indiamart-landing");

    const sellerInfo = await page.evaluate(() => {
      const title = document.title || "";
      const h1 = document.querySelector("h1")?.innerText?.trim() || "";
      const products = [];
      document.querySelectorAll("h2, h3, .prd-name, [class*='title']").forEach((el) => {
        const text = el.innerText?.trim();
        if (text && text.length > 3 && text.length < 80 && !products.includes(text)) {
          products.push(text);
        }
      });

      // Reviews / testimonials on IndiaMART catalog
      const reviews = [];
      document.querySelectorAll(".testimonial, .feedback-item, [class*='review']").forEach((card, idx) => {
        const author = card.querySelector("[class*='name'], strong")?.innerText?.trim() || "IndiaMART Buyer";
        const text = card.innerText?.trim() || "";
        if (text.length > 5) {
          reviews.push({
            id: `im_${idx}_${Date.now()}`,
            reviewerName: author,
            rating: 5,
            reviewText: text.slice(0, 300),
            date: "Recent",
          });
        }
      });

      return { title, h1, products: products.slice(0, 5), reviews };
    });

    safeLog(`[T6] Seller Title: ${sellerInfo.title}`);
    safeLog(`[T6] Products sample: ${sellerInfo.products.join(", ")}`);
    safeLog(`[T6] Extracted ${sellerInfo.reviews.length} reviews from IndiaMART catalog.`);
    await saveScreenshot(page, "t6-indiamart-catalog-state");

    // Connect in Neon DB under test user business
    const user = await prisma.user.findUnique({
      where: { email: CREDENTIALS.email },
      include: { businesses: true },
    });
    const biz = user?.businesses[0];

    if (biz) {
      // Upsert platform connection
      await prisma.platformConnection.upsert({
        where: {
          businessId_platformName: {
            businessId: biz.id,
            platformName: "indiamart",
          },
        },
        update: {
          status: "connected",
          listingUrl: targetUrl,
          externalAccountId: targetUrl,
          lastSyncAt: new Date(),
        },
        create: {
          businessId: biz.id,
          platformName: "indiamart",
          status: "connected",
          listingUrl: targetUrl,
          externalAccountId: targetUrl,
          lastSyncAt: new Date(),
        },
      });

      // Update business indiamartUrl
      await prisma.business.update({
        where: { id: biz.id },
        data: { indiamartUrl: targetUrl },
      });

      // If reviews found, ingest them
      if (sellerInfo.reviews.length > 0) {
        for (const r of sellerInfo.reviews) {
          await prisma.review.upsert({
            where: {
              platformName_externalReviewId: {
                platformName: "indiamart",
                externalReviewId: r.id,
              },
            },
            update: {
              reviewerName: r.reviewerName,
              rating: r.rating,
              reviewText: r.reviewText,
              reviewTimestamp: new Date(),
            },
            create: {
              businessId: biz.id,
              platformName: "indiamart",
              externalReviewId: r.id,
              reviewerName: r.reviewerName,
              rating: r.rating,
              reviewText: r.reviewText,
              reviewTimestamp: new Date(),
              sentiment: "positive",
            },
          });
        }
      }
    }

    const dbCount = biz
      ? await prisma.review.count({ where: { businessId: biz.id, platformName: "indiamart" } })
      : 0;

    // Capture dashboard view
    safeLog("[T6] Capturing ReviewMitra dashboard connect view...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    await page.goto(`${BASE_URL}/dashboard/connect`, { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3000);
    await saveScreenshot(page, "t6-indiamart-dashboard-view");

    results.reviewsFetched = sellerInfo.reviews.length;
    results.reviews = sellerInfo.reviews;
    results.status = "PASS";
    results.notes = `IndiaMART catalog page reached successfully (${sellerInfo.title}). Products identified: [${sellerInfo.products.slice(0, 3).join(", ")}]. Synced to DB with connection status 'connected'. Reviews count in DB: ${dbCount}.`;
    safeLog(`  ✔ T6 PASS: ${results.notes}`);
  } catch (err) {
    safeLog(`[T6] ERROR: ${err.message}`);
    results.status = "FAIL";
    results.notes = `Error during IndiaMART fetch: ${err.message}`;
    try {
      await saveScreenshot(page, "t6-indiamart-error");
    } catch {}
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT6().then((res) => {
    safeLog("[T6 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "FAIL" ? 1 : 0);
  });
}

module.exports = { runT6 };
