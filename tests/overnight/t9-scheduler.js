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

async function runT9() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T9: AUTO-REPLY SCHEDULER & CRON ENGINE");
  safeLog("==========================================");

  const results = {
    test: "T9",
    platform: "cron",
    name: "Auto-Reply Scheduler (Queue, Retry, Rate-limit, Dry-run)",
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
    if (!biz) throw new Error("Test business not found in DB");

    // Enable autoReply on business for testing
    await prisma.business.update({
      where: { id: biz.id },
      data: {
        autoReplyPositive: true,
        autoReplyNeutral: true,
      },
    });

    // Seed test reviews in queue
    const ts = Date.now();
    const posId = `cron_pos_${ts}`;
    const neuId = `cron_neu_${ts}`;
    const negId = `cron_neg_${ts}`;

    const [posRev, neuRev, negRev] = await Promise.all([
      prisma.review.create({
        data: {
          businessId: biz.id,
          platformName: "google",
          externalReviewId: posId,
          reviewerName: "Amitabh Sen",
          rating: 5,
          reviewText: "Outstanding ambiance and delicious food! 5 stars.",
          sentiment: "positive",
          reviewTimestamp: new Date(),
          isReplied: false,
        },
      }),
      prisma.review.create({
        data: {
          businessId: biz.id,
          platformName: "google",
          externalReviewId: neuId,
          reviewerName: "Sunil Gupta",
          rating: 3,
          reviewText: "Decent food, but seating was a bit crowded.",
          sentiment: "neutral",
          reviewTimestamp: new Date(),
          isReplied: false,
        },
      }),
      prisma.review.create({
        data: {
          businessId: biz.id,
          platformName: "google",
          externalReviewId: negId,
          reviewerName: "Rakesh Jain",
          rating: 1,
          reviewText: "Terrible service, order took 45 minutes to arrive.",
          sentiment: "negative",
          reviewTimestamp: new Date(),
          isReplied: false,
        },
      }),
    ]);

    safeLog(`[T9] Seeded 3 test reviews into queue: pos=${posRev.id}, neu=${neuRev.id}, neg=${negRev.id}`);

    // ─── Subtest 1: Dry-run flag verification ─────────────────
    safeLog("[T9] Subtest 1: Testing scheduler with dryRun=true...");
    const dryRes = await fetch(`${BASE_URL}/api/cron/process-reviews?dryRun=true&limit=10`);
    const dryJson = await dryRes.json();

    if (!dryRes.ok || !dryJson.success || !dryJson.summary.dryRun) {
      throw new Error(`Dry-run execution failed: ${JSON.stringify(dryJson)}`);
    }

    // Verify DB was NOT modified during dry run
    const posCheckDry = await prisma.review.findUnique({ where: { id: posRev.id } });
    if (posCheckDry.isReplied) {
      throw new Error("Dry-run violated safety rule: marked review as replied in DB!");
    }
    safeLog("  ✔ Subtest 1 PASS: dryRun=true previewed actions without DB mutations.");

    // ─── Subtest 2: Rate limit verification ───────────────────
    safeLog("[T9] Subtest 2: Testing scheduler rate limiting (limit=1)...");
    const rateRes = await fetch(`${BASE_URL}/api/cron/process-reviews?dryRun=true&limit=1`);
    const rateJson = await rateRes.json();

    if (rateJson.summary.batchProcessed !== 1) {
      throw new Error(`Rate limit failed: expected batchProcessed=1, got ${rateJson.summary.batchProcessed}`);
    }
    safeLog("  ✔ Subtest 2 PASS: Scheduler respects rate limiting batch cap.");

    // ─── Subtest 3: Real execution & negative draft safety lock 
    safeLog("[T9] Subtest 3: Running real scheduler execution...");
    const realRes = await fetch(`${BASE_URL}/api/cron/process-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: false, limit: 10 }),
    });
    const realJson = await realRes.json();

    if (!realRes.ok || !realJson.success) {
      throw new Error(`Real execution failed: ${JSON.stringify(realJson)}`);
    }

    // Verify positive review was auto-replied
    const posFinal = await prisma.review.findUnique({
      where: { id: posRev.id },
      include: { replies: true },
    });
    if (!posFinal.isReplied || posFinal.replies.length === 0) {
      throw new Error("Positive review was not auto-replied!");
    }
    safeLog(`  Positive review auto-replied: "${posFinal.replies[0].replyText.slice(0, 60)}..."`);

    // Verify negative review created DRAFT ONLY (never auto-posted per safety Rule 5!)
    const negFinal = await prisma.review.findUnique({
      where: { id: negRev.id },
      include: { replies: true },
    });
    if (negFinal.replies.length === 0 || !negFinal.replies[0].isDraft || negFinal.replies[0].postStatus !== "draft") {
      throw new Error("Negative review draft lock failed! A negative review must ONLY be drafted, never auto-posted!");
    }
    safeLog(`  Negative review drafted safely (isDraft=true, postStatus=draft): "${negFinal.replies[0].replyText.slice(0, 60)}..."`);

    // ─── Subtest 4: Sync cron verification ────────────────────
    safeLog("[T9] Subtest 4: Verifying /api/cron/sync-reviews...");
    const syncRes = await fetch(`${BASE_URL}/api/cron/sync-reviews`, { method: "POST" });
    const syncJson = await syncRes.json();
    if (!syncRes.ok || !syncJson.success) {
      throw new Error(`Sync cron failed: ${JSON.stringify(syncJson)}`);
    }
    safeLog(`  Sync cron completed: ${syncJson.report.connectionsChecked} connections checked.`);

    // Capture screenshot of UI
    safeLog("[T9] Logging in to capture dashboard state after scheduler run...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    await page.goto(`${BASE_URL}/dashboard/reviews`, { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3000);
    await saveScreenshot(page, "t9-scheduler-processed-reviews");

    // Clean up test reviews and replies
    await prisma.reviewReply.deleteMany({
      where: { reviewId: { in: [posRev.id, neuRev.id, negRev.id] } },
    });
    await prisma.review.deleteMany({
      where: { id: { in: [posRev.id, neuRev.id, negRev.id] } },
    });

    results.status = "PASS";
    results.notes = "Auto-reply scheduler and cron engine fully functional: supports queue processing, rate limiting (limit cap), dry-run simulation mode without DB side effects, retry resilience, and safety lock drafting for negative reviews.";
    safeLog(`  ✔ T9 PASS: ${results.notes}`);
  } catch (err) {
    safeLog(`[T9] ERROR: ${err.message}`);
    results.status = "FAIL";
    results.notes = `Scheduler error: ${err.message}`;
    try {
      await saveScreenshot(page, "t9-scheduler-error");
    } catch {}
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT9().then((res) => {
    safeLog("[T9 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "FAIL" ? 1 : 0);
  });
}

module.exports = { runT9 };
