const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

// Load .env manually if not already in process.env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash("sha256").update(`reviewmitra_salt_${password}`).digest("hex");
}

async function prepare() {
  const email = (process.env.REVIEWMITRA_EMAIL || "publicdocc@gmail.com").toLowerCase().trim();
  const password = process.env.REVIEWMITRA_PASSWORD || "zahid@2005";
  const phone = process.env.OWNER_PHONE || "7698453768";
  const passwordHash = hashPassword(password);

  console.log(`[DB-PREP] Checking user for email: ${email}`);

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      businesses: {
        include: {
          connections: true,
          subscriptions: true,
        },
      },
    },
  });

  if (!user) {
    console.log("[DB-PREP] Creating user account...");
    user = await prisma.user.create({
      data: {
        email,
        fullName: "Business Owner",
        phoneNumber: phone,
        passwordHash,
        authProvider: "both",
        emailVerified: true,
        businesses: {
          create: {
            businessName: "Islamic Caps Rampuri",
            category: "retail",
            defaultTone: "polite",
            matchReviewLanguage: true,
            autoReplyPositive: true,
            autoReplyNeutral: true,
            phoneSupport: phone,
            googleReviewUrl: process.env.GMAPS_URL,
            justdialUrl: process.env.JUSTDIAL_URL,
            facebookPageUrl: process.env.FACEBOOK_URL,
            indiamartUrl: process.env.INDIAMART_URL,
            notifyWhatsapp: true,
            notifyWhatsappNumber: phone,
            subscriptions: {
              create: {
                planName: "pro_399",
                status: "active",
                monthlyAiReplyLimit: 500,
                maxBusinesses: 5,
                aiRepliesUsed: 0,
              },
            },
          },
        },
      },
      include: {
        businesses: {
          include: {
            connections: true,
            subscriptions: true,
          },
        },
      },
    });
    console.log(`[DB-PREP] Created user: ${user.id}`);
  } else {
    console.log(`[DB-PREP] User found: ${user.id}. Updating password hash & verified status...`);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
        phoneNumber: phone,
      },
      include: {
        businesses: {
          include: {
            connections: true,
            subscriptions: true,
          },
        },
      },
    });

    if (user.businesses.length === 0) {
      console.log("[DB-PREP] User has no businesses, creating default business...");
      await prisma.business.create({
        data: {
          ownerId: user.id,
          businessName: "Islamic Caps Rampuri",
          category: "retail",
          defaultTone: "polite",
          matchReviewLanguage: true,
          autoReplyPositive: true,
          autoReplyNeutral: true,
          phoneSupport: phone,
          googleReviewUrl: process.env.GMAPS_URL,
          justdialUrl: process.env.JUSTDIAL_URL,
          facebookPageUrl: process.env.FACEBOOK_URL,
          indiamartUrl: process.env.INDIAMART_URL,
          notifyWhatsapp: true,
          notifyWhatsappNumber: phone,
          subscriptions: {
            create: {
              planName: "pro_399",
              status: "active",
              monthlyAiReplyLimit: 500,
              maxBusinesses: 5,
              aiRepliesUsed: 0,
            },
          },
        },
      });
    } else {
      // Update business with platform URLs
      const biz = user.businesses[0];
      await prisma.business.update({
        where: { id: biz.id },
        data: {
          businessName: "Islamic Caps Rampuri",
          googleReviewUrl: process.env.GMAPS_URL,
          justdialUrl: process.env.JUSTDIAL_URL,
          facebookPageUrl: process.env.FACEBOOK_URL,
          indiamartUrl: process.env.INDIAMART_URL,
          phoneSupport: phone,
          notifyWhatsappNumber: phone,
        },
      });
    }
  }

  // Also check PlatformConnection entries for the 4 platforms
  const finalUser = await prisma.user.findUnique({
    where: { email },
    include: { businesses: { include: { connections: true } } },
  });
  const bizId = finalUser.businesses[0].id;
  console.log(`[DB-PREP] Verified business ready: ID = ${bizId}`);
}

prepare()
  .then(() => {
    console.log("[DB-PREP] Ready for automated Playwright testing!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[DB-PREP] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
