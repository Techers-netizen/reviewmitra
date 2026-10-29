const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAndClean() {
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      platformName: true,
      reviewerName: true,
      rating: true,
      externalReviewId: true,
      reviewText: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total reviews in DB: ${reviews.length}`);
  const platforms = {};
  for (const r of reviews) {
    platforms[r.platformName] = (platforms[r.platformName] || 0) + 1;
  }
  console.log("By platform:", platforms);

  // Identify synthetic test reviews, seeded reviews, XSS reviews
  const testPrefixes = [
    "t8_test_",
    "t10_",
    "t11_",
    "t12_",
    "t13_",
    "test_",
    "seed_",
    "demo_",
    "mock_",
  ];

  const syntheticReviews = reviews.filter((r) => {
    const isPrefix = testPrefixes.some((p) => r.externalReviewId && r.externalReviewId.startsWith(p));
    const isXss = (r.reviewText && r.reviewText.includes("<script>")) || (r.reviewerName && r.reviewerName.includes("<script>"));
    const isMock = r.externalReviewId && (r.externalReviewId.includes("mock") || r.externalReviewId.includes("test"));
    return isPrefix || isXss || isMock;
  });

  console.log(`Found ${syntheticReviews.length} synthetic / test / XSS reviews.`);
  
  if (syntheticReviews.length > 0) {
    const idsToDelete = syntheticReviews.map((r) => r.id);
    
    // First delete any replies linked to these reviews
    const deletedReplies = await prisma.reviewReply.deleteMany({
      where: { reviewId: { in: idsToDelete } },
    });
    console.log(`Deleted ${deletedReplies.count} linked review replies.`);

    const deletedReviews = await prisma.review.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`Deleted ${deletedReviews.count} test/XSS reviews.`);
  }

  // Now check remaining reviews
  const remaining = await prisma.review.findMany({
    select: {
      id: true,
      platformName: true,
      reviewerName: true,
      rating: true,
      externalReviewId: true,
      reviewText: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nRemaining REAL reviews in DB: ${remaining.length}`);
  for (const r of remaining) {
    console.log(`- [${r.platformName.toUpperCase()}] ${r.rating}★ ${r.reviewerName}: "${(r.reviewText || '').slice(0, 80)}" (extId: ${r.externalReviewId})`);
  }
}

checkAndClean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
