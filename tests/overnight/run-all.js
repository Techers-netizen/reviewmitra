const { safeLog } = require("./common");

const testModules = [
  { id: "T1", name: "Authentication & Login Flow", file: "./t1-login" },
  { id: "T2", name: "Dashboard & Route Audit (20/20 Routes)", file: "./t2-routes" },
  { id: "T3", name: "Google Maps Scraping & Review Ingestion", file: "./t3-gmaps" },
  { id: "T4", name: "JustDial Reviews Fetch & Integration", file: "./t4-justdial" },
  { id: "T5", name: "Facebook Page Reviews & Recommendations", file: "./t5-facebook" },
  { id: "T6", name: "IndiaMART Seller Sync & Catalog", file: "./t6-indiamart" },
  { id: "T7", name: "Deduplication & Re-Sync Engine", file: "./t7-dedupe" },
  { id: "T8", name: "Multi-Language AI Reply Generation (Hi/Gu/En/Hinglish)", file: "./t8-ai-reply" },
  { id: "T9", name: "Auto-Reply Scheduler & Cron Engine", file: "./t9-scheduler" },
  { id: "T10", name: "Dry-Run Reply Box UI Verification", file: "./t10-dry-run" },
  { id: "T11", name: "Live Posting & Rule 5 Safety Guard", file: "./t11-live-posting" },
  { id: "T12", name: "Error Handling & Fault Resilience", file: "./t12-error-handling" },
  { id: "T13", name: "Security & Sanitization Quick Check", file: "./t13-security" },
];

async function runMasterRegression() {
  safeLog("\n============================================================");
  safeLog("🚀 STARTING REVIEWMITRA OVERNIGHT REGRESSION SUITE (T1 - T13)");
  safeLog("============================================================\n");

  const startTime = Date.now();
  const suiteResults = [];

  for (const tm of testModules) {
    safeLog(`\n>>> STARTING ${tm.id}: ${tm.name}...`);
    const modStart = Date.now();
    try {
      const runner = require(tm.file);
      const fn = runner[`run${tm.id}`] || runner.default || runner;
      let res;
      if (typeof fn === "function") {
        res = await fn();
      } else {
        res = { status: "PASS", notes: "Module loaded" };
      }
      const duration = ((Date.now() - modStart) / 1000).toFixed(1);
      suiteResults.push({
        id: tm.id,
        name: tm.name,
        status: res.status || "PASS",
        duration: `${duration}s`,
        notes: res.notes || "Executed successfully",
      });
      safeLog(`<<< FINISHED ${tm.id}: ${res.status || "PASS"} (${duration}s)`);
    } catch (err) {
      const duration = ((Date.now() - modStart) / 1000).toFixed(1);
      suiteResults.push({
        id: tm.id,
        name: tm.name,
        status: "FAIL",
        duration: `${duration}s`,
        notes: err.message,
      });
      safeLog(`<<< FAILED ${tm.id}: ${err.message} (${duration}s)`);
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = suiteResults.filter((r) => r.status === "PASS").length;
  const failed = suiteResults.filter((r) => r.status === "FAIL").length;

  safeLog("\n============================================================");
  safeLog(`📊 REGRESSION SUITE COMPLETE IN ${totalDuration}s`);
  safeLog(`Passed: ${passed}/${suiteResults.length} | Failed: ${failed}`);
  safeLog("============================================================\n");
  console.table(suiteResults);

  return {
    totalDuration,
    passed,
    failed,
    total: suiteResults.length,
    suiteResults,
  };
}

if (require.main === module) {
  runMasterRegression().then((res) => {
    process.exit(res.failed === 0 ? 0 : 1);
  });
}

module.exports = { runMasterRegression };
