import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDodoCheckoutSession } from "@/lib/dodo-payments";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { planType = "starter" } = body;

    let business: any = null;

    const userId = (session?.user as any)?.id;
    if (userId) {
      business = await db.business.findFirst({
        where: { ownerId: userId },
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

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "https://reviewmitra.vercel.app";
    const returnUrl = `${origin}/dashboard/billing?payment=success&plan=${planType}`;

    const { checkoutUrl, error } = await createDodoCheckoutSession({
      planType: planType as "starter" | "growth",
      businessId: business.id,
      customerEmail: session?.user?.email || "owner@opensoz.com",
      customerName: session?.user?.name || business.businessName,
      returnUrl,
    });

    if (error || !checkoutUrl) {
      return NextResponse.json({ error: error || "Could not generate checkout link" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
    });
  } catch (err: any) {
    console.error("Dodo Checkout API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
