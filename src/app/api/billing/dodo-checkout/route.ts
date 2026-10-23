import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateTaxBreakdown,
  createDodoCheckoutSession,
  DODO_PLANS,
  type PlanKey,
} from "@/lib/dodo-payments";

/**
 * GET /api/billing/dodo-checkout
 * Returns the active business's real Subscription & AI Reply Quota from PostgreSQL DB,
 * along with all 5 tax-exclusive plans (₹1 Live Test, ₹79, ₹149, ₹249, ₹399 + 18% GST extra).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const requestedBusinessId =
      searchParams.get("businessId") || (session?.user as any)?.businessId;

    let business: any = null;
    if (requestedBusinessId) {
      business = await db.business.findUnique({
        where: { id: requestedBusinessId },
        include: {
          subscriptions: { orderBy: { createdAt: "desc" } },
          _count: { select: { reviews: true } },
        },
      });
    }
    if (!business && (session?.user as any)?.id) {
      business = await db.business.findFirst({
        where: { ownerId: (session?.user as any).id },
        orderBy: { createdAt: "asc" },
        include: {
          subscriptions: { orderBy: { createdAt: "desc" } },
          _count: { select: { reviews: true } },
        },
      });
    }
    if (!business) {
      business = await db.business.findFirst({
        orderBy: { createdAt: "asc" },
        include: {
          subscriptions: { orderBy: { createdAt: "desc" } },
          _count: { select: { reviews: true } },
        },
      });
    }

    const activeSub = business?.subscriptions?.[0] || null;
    const planKey = (activeSub?.planName as PlanKey) || "nano_79";
    const planDef = DODO_PLANS[planKey] || DODO_PLANS.nano_79;

    const repliesCount = business
      ? await db.reviewReply.count({ where: { businessId: business.id } })
      : 0;

    return NextResponse.json({
      success: true,
      businessId: business?.id || null,
      businessName: business?.businessName || "My Business",
      subscription: {
        planKey: planDef.key,
        planName: planDef.name,
        basePriceInRupees: planDef.basePriceInRupees,
        gstAmountInRupees: calculateTaxBreakdown(planDef.key).gstAmount,
        totalWithGstInRupees: calculateTaxBreakdown(planDef.key).totalPayableByCustomer,
        taxExclusive: true,
        status: activeSub?.status || "active",
        aiRepliesUsed: activeSub?.aiRepliesUsed ?? repliesCount,
        monthlyAiReplyLimit: activeSub?.monthlyAiReplyLimit ?? planDef.monthlyLimit,
        maxBusinesses: activeSub?.maxBusinesses ?? planDef.maxBusinesses,
      },
      plans: Object.values(DODO_PLANS).map((p) => ({
        ...p,
        ...calculateTaxBreakdown(p.key),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/billing/dodo-checkout error:", err);
    return NextResponse.json(
      { error: "Failed to load subscription and billing details." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/dodo-checkout
 * Initiates a Dodo Payments checkout session with `tax_inclusive: false`
 * so 18% GST is added separately on top and paid by the customer.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { planType = "nano_79", businessId } = body;

    let business: any = null;
    const targetId = businessId || (session?.user as any)?.businessId;
    if (targetId) {
      business = await db.business.findUnique({ where: { id: targetId } });
    }
    if (!business && (session?.user as any)?.id) {
      business = await db.business.findFirst({
        where: { ownerId: (session?.user as any).id },
        orderBy: { createdAt: "asc" },
      });
    }
    if (!business) {
      business = await db.business.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!business) {
      return NextResponse.json(
        { error: "No business account found to attach subscription." },
        { status: 404 }
      );
    }

    const origin =
      req.nextUrl.origin ||
      process.env.NEXTAUTH_URL ||
      "https://reviewmitra.opensoz.com";
    const returnUrl = `${origin}/dashboard/billing?payment=success&plan=${encodeURIComponent(
      planType
    )}`;

    const { checkoutUrl, error } = await createDodoCheckoutSession({
      planType,
      businessId: business.id,
      customerEmail: session?.user?.email || "help.opensoz@gmail.com",
      customerName: session?.user?.name || business.businessName,
      returnUrl,
    });

    if (error || !checkoutUrl) {
      return NextResponse.json(
        { error: error || "Could not generate Dodo Payments checkout link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
    });
  } catch (err: any) {
    console.error("Dodo Checkout API error:", err);
    return NextResponse.json(
      { error: "Failed to initiate payment session." },
      { status: 500 }
    );
  }
}
