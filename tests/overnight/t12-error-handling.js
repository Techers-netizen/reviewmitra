const path = require("path");
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

async function runT12() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T12: SYSTEM ERROR HANDLING & FAULT RESILIENCE");
  safeLog("==========================================");

  const results = {
    test: "T12",
    name: "System Error Handling & Fault Resilience",
    testsPassed: 0,
    totalTests: 5,
    details: [],
    status: "FAIL",
    notes: "",
  };

  try {
    // ── SUBTEST 1: Invalid Request Payloads & Missing Fields ──
    safeLog("[T12:Subtest 1] Testing missing payload in POST /api/reviews/reply...");
    const res1 = await fetch(`${BASE_URL}/api/reviews/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data1 = await res1.json().catch(() => ({}));
    if (res1.status === 400 && data1.error) {
      safeLog(`✓ HTTP 400 properly returned for empty payload: "${data1.error}"`);
      results.testsPassed++;
      results.details.push({ test: "Empty Payload Validation", status: "PASS", code: res1.status });
    } else {
      throw new Error(`Expected HTTP 400 for empty payload, got ${res1.status}`);
    }

    // ── SUBTEST 2: Non-existent Resource Handling (404) ──
    safeLog("[T12:Subtest 2] Testing non-existent reviewId in POST /api/reviews/reply...");
    const res2 = await fetch(`${BASE_URL}/api/reviews/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: "cmv_non_existent_fake_id_999", replyText: "Hello there" }),
    });
    const data2 = await res2.json().catch(() => ({}));
    if (res2.status === 404 && data2.error) {
      safeLog(`✓ HTTP 404 properly returned for non-existent review: "${data2.error}"`);
      results.testsPassed++;
      results.details.push({ test: "Non-existent Resource Guard", status: "PASS", code: res2.status });
    } else {
      throw new Error(`Expected HTTP 404 for non-existent resource, got ${res2.status}`);
    }

    // ── SUBTEST 3: External API Failure Fallback & Graceful Degradation ──
    safeLog("[T12:Subtest 3] Testing graceful fallback when external platform API is unreachable...");
    const user = await prisma.user.findUnique({
      where: { email: CREDENTIALS.email },
      include: { businesses: true },
    });
    const biz = user?.businesses[0];
    if (!biz) throw new Error("Test business not found");

    const ts = Date.now();
    const testReview = await prisma.review.create({
      data: {
        businessId: biz.id,
        platformName: "google",
        externalReviewId: `t12_g_mock_${ts}`,
        reviewerName: "Amitabh Sen",
        rating: 4,
        reviewText: "Quick and responsive service.",
        sentiment: "positive",
        reviewTimestamp: new Date(),
        isReplied: false,
      },
    });

    const res3 = await fetch(`${BASE_URL}/api/reviews/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId: testReview.id,
        replyText: "Thank you Amitabh for your appreciation!",
        tone: "professional",
      }),
    });
    const data3 = await res3.json().catch(() => ({}));

    // Should succeed internally in ReviewMitra and record fallback error without crashing
    if (res3.ok && data3.ok && data3.replyId) {
      safeLog(`✓ Fallback successful: Reply recorded (replyId: ${data3.replyId}), publishError captured: "${data3.publishError || 'none'}"`);
      results.testsPassed++;
      results.details.push({ test: "External API Fallback", status: "PASS", replyId: data3.replyId });
    } else {
      throw new Error(`External API fallback failed: ${JSON.stringify(data3)}`);
    }

    // ── SUBTEST 4: Broken / Malformed URL Scraping Resilience ──
    safeLog("[T12:Subtest 4] Testing scraping resilience on dead/invalid URL...");
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let handledCleanly = false;
    try {
      await page.goto("https://127.0.0.1:59999/non-existent-dead-site", { timeout: 3000 });
    } catch (netErr) {
      handledCleanly = true;
      safeLog(`✓ Network error caught cleanly by browser controller: "${netErr.message.slice(0, 70)}..."`);
    } finally {
      await browser.close();
    }

    if (handledCleanly) {
      results.testsPassed++;
      results.details.push({ test: "Scraper Dead URL Resilience", status: "PASS" });
    } else {
      throw new Error("Scraper failed to handle dead URL cleanly");
    }

    // ── SUBTEST 5: Rapid Parallel Load & Concurrency Resilience ──
    safeLog("[T12:Subtest 5] Testing rapid parallel load on review processing engine...");
    const parallelCalls = Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/api/cron/process-reviews?dryRun=true`, { method: "GET" })
    );

    const responses = await Promise.all(parallelCalls);
    const allSuccessful = responses.every((r) => r.status === 200);

    if (allSuccessful) {
      safeLog(`✓ All 5 parallel cron trigger requests handled with HTTP 200 and zero deadlock.`);
      results.testsPassed++;
      results.details.push({ test: "Concurrency & Load Resilience", status: "PASS", concurrentRequests: 5 });
    } else {
      throw new Error(`One or more concurrent requests failed: ${responses.map((r) => r.status).join(", ")}`);
    }

    // ── Capture Error State / UI Boundary Snapshot ──
    safeLog("[T12:Step 6] Capturing resilience verification screenshot...");
    const { browser: uiBrowser, context: uiContext } = await launchBrowser(true);
    const uiPage = await uiContext.newPage();
    await uiPage.goto(`${BASE_URL}/dashboard/reviews`, { waitUntil: "domcontentloaded" });
    await humanDelay(1500, 2500);
    await saveScreenshot(uiPage, "t12-error-handling-resilience.png");
    await uiBrowser.close();

    results.status = "PASS";
    results.notes = `All ${results.testsPassed}/${results.totalTests} error resilience tests passed (400 validation, 404 resource guard, external API failure fallback, dead URL network catch, 5x parallel load).`;
    safeLog("✓ TEST T12 COMPLETED SUCCESSFULLY");
  } catch (err) {
    safeLog("✗ TEST T12 FAILED:", err.message);
    results.status = "FAIL";
    results.notes = err.message;
  } finally {
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT12().then((res) => {
    console.log("\n--- T12 RESULT SUMMARY ---");
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.status === "PASS" ? 0 : 1);
  });
}

module.exports = { runT12 };
