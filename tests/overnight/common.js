const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

// Load .env
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SHOTS_DIR = path.resolve(__dirname, "../../reports/shots");
if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

function mask(val) {
  if (!val || typeof val !== "string") return "****";
  if (val.length <= 4) return "****";
  return val.slice(0, 2) + "****" + val.slice(-2);
}

function safeLog(...args) {
  const sensitive = [
    process.env.REVIEWMITRA_PASSWORD,
    process.env.OWNER_PHONE,
  ].filter(Boolean);

  const cleanArgs = args.map((arg) => {
    if (typeof arg === "string") {
      let str = arg;
      for (const s of sensitive) {
        if (s && str.includes(s)) {
          str = str.split(s).join(mask(s));
        }
      }
      return str;
    }
    return arg;
  });
  console.log(...cleanArgs);
}

function humanDelay(min = 2000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function launchBrowser(headless = true) {
  const browser = await chromium.launch({
    headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  });

  return { browser, context };
}

async function saveScreenshot(page, filename) {
  const target = path.join(SHOTS_DIR, filename.endsWith(".png") ? filename : `${filename}.png`);
  // Mask any password input elements visually before taking screenshot
  try {
    await page.evaluate(() => {
      document.querySelectorAll('input[type="password"]').forEach((el) => {
        el.value = "••••••••";
      });
    });
  } catch (e) {}
  await page.screenshot({ path: target, fullPage: false });
  safeLog(`[SCREENSHOT] Saved: reports/shots/${path.basename(target)}`);
  return target;
}

module.exports = {
  mask,
  safeLog,
  humanDelay,
  launchBrowser,
  saveScreenshot,
  SHOTS_DIR,
  BASE_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  CREDENTIALS: {
    email: process.env.REVIEWMITRA_EMAIL || "publicdocc@gmail.com",
    password: process.env.REVIEWMITRA_PASSWORD || "",
    phone: process.env.OWNER_PHONE || "",
    gmapsUrl: process.env.GMAPS_URL || "",
    justdialUrl: process.env.JUSTDIAL_URL || "",
    facebookUrl: process.env.FACEBOOK_URL || "",
    indiamartUrl: process.env.INDIAMART_URL || "",
  },
};
