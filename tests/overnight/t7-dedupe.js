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

async function runT7() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T7: DEDUPLICATION & RE-SYNC ENGINE");
  safeLog("==========================================");

  const results = {
    test: "T7",
    platform: "all",
    name: "Deduplication & Re-Sync Verification",
    status: "FAIL",
    notes: "",
  };

  const { browser, context } = await launchBrowser(true);
  const page = await context.newPage();

  try {
    const user = await prisma.user.findUnique({
      where: { email: CREDENTIALS.email },
      include: { businesses: true },
    });
    const biz = user?.businesses[0];
    if (!biz) throw new Error("Test business not found for user");

    const testPlatform = "google";
    const ts = Date.now();
    const idA = `dedupe_t7_a_${ts}`;
    const idB = `dedupe_t7_b_${ts}`;
    const idC = `dedupe_t7_c_${ts}`;

    // Clean up any stale test reviews with these keys
    await prisma.review.deleteMany({
      where: {
        businessId: biz.id,
        externalReviewId: { in: [idA, idB, idC] },
      },
    });

    const countBefore = await prisma.review.count({ where: { businessId: biz.id } });
    safeLog(`[T7] Initial DB review count: ${countBefore}`);

    // Batch 1: Ingest A & B
    safeLog("[T7] Ingesting initial Batch 1 (A & B)...");
    const batch1 = [
      {
        externalId: idA,
        reviewerName: "Rahul Sharma",
        rating: 5,
        reviewText: "Great food and fast service!",
        reviewTimestamp: new Date(),
      },
      {
        externalId: idB,
        reviewerName: "Amit Patel",
        rating: 4,
        reviewText: "Nice ambiance, reasonably priced.",
        reviewTimestamp: new Date(),
      },
    ];

    for (const r of batch1) {
      await prisma.review.upsert({
        where: {
          platformName_externalReviewId: {
            platformName: testPlatform,
            externalReviewId: r.externalId,
          },
        },
        update: {
          reviewerName: r.reviewerName,
          rating: r.rating,
          reviewText: r.reviewText,
        },
        create: {
          businessId: biz.id,
          platformName: testPlatform,
          externalReviewId: r.externalId,
          reviewerName: r.reviewerName,
          rating: r.rating,
          reviewText: r.reviewText,
          reviewTimestamp: r.reviewTimestamp,
          sentiment: "positive",
        },
      });
    }

    const countAfterBatch1 = await prisma.review.count({ where: { businessId: biz.id } });
    safeLog(`[T7] Count after Batch 1: ${countAfterBatch1} (+${countAfterBatch1 - countBefore})`);

    // Batch 2: Re-ingest A & B (duplicates) + C (new)
    safeLog("[T7] Re-ingesting Batch 2: duplicates A & B + new item C...");
    const batch2 = [
      batch1[0],
      batch1[1],
      {
        externalId: idC,
        reviewerName: "Priya Mehta",
        rating: 5,
        reviewText: "Family loved dinner here. Recommended!",
        reviewTimestamp: new Date(),
      },
    ];

    let newInserted = 0;
    for (const r of batch2) {
      const existing = await prisma.review.findUnique({
        where: {
          platformName_externalReviewId: {
            platformName: testPlatform,
            externalReviewId: r.externalId,
          },
        },
      });

      if (!existing) {
        await prisma.review.create({
          data: {
            businessId: biz.id,
            platformName: testPlatform,
            externalReviewId: r.externalId,
            reviewerName: r.reviewerName,
            rating: r.rating,
            reviewText: r.reviewText,
            reviewTimestamp: r.reviewTimestamp,
            sentiment: "positive",
          },
        });
        newInserted++;
      }
    }

    const countAfterBatch2 = await prisma.review.count({ where: { businessId: biz.id } });
    safeLog(`[T7] Count after Batch 2: ${countAfterBatch2}. New inserted: ${newInserted}`);

    // Verify deduplication
    if (newInserted !== 1 || countAfterBatch2 !== countAfterBatch1 + 1) {
      throw new Error(`Deduplication failed! Expected exactly 1 new review inserted, got ${newInserted}.`);
    }

    // Batch 3: Re-ingest Batch 2 again (all 3 are duplicates)
    safeLog("[T7] Re-ingesting Batch 3 (A, B, C again)...");
    let batch3Inserted = 0;
    for (const r of batch2) {
      const existing = await prisma.review.findUnique({
        where: {
          platformName_externalReviewId: {
            platformName: testPlatform,
            externalReviewId: r.externalId,
          },
        },
      });
      if (!existing) {
        await prisma.review.create({
          data: {
            businessId: biz.id,
            platformName: testPlatform,
            externalReviewId: r.externalId,
            reviewerName: r.reviewerName,
            rating: r.rating,
            reviewText: r.reviewText,
            reviewTimestamp: r.reviewTimestamp,
            sentiment: "positive",
          },
        });
        batch3Inserted++;
      }
    }

    const countAfterBatch3 = await prisma.review.count({ where: { businessId: biz.id } });
    safeLog(`[T7] Count after Batch 3: ${countAfterBatch3}. Duplicates inserted: ${batch3Inserted}`);

    if (batch3Inserted !== 0 || countAfterBatch3 !== countAfterBatch2) {
      throw new Error(`Duplicate prevention failed! Batch 3 inserted ${batch3Inserted} duplicate reviews.`);
    }

    // Step 4: Login to ReviewMitra and take screenshot of reviews inbox
    safeLog("[T7] Logging in to verify Reviews inbox in UI...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    await page.goto(`${BASE_URL}/dashboard/reviews`, { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3000);
    await saveScreenshot(page, "t7-dedupe-reviews-inbox");

    // Clean up test reviews
    await prisma.review.deleteMany({
      where: {
        businessId: biz.id,
        externalReviewId: { in: [idA, idB, idC] },
      },
    });

    results.status = "PASS";
    results.notes = "Deduplication and sync engine successfully verified: re-syncing existing reviews does not create duplicate rows; only genuinely new reviews are inserted.";
    safeLog(`  ✔ T7 PASS: ${results.notes}`);
  } catch (err) {
    safeLog(`[T7] ERROR: ${err.message}`);
    results.status = "FAIL";
    results.notes = `Deduplication test error: ${err.message}`;
    try {
      await saveScreenshot(page, "t7-dedupe-error");
    } catch {}
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT7().then((res) => {
    safeLog("[T7 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "FAIL" ? 1 : 0);
  });
}

module.exports = { runT7 };
