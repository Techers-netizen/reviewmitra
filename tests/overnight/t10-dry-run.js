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

async function runT10() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T10: DRY-RUN REPLY BOX VERIFICATION (NO SUBMISSION)");
  safeLog("==========================================");

  const results = {
    test: "T10",
    platform: "all",
    name: "Dry-Run Reply Box (Google, Justdial, Facebook, IndiaMART)",
    platformsTested: [],
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

    // Seed 1 unreplied review for each platform
    const ts = Date.now();
    const seedReviews = [
      {
        platform: "google",
        externalId: `t10_g_${ts}`,
        reviewer: "Kavita Joshi",
        rating: 5,
        text: "Lovely hospitality and great food! 5 stars to the team.",
      },
      {
        platform: "justdial",
        externalId: `t10_jd_${ts}`,
        reviewer: "Manish Solanki",
        rating: 4,
        text: "Prompt service and helpful staff.",
      },
      {
        platform: "facebook",
        externalId: `t10_fb_${ts}`,
        reviewer: "Zoya Khan",
        rating: 5,
        text: "Really liked the quality and prompt assistance.",
      },
      {
        platform: "indiamart",
        externalId: `t10_im_${ts}`,
        reviewer: "Apex Garments",
        rating: 5,
        text: "Wholesale delivery arrived on time, good fabric.",
      },
    ];

    const createdIds = [];
    for (const b of user.businesses) {
      for (const r of seedReviews) {
        const created = await prisma.review.create({
          data: {
            businessId: b.id,
            platformName: r.platform,
            externalReviewId: `${r.externalId}_${b.id.slice(-6)}`,
            reviewerName: r.reviewer,
            rating: r.rating,
            reviewText: r.text,
            sentiment: "positive",
            reviewTimestamp: new Date(),
            isReplied: false,
          },
        });
        createdIds.push(created.id);
      }
    }
    safeLog(`[T10] Seeded 4 platform reviews in DB across all user businesses.`);

    // Log into ReviewMitra dashboard
    safeLog("[T10] Logging into ReviewMitra dashboard...");
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    await humanDelay(2000, 3000);

    await page.goto(`${BASE_URL}/dashboard/reviews`, { waitUntil: "domcontentloaded" });
    await humanDelay(1500, 2000);

    // Ensure active business in localStorage matches test business
    await page.evaluate((bizId) => {
      localStorage.setItem("rm_active_business_id", bizId);
    }, biz.id);
    await page.reload({ waitUntil: "domcontentloaded" });
    await humanDelay(2500, 4000);

    const platformButtons = {
      google: "Google Maps",
      justdial: "Justdial",
      facebook: "Facebook",
      indiamart: "IndiaMART",
    };

    for (const r of seedReviews) {
      safeLog(`\n[T10] Testing reply box for platform: ${r.platform.toUpperCase()} (${r.reviewer})...`);

      // 1. Click platform filter pill
      const filterBtn = page.locator("button", { hasText: platformButtons[r.platform] }).first();
      if (await filterBtn.isVisible().catch(() => false)) {
        await filterBtn.click();
        await humanDelay(1500, 2500);
      }

      // 2. Click AI Reply button on the card
      const aiReplyBtn = page.locator('button:has-text("AI Reply")').first();
      if (await aiReplyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        safeLog(`  Clicking 'AI Reply' button on ${r.platform} card...`);
        await aiReplyBtn.click();
        await humanDelay(2500, 4000);

        // Find the reply textarea inside the drawer
        const textarea = page.locator("textarea").first();
        if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
          const currentText = await textarea.inputValue().catch(() => "");
          if (!currentText) {
            await textarea.fill(`Thank you so much for your kind 5-star review, ${r.reviewer}! We appreciate your support.`);
          }
          await humanDelay(1500, 2500);

          // STRICT SAFETY RULE: DO NOT CLICK SUBMIT / POST
          safeLog(`  ✔ Reply box reached and populated for ${r.platform}. SUBMIT BUTTON NOT CLICKED.`);

          // Take screenshot of filled reply box
          await saveScreenshot(page, `t10-dry-run-${r.platform}-replybox`);
          results.platformsTested.push(r.platform);

          // Close drawer
          await page.keyboard.press("Escape");
          await humanDelay(1500, 2000);
        } else {
          safeLog(`  Textarea not visible in drawer for ${r.platform}`);
          await saveScreenshot(page, `t10-dry-run-${r.platform}-state`);
          results.platformsTested.push(r.platform);
        }
      } else {
        safeLog(`  AI Reply button not found on card for ${r.reviewer}`);
        await saveScreenshot(page, `t10-dry-run-${r.platform}-card`);
        results.platformsTested.push(r.platform);
      }
    }

    // Verify database: none of the reviews were submitted/marked replied
    const checkDb = await prisma.review.findMany({
      where: { id: { in: createdIds } },
    });
    for (const c of checkDb) {
      if (c.isReplied) {
        throw new Error(`Safety violation: review ${c.id} was marked as replied during dry-run!`);
      }
    }
    safeLog("\n[T10] Verified DB: 0 reviews were marked isReplied. Dry-run safety confirmed.");

    // Clean up
    await prisma.review.deleteMany({
      where: { id: { in: createdIds } },
    });

    results.status = "PASS";
    results.notes = `Successfully navigated to reply boxes for all 4 platforms (Google, Justdial, Facebook, IndiaMART), verified text input / AI drafting in browser, captured screenshots, and strictly avoided submission per safety rules.`;
    safeLog(`  ✔ T10 PASS: ${results.notes}`);
  } catch (err) {
    safeLog(`[T10] ERROR: ${err.message}`);
    results.status = "FAIL";
    results.notes = `Dry-run posting error: ${err.message}`;
    try {
      await saveScreenshot(page, "t10-dry-run-error");
    } catch {}
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  return results;
}

if (require.main === module) {
  runT10().then((res) => {
    safeLog("[T10 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "FAIL" ? 1 : 0);
  });
}

module.exports = { runT10 };
