// Deletes the temporary E2E test data created by test-seed.mjs.
// Run:  node worker/test-cleanup.mjs <businessId>
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const businessId = process.argv[2];
if (!businessId) {
  console.error("usage: node worker/test-cleanup.mjs <businessId>");
  process.exit(1);
}
await db.reviewReply.deleteMany({ where: { businessId } });
await db.review.deleteMany({ where: { businessId } });
await db.business.delete({ where: { id: businessId } });
await db.user.deleteMany({ where: { email: "worker-test@reviewmitra.local" } });
console.log(JSON.stringify({ cleaned: businessId }));
await db.$disconnect();
