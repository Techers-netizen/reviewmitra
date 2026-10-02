import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RAZORPAY_PLANS } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { planName = "starter_499", businessId } = body;

    const plan = RAZORPAY_PLANS[planName] || RAZORPAY_PLANS.starter_499;

    let business: any = null;
    if (businessId) {
      business = await db.business.findUnique({ where: { id: businessId } });
    }
    if (!business) {
      business = await db.business.findFirst({ orderBy: { createdAt: "asc" } });
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // In production with real Razorpay:
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_reviewmitra";
    const subId = `sub_${Date.now()}`;

    // Upsert subscription in DB
    await db.subscription.upsert({
      where: {
        id: `sub_${business.id}`,
      },
      update: {
        planName,
        razorpaySubscriptionId: subId,
        status: "active",
        monthlyAiReplyLimit: plan.monthlyAiLimit,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: `sub_${business.id}`,
        businessId: business.id,
        planName,
        razorpaySubscriptionId: subId,
        status: "active",
        monthlyAiReplyLimit: plan.monthlyAiLimit,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subId,
      keyId,
      planName: plan.name,
      amount: plan.priceInPaisa,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      { error: "Subscription create karne me samasya aayi." },
      { status: 500 }
    );
  }
}
