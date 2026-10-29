const {
  safeLog,
  humanDelay,
  launchBrowser,
  saveScreenshot,
  BASE_URL,
  CREDENTIALS,
} = require("./common");

async function runT2() {
  safeLog("\n==========================================");
  safeLog("▶ RUNNING TEST T2: DASHBOARD & ROUTES AUDIT");
  safeLog("==========================================");

  const { browser, context } = await launchBrowser(true);
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore normal telemetry/font/icon 404 warnings if any
      if (!text.includes("favicon") && !text.includes("Turbopack")) {
        consoleErrors.push(text);
      }
    }
  });

  const routesToTest = [
    // Public routes
    { path: "/", name: "home", auth: false },
    { path: "/features", name: "features", auth: false },
    { path: "/pricing", name: "pricing", auth: false },
    { path: "/about", name: "about", auth: false },
    { path: "/contact", name: "contact", auth: false },
    { path: "/privacy", name: "privacy", auth: false },
    { path: "/terms", name: "terms", auth: false },
    { path: "/refund-policy", name: "refund-policy", auth: false },
    { path: "/login", name: "login", auth: false },
    { path: "/signup", name: "signup", auth: false },

    // Dashboard routes (require login)
    { path: "/dashboard", name: "dashboard-overview", auth: true },
    { path: "/dashboard/reviews", name: "dashboard-reviews", auth: true },
    { path: "/dashboard/connect", name: "dashboard-connect", auth: true },
    { path: "/dashboard/auto-reply", name: "dashboard-auto-reply", auth: true },
    { path: "/dashboard/qr-booster", name: "dashboard-qr-booster", auth: true },
    { path: "/dashboard/analytics", name: "dashboard-analytics", auth: true },
    { path: "/dashboard/billing", name: "dashboard-billing", auth: true },
    { path: "/dashboard/settings", name: "dashboard-settings", auth: true },
    { path: "/dashboard/guide", name: "dashboard-guide", auth: true },
    { path: "/dashboard/help", name: "dashboard-help", auth: true },
  ];

  const results = {
    test: "T2",
    name: "Dashboard & Routes Audit",
    totalTested: 0,
    passedRoutes: [],
    failedRoutes: [],
    brokenLinks: [],
    consoleErrors: [],
    status: "FAIL",
    notes: "",
  };

  try {
    // 1. Establish session first via /login
    safeLog("[T2] Logging in to establish authenticated session for dashboard routes...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 10000 }).catch(async () => {
      safeLog("[T2] Navigating directly to /dashboard after login credentials dispatched...");
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    });
    await humanDelay(2000, 3000);

    // 2. Iterate through all routes
    for (const route of routesToTest) {
      results.totalTested++;
      const fullUrl = `${BASE_URL}${route.path}`;
      safeLog(`[T2] Testing route [${route.name}]: ${route.path}`);

      let pageStatus = 200;
      let hasErrorUi = false;

      try {
        const response = await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (response) {
          pageStatus = response.status();
        }
        await humanDelay(1000, 2000);

        // Check for 404 or 500 in body
        const bodyText = await page.innerText("body").catch(() => "");
        if (
          pageStatus >= 400 ||
          bodyText.includes("404 - This page could not be found") ||
          bodyText.includes("Application error: a client-side exception") ||
          bodyText.includes("Internal Server Error")
        ) {
          hasErrorUi = true;
        }

        // Take screenshot
        await saveScreenshot(page, `t2-route-${route.name}`);

        if (pageStatus === 200 && !hasErrorUi) {
          safeLog(`  ✔ [${route.name}] PASS (HTTP ${pageStatus})`);
          results.passedRoutes.push(route.path);
        } else {
          safeLog(`  ✖ [${route.name}] FAIL (HTTP ${pageStatus}, ErrorUi: ${hasErrorUi})`);
          results.failedRoutes.push({ path: route.path, status: pageStatus });
        }

        // Audit links on this page (sample up to 5 internal links)
        const links = await page
          .$$eval("a[href]", (anchors) =>
            anchors
              .map((a) => a.getAttribute("href"))
              .filter((h) => h && h.startsWith("/") && !h.startsWith("/#") && !h.startsWith("/api/"))
          )
          .catch(() => []);

        for (const link of links.slice(0, 5)) {
          if (link.includes("businessId")) continue;
          try {
            const linkRes = await page.request.get(`${BASE_URL}${link}`);
            if (linkRes.status() >= 400) {
              results.brokenLinks.push({ from: route.path, to: link, status: linkRes.status() });
              safeLog(`  ⚠ Broken link found: ${route.path} -> ${link} (HTTP ${linkRes.status()})`);
            }
          } catch {}
        }
      } catch (routeErr) {
        safeLog(`  ✖ [${route.name}] EXCEPTION: ${routeErr.message}`);
        results.failedRoutes.push({ path: route.path, error: routeErr.message });
      }
    }

    results.consoleErrors = [...new Set(consoleErrors)];

    const allPassed = results.failedRoutes.length === 0;
    results.status = allPassed ? "PASS" : "FAIL";
    results.notes = `Tested ${results.totalTested} routes. Passed: ${results.passedRoutes.length}. Failed: ${results.failedRoutes.length}. Broken links: ${results.brokenLinks.length}.`;
    safeLog(`[T2] FINAL STATUS: ${results.status} (${results.passedRoutes.length}/${results.totalTested} passed)`);
  } catch (err) {
    safeLog("[T2] CRITICAL ERROR:", err.message);
    results.status = "FAIL";
    results.notes = `Exception during route audit: ${err.message}`;
  } finally {
    await browser.close();
  }

  return results;
}

if (require.main === module) {
  runT2().then((res) => {
    safeLog("[T2 RESULT]", JSON.stringify(res, null, 2));
    process.exit(res.status === "PASS" ? 0 : 1);
  });
}

module.exports = { runT2 };
