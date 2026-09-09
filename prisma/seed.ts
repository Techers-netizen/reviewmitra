import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const platforms = ["google", "facebook", "justdial"] as const;

const reviewSamples: Array<{
  platform: (typeof platforms)[number];
  reviewerName: string;
  rating: number;
  text: string;
  daysAgo: number;
}> = [
  // Google reviews — Smile Dental Care (Dental Clinic in Andheri, Mumbai)
  { platform: "google", reviewerName: "Rohit Sharma", rating: 5, text: "Dr. Mehta ne bahut achha treatment diya. Staff is very cooperative and clinic is super clean. Root canal was completely painless. Highly recommended for dental treatment in Andheri!", daysAgo: 0 },
  { platform: "google", reviewerName: "Priya Iyer", rating: 5, text: "Painless tooth extraction! The doctor explained every step before starting. Affordable and professional. Thank you Smile Dental Care for taking such good care of my mother.", daysAgo: 2 },
  { platform: "google", reviewerName: "Ankit Verma", rating: 2, text: "Booking online thi but 45 min wait karna pada. Treatment thik tha but time management bahut bura hai. Reception par koi proper update nahi deta.", daysAgo: 3 },
  { platform: "google", reviewerName: "Sneha Patil", rating: 4, text: "Good service overall, slightly pricey but the doctor is experienced. Waiting area could be bigger. Got my scaling done here, results were good.", daysAgo: 5 },
  { platform: "google", reviewerName: "Mohammed Ali", rating: 1, text: "Took appointment for 6pm, reached on time, was made to wait 1.5 hours. Doctor was busy with another patient. No apology from reception. Very unprofessional for a dental clinic.", daysAgo: 1 },
  { platform: "google", reviewerName: "Kavya Reddy", rating: 5, text: "Got my braces adjusted here for the past year. Dr. Mehta is patient and explains everything. Clinic is hygienic and modern equipment. Will recommend to friends.", daysAgo: 4 },

  // Facebook reviews
  { platform: "facebook", reviewerName: "Kavita Reddy", rating: 5, text: "Best dental clinic in Bandra side! Got my teeth whitening done by Dr. Mehta - absolutely loved the result. Will definitely come back for regular checkups. hygiene top notch.", daysAgo: 0 },
  { platform: "facebook", reviewerName: "Megha Singh", rating: 1, text: "Booked a cleaning appointment for 12pm, reached on time, doctor was not there. Had to wait 1 hour. No apology from staff. Very disappointed with the service.", daysAgo: 1 },
  { platform: "facebook", reviewerName: "Aisha Khan", rating: 5, text: "Loved my smile makeover! Pooja did the cleaning and Dr. Mehta did the composite bonding. The head massage chair was a bonus. Clean and friendly staff.", daysAgo: 4 },
  { platform: "facebook", reviewerName: "Deepak Nair", rating: 3, text: "Average experience. Filling was okay but the products they used seemed pricey for the small filling done. Could not get clear billing explanation.", daysAgo: 6 },

  // Justdial reviews
  { platform: "justdial", reviewerName: "Arjun Malhotra", rating: 5, text: "Best dentist in Vashi area! Dr. Mehta is amazing, personal attention given to every patient. Modern equipment and well maintained clinic. Did my root canal here.", daysAgo: 0 },
  { platform: "justdial", reviewerName: "Farhan Qureshi", rating: 2, text: "Dentist is good but AC never works properly in the waiting room. Too crowded on weekends. They need to limit appointments or expand the clinic space.", daysAgo: 2 },
  { platform: "justdial", reviewerName: "Lakshmi Menon", rating: 4, text: "Good doctors, friendly staff. Digital X-ray facility is a plus. Fees reasonable for the area. Got my cavity filling done quickly.", daysAgo: 3 },
  { platform: "justdial", reviewerName: "Vikram Joshi", rating: 5, text: "Got my root canal treatment done in 2 sittings. Dr. Mehta motivated me throughout as I was scared. Clean changing area and good post-treatment care instructions.", daysAgo: 7 },
  { platform: "justdial", reviewerName: "Pooja Bhatt", rating: 1, text: "Found the reception staff rude. Asked about insurance cashless and they said no clear answer. Doctor was fine but front desk needs training.", daysAgo: 2 },
  { platform: "justdial", reviewerName: "Imran Sheikh", rating: 4, text: "Authentic treatment, generous time given. Service a bit slow on weekends. Hygienic setup and latest dental chairs. Hyderabadi patients must try!", daysAgo: 4 },
];

function sentimentFor(rating: number) {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

async function main() {
  console.log("Seeding ReviewMitra demo data...");

  // 1. User
  const user = await db.user.upsert({
    where: { phoneNumber: "+919876543210" },
    update: {},
    create: {
      fullName: "Demo Owner",
      phoneNumber: "+919876543210",
      email: "owner@reviewmitra.demo",
      passwordHash: "demo_hash_not_real",
    },
  });

  // 2. Business
  const business = await db.business.upsert({
    where: { id: "biz_demo_smile_dental" },
    update: {},
    create: {
      id: "biz_demo_smile_dental",
      ownerId: user.id,
      businessName: "Smile Dental Care",
      category: "clinic",
      phoneSupport: "+919876543210",
      defaultTone: "friendly",
    },
  });

  // 3. Platform Connections (mock encrypted tokens - not real)
  for (const p of platforms) {
    await db.platformConnection.upsert({
      where: { businessId_platformName: { businessId: business.id, platformName: p } },
      update: {},
      create: {
        businessId: business.id,
        platformName: p,
        externalAccountId: p === "google" ? "loc_001" : p === "facebook" ? "page_001" : "jd_001",
        encryptedAccessToken: "encrypted_demo_token_" + p,
        encryptedRefreshToken: "encrypted_demo_refresh_" + p,
        tokenIv: "demo_iv",
        tokenAuthTag: "demo_tag",
        status: "connected",
        lastSyncAt: new Date(),
      },
    });
  }

  // 4. Subscription (Growth plan)
  await db.subscription.upsert({
    where: { id: "sub_demo" },
    update: {},
    create: {
      id: "sub_demo",
      businessId: business.id,
      planName: "growth_899",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      monthlyAiReplyLimit: 9999,
      aiRepliesUsed: 0,
    },
  });

  // 5. Reviews
  for (const r of reviewSamples) {
    const extId = `${r.platform}_${r.reviewerName.replace(/\s+/g, "_").toLowerCase()}_${r.daysAgo}`;
    const sentiment = sentimentFor(r.rating);
    const ts = new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000);
    await db.review.upsert({
      where: { platformName_externalReviewId: { platformName: r.platform, externalReviewId: extId } },
      update: {},
      create: {
        businessId: business.id,
        platformName: r.platform,
        externalReviewId: extId,
        reviewerName: r.reviewerName,
        reviewerAvatarUrl: null,
        rating: r.rating,
        reviewText: r.text,
        sentiment,
        reviewTimestamp: ts,
        isReplied: false,
        rawPayload: JSON.stringify({ platform: r.platform, originalTs: ts.toISOString() }),
      },
    });
  }

  const count = await db.review.count();
  console.log(`Seeded ${count} reviews for ${business.businessName}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
