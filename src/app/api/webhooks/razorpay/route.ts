import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature if secret configured
    if (webhookSecret && signature) {
      const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const subscriptionEntity = payload.payload?.subscription?.entity;

    if (!subscriptionEntity) {
      return NextResponse.json({ received: true });
    }

    const subId = subscriptionEntity.id;

    switch (event) {
      case "subscription.activated":
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: subId },
          data: { status: "active" },
        });
        break;

      case "subscription.charged":
        // Reset monthly usage on successful cycle renewal
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: subId },
          data: {
            status: "active",
            aiRepliesUsed: 0,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        break;

      case "subscription.cancelled":
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: subId },
          data: { status: "cancelled" },
        });
        break;
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
