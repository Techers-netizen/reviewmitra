const https = require('https');

const host = 'ep-restless-smoke-b50lwqf3-pooler.c-7.us-east-2.aws.neon.tech';
const conn = 'postgresql://neondb_owner:npg_xK3PWDFuHB9z@ep-restless-smoke-b50lwqf3-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT PRIMARY KEY,
    "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "businessName" TEXT NOT NULL,
    "category" TEXT,
    "phoneSupport" TEXT,
    "defaultTone" TEXT NOT NULL DEFAULT 'friendly',
    "autoReplyPositive" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyNeutral" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyDelay" INTEGER NOT NULL DEFAULT 5,
    "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "notifyWhatsappNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "PlatformConnection" (
    "id" TEXT PRIMARY KEY,
    "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
    "platformName" TEXT NOT NULL,
    "externalAccountId" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenIv" TEXT,
    "tokenAuthTag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformConnection_businessId_platformName_key" UNIQUE ("businessId", "platformName")
  )`,

  `CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT PRIMARY KEY,
    "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
    "platformName" TEXT NOT NULL,
    "externalReviewId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerAvatarUrl" TEXT,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "reviewTimestamp" TIMESTAMP(3) NOT NULL,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_platformName_externalReviewId_key" UNIQUE ("platformName", "externalReviewId")
  )`,

  `CREATE INDEX IF NOT EXISTS "Review_businessId_reviewTimestamp_idx" ON "Review"("businessId", "reviewTimestamp")`,

  `CREATE TABLE IF NOT EXISTS "ReviewReply" (
    "id" TEXT PRIMARY KEY,
    "reviewId" TEXT NOT NULL REFERENCES "Review"("id") ON DELETE CASCADE,
    "businessId" TEXT NOT NULL,
    "replyText" TEXT NOT NULL,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT true,
    "aiToneUsed" TEXT,
    "postStatus" TEXT NOT NULL DEFAULT 'posted',
    "isAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT PRIMARY KEY,
    "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
    "planName" TEXT NOT NULL,
    "razorpaySubscriptionId" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" TIMESTAMP(3),
    "monthlyAiReplyLimit" INTEGER NOT NULL DEFAULT 100,
    "aiRepliesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: host,
      path: '/sql',
      method: 'POST',
      family: 4,
      headers: {
        'Neon-Connection-String': conn,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function migrate() {
  console.log('Starting migration to Neon Cloud PostgreSQL...');
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.trim().split('\n')[0];
    try {
      await runQuery(stmt);
      console.log(`[${i + 1}/${statements.length}] SUCCESS: ${preview}`);
    } catch (err) {
      console.error(`[${i + 1}/${statements.length}] FAILED: ${preview}\n`, err.message);
      process.exit(1);
    }
  }
  console.log('\nAll tables created successfully in Neon Cloud PostgreSQL!');
}

migrate();
