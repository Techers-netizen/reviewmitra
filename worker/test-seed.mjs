// Temporary E2E test seed for the worker dry-run plumbing test.
// Creates a test user + business (New Lucky Restaurant, Mumbai) + one
// Google review, prints their IDs as JSON, and NOTHING else.
// Run:  node worker/test-seed.mjs
// Clean up: node worker/test-cleanup.mjs <businessId>
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const user = await db.user.upsert({
  where: { email: "worker-test@reviewmitra.local" },
  update: {},
  create: {
    fullName: "Worker Test Owner",
    email: "worker-test@reviewmitra.local",
    authProvider: "email",
  },
});
const business = await db.business.create({
  data: {
    ownerId: user.id,
    businessName: "New Lucky Restaurant",
    category: "restaurant",
    city: "Mumbai",
    googleReviewUrl: "https://share.google/Rd7mruMQjwTihYs01",
  },
});
const review = await db.review.create({
  data: {
    businessId: business.id,
    platformName: "google",
    externalReviewId: "test-external-review-1",
    reviewerName: "Test Reviewer",
    rating: 5,
    reviewText: "Great biryani and quick service, loved it.",
    sentiment: "positive",
    reviewTimestamp: new Date(),
  },
});
console.log(JSON.stringify({ userId: user.id, businessId: business.id, reviewId: review.id }));
await db.$disconnect();
