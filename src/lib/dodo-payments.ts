import { db } from "@/lib/db";

const DODO_API_URL = "https://live.dodopayments.com";
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "VtAyLHQCUegaITiz.nwpphjXN0r7xgmf04E461acyqcKMFeWWOfUmpQug-nb6gNLF";

export const DODO_PLANS = {
  starter: {
    productId: process.env.DODO_STARTER_PRODUCT_ID || "pdt_0NpLhuafGIqaS69EDMEHG",
    name: "Starter Plan",
    priceInRupees: 399,
    monthlyLimit: 100,
  },
  growth: {
    productId: process.env.DODO_GROWTH_PRODUCT_ID || "pdt_0NpLhufWgcC5psyOcez25",
    name: "Growth Plan",
    priceInRupees: 799,
    monthlyLimit: 1000,
  },
};

export interface CreateCheckoutParams {
  planType: "starter" | "growth";
  businessId: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl?: string;
}

/**
 * Creates a hosted checkout session on Dodo Payments
 */
export async function createDodoCheckoutSession({
  planType,
  businessId,
  customerEmail,
  customerName,
  returnUrl,
}: CreateCheckoutParams): Promise<{ checkoutUrl: string; error?: string }> {
  try {
    const plan = DODO_PLANS[planType];
    if (!plan) {
      return { checkoutUrl: "", error: "Invalid subscription plan selected" };
    }

    const defaultReturn = `${
      process.env.NEXTAUTH_URL || "https://reviewmitra.vercel.app"
    }/dashboard/billing?payment=success&plan=${planType}`;

    const payload = {
      product_cart: [{ product_id: plan.productId, quantity: 1 }],
      return_url: returnUrl || defaultReturn,
      customer: {
        email: customerEmail || "customer@opensoz.com",
        name: customerName || "Business Owner",
      },
      metadata: {
        businessId,
        planType,
        planName: plan.name,
      },
    };

    const res = await fetch(`${DODO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Dodo Payments checkout creation failed:", res.status, errText);
      return { checkoutUrl: "", error: `Dodo API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { checkoutUrl: data.checkout_url };
  } catch (err: any) {
    console.error("Dodo Payments exception:", err);
    return { checkoutUrl: "", error: err?.message || "Failed to initiate payment checkout" };
  }
}

/**
 * Handles incoming Dodo Payments webhooks (payment.succeeded, subscription.active)
 */
export async function handleDodoWebhookEvent(event: any) {
  const eventType = event.type || event.event;
  const data = event.data || event;

  console.log("Processing Dodo Webhook event:", eventType);

  if (eventType === "payment.succeeded" || eventType === "payment_succeeded") {
    const businessId = data.metadata?.businessId;
    const planType = data.metadata?.planType || "starter";
    const paymentId = data.payment_id || data.id;

    if (businessId) {
      const limit = planType === "growth" ? 1000 : 100;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // 30 days access

      await db.subscription.upsert({
        where: { businessId },
        update: {
          planName: `${planType}_${planType === "growth" ? "799" : "399"}`,
          dodoPaymentId: paymentId,
          status: "active",
          monthlyAiReplyLimit: limit,
          currentPeriodEnd: periodEnd,
        },
        create: {
          businessId,
          planName: `${planType}_${planType === "growth" ? "799" : "399"}`,
          dodoPaymentId: paymentId,
          status: "active",
          monthlyAiReplyLimit: limit,
          currentPeriodEnd: periodEnd,
        },
      });

      console.log(`Updated subscription for business ${businessId} to active ${planType}`);
    }
  }

  return { received: true };
}
