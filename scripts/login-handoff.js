const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SESSIONS_DIR = path.resolve(__dirname, "../qa/sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const PLATFORMS = {
  google: {
    name: "Google Business / Maps",
    startUrl: "https://accounts.google.com/ServiceLogin?service=lso",
    targetListingUrl: "https://share.google/vcSLE2StgGsjimFkX",
    checkLoggedIn: async (context, page) => {
      const cookies = await context.cookies();
      return cookies.some((c) => c.name === "SID" || c.name === "SSID" || c.name === "__Secure-1PSID");
    },
  },
  facebook: {
    name: "Facebook Page Admin",
    startUrl: "https://www.facebook.com/login",
    targetListingUrl: "https://www.facebook.com/islamiccapsrampuri/",
    checkLoggedIn: async (context, page) => {
      const cookies = await context.cookies();
      return cookies.some((c) => c.name === "c_user" || c.name === "xs");
    },
  },
  justdial: {
    name: "Justdial Vendor Portal",
    startUrl: "https://www.justdial.com/",
    targetListingUrl: "https://jsdl.in/DT-99UI6IAAQEQ",
    checkLoggedIn: async (context, page) => {
      const cookies = await context.cookies();
      return cookies.some((c) => c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("user") || c.name.toLowerCase().includes("token"));
    },
  },
  indiamart: {
    name: "IndiaMART Seller Panel",
    startUrl: "https://seller.indiamart.com/",
    targetListingUrl: "https://www.indiamart.com/vrenterpriseahmedabad/",
    checkLoggedIn: async (context, page) => {
      const cookies = await context.cookies();
      return cookies.some((c) => c.name.toLowerCase().includes("im") || c.name.toLowerCase().includes("user") || c.name.toLowerCase().includes("token") || c.name.toLowerCase().includes("glusr"));
    },
  },
};

async function injectHandoffBanner(page, platformName) {
  try {
    await page.evaluate((pName) => {
      if (document.getElementById("rm-handoff-banner")) return;
      const banner = document.createElement("div");
      banner.id = "rm-handoff-banner";
      banner.style.position = "fixed";
      banner.style.top = "10px";
      banner.style.left = "50%";
      banner.style.transform = "translateX(-50%)";
      banner.style.zIndex = "2147483647";
      banner.style.backgroundColor = "#111827";
      banner.style.color = "#ffffff";
      banner.style.padding = "12px 24px";
      banner.style.borderRadius = "12px";
      banner.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)";
      banner.style.display = "flex";
      banner.style.alignItems = "center";
      banner.style.gap = "16px";
      banner.style.fontFamily = "system-ui, -apple-system, sans-serif";
      banner.style.fontSize = "14px";
      banner.style.border = "2px solid #3b82f6";

      banner.innerHTML = `
        <span style="font-weight: 600; color: #60a5fa;">🔑 ReviewMitra Login Handoff (${pName})</span>
        <span>Please log in manually on this page. When done, click:</span>
        <button id="rm-done-btn" style="background-color: #10b981; color: white; border: none; padding: 6px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s;">
          💾 Save Session & Continue
        </button>
      `;

      document.body.appendChild(banner);
      const btn = document.getElementById("rm-done-btn");
      btn.addEventListener("click", () => {
        window.__RM_LOGIN_DONE__ = true;
        btn.innerText = "✓ Saving Session...";
        btn.style.backgroundColor = "#059669";
      });
    }, platformName);
  } catch (e) {}
}

async function runLoginHandoff(platformKey) {
  const pConfig = PLATFORMS[platformKey];
  if (!pConfig) {
    console.error(`Unknown platform: ${platformKey}. Supported: google, facebook, justdial, indiamart`);
    process.exit(1);
  }

  const sessionPath = path.join(SESSIONS_DIR, `${platformKey}-state.json`);
  console.log(`\n======================================================`);
  console.log(`▶ LAUNCHING HEADED BROWSER FOR: ${pConfig.name}`);
  console.log(`Target Session File: qa/sessions/${platformKey}-state.json`);
  console.log(`Opening URL: ${pConfig.startUrl}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
  });

  // If existing session exists, load it
  const contextOptions = {
    viewport: null, // Full window
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  };
  if (fs.existsSync(sessionPath)) {
    console.log(`[Info] Found prior session state. Loading: ${sessionPath}`);
    contextOptions.storageState = sessionPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  await page.goto(pConfig.startUrl, { waitUntil: "domcontentloaded" });
  await injectHandoffBanner(page, pConfig.name);

  // Re-inject banner on navigation
  page.on("load", async () => {
    await injectHandoffBanner(page, pConfig.name);
  });

  console.log(`\n[Instructions for User]:`);
  console.log(`1. In the opened browser window, perform your login / OTP.`);
  console.log(`2. When logged in, click the green "💾 Save Session & Continue" button at top, OR press ENTER here in this console.\n`);

  // Wait loop for either:
  // 1. window.__RM_LOGIN_DONE__ flag set by clicking the banner button
  // 2. Or user presses Enter / closes page / automated detection
  const checkInterval = 1000;
  let isDone = false;

  // Listen for Enter in terminal if interactive
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode) process.stdin.setRawMode(true);
    process.stdin.on("keypress", (str, key) => {
      if (key.name === "return" || key.name === "enter") {
        isDone = true;
      }
      if (key.ctrl && key.name === "c") {
        process.exit(0);
      }
    });
  }

  const timeoutMs = 180000; // 3 minutes wait max
  const startTime = Date.now();

  while (!isDone && Date.now() - startTime < timeoutMs) {
    if (page.isClosed()) {
      console.log(`Page was closed by user.`);
      break;
    }

    try {
      const clicked = await page.evaluate(() => window.__RM_LOGIN_DONE__).catch(() => false);
      if (clicked) {
        console.log(`\n✓ Detected "Save Session & Continue" button click!`);
        isDone = true;
        break;
      }

      // Check auto logged in
      const autoLogged = await pConfig.checkLoggedIn(context, page).catch(() => false);
      if (autoLogged) {
        // Just inform, but give user a chance to reach final page
      }
    } catch (e) {}

    await new Promise((r) => setTimeout(r, checkInterval));
  }

  console.log(`\nSaving authenticated storage state to: ${sessionPath}...`);
  await context.storageState({ path: sessionPath });
  console.log(`✓ Session successfully saved to: qa/sessions/${platformKey}-state.json`);

  // Navigate to target listing URL to verify logged-in view
  console.log(`Verifying target listing view: ${pConfig.targetListingUrl}...`);
  try {
    await page.goto(pConfig.targetListingUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 3000));
    const shotPath = path.resolve(__dirname, `../reports/shots/handoff-${platformKey}-verified.png`);
    await page.screenshot({ path: shotPath });
    console.log(`✓ Verified view screenshot saved: reports/shots/handoff-${platformKey}-verified.png`);
  } catch (err) {
    console.log(`Warning during verification navigation: ${err.message}`);
  }

  await browser.close();
  console.log(`[Handoff Complete] Finished for ${platformKey}.\n`);
}

async function main() {
  const target = process.argv[2] || "google";
  if (target === "all") {
    for (const p of Object.keys(PLATFORMS)) {
      await runLoginHandoff(p);
    }
  } else {
    await runLoginHandoff(target);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runLoginHandoff, PLATFORMS };
