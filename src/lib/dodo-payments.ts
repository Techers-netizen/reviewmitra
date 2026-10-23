import { db } from "@/lib/db";

const DODO_API_URL = "https://live.dodopayments.com";
const DODO_API_KEY =
  process.env.DODO_PAYMENTS_API_KEY ||
  "VtAyLHQCUegaITiz.nwpphjXN0r7xgmf04E461acyqcKMFeWWOfUmpQug-nb6gNLF";

export type PlanKey = "test_1" | "nano_79" | "starter_149" | "growth_249" | "pro_399";

export interface DodoPlanDefinition {
  key: PlanKey;
  productId: string;
  name: string;
  tagline: string;
  basePriceInRupees: number; // Base price before 18% GST (tax_inclusive: false)
  gstRatePercent: number;    // 18% GST paid by customer at checkout
  monthlyLimit: number;
  maxBusinesses: number;
  taxInclusive: false;       // Explicitly false so customer pays GST on top
}

/**
 * Affordable MSME Pricing Plans with >30% Net Profit Margin after all AI, DB, Scraper & PG costs.
 * All plans are strictly TAX EXCLUSIVE (`tax_inclusive: false`) so 18% GST is added on top at checkout
 * and paid by the customer, preserving 100% of your base plan price.
 */
export const DODO_PLANS: Record<PlanKey, DodoPlanDefinition> = {
  test_1: {
    key: "test_1",
    productId: process.env.DODO_TEST_PRODUCT_ID || "pdt_test_1_rupee",
    name: "Live Verification Test (₹1)",
    tagline: "1-time live payment & webhook test before launch",
    basePriceInRupees: 1,
    gstRatePercent: 18,
    monthlyLimit: 5,
    maxBusinesses: 1,
    taxInclusive: false,
  },
  nano_79: {
    key: "nano_79",
    productId: process.env.DODO_NANO_PRODUCT_ID || "pdt_0NpLhuafGIqaS69EDMEHG",
    name: "Nano Plan",
    tagline: "For small single-counter shops & kirana stores",
    basePriceInRupees: 79,
    gstRatePercent: 18,
    monthlyLimit: 100,
    maxBusinesses: 1,
    taxInclusive: false,
  },
  starter_149: {
    key: "starter_149",
    productId: process.env.DODO_STARTER_PRODUCT_ID || "pdt_0NpLhuafGIqaS69EDMEHG",
    name: "Starter Plan",
    tagline: "Ideal for clinics, salons & local cafes",
    basePriceInRupees: 149,
    gstRatePercent: 18,
    monthlyLimit: 500,
    maxBusinesses: 1,
    taxInclusive: false,
  },
  growth_249: {
    key: "growth_249",
    productId: process.env.DODO_GROWTH_PRODUCT_ID || "pdt_0NpLhufWgcC5psyOcez25",
    name: "Growth Plan",
    tagline: "For busy businesses with up to 2 locations",
    basePriceInRupees: 249,
    gstRatePercent: 18,
    monthlyLimit: 1000,
    maxBusinesses: 2,
    taxInclusive: false,
  },
  pro_399: {
    key: "pro_399",
    productId: process.env.DODO_PRO_PRODUCT_ID || "pdt_0NpLhufWgcC5psyOcez25",
    name: "Pro Unlimited Plan",
    tagline: "High-volume chains & multi-outlet brands (up to 5 locations)",
    basePriceInRupees: 399,
    gstRatePercent: 18,
    monthlyLimit: 2500,
    maxBusinesses: 5,
    taxInclusive: false,
  },
};

export function calculateTaxBreakdown(planKey: PlanKey) {
  const plan = DODO_PLANS[planKey] || DODO_PLANS.nano_79;
  const gstAmount = Number(((plan.basePriceInRupees * plan.gstRatePercent) / 100).toFixed(2));
  const totalPayableByCustomer = Number((plan.basePriceInRupees + gstAmount).toFixed(2));
  return {
    basePrice: plan.basePriceInRupees,
    gstAmount,
    totalPayableByCustomer,
    taxExclusive: true as const,
  };
}

export interface CreateCheckoutParams {
  planType: PlanKey | "starter" | "growth";
  businessId: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl?: string;
}

/**
 * Ensures the product in Dodo Payments has `price.tax_inclusive = false`
 * so 18% GST is added on top and paid by the customer at checkout.
 */
export async function enforceTaxExclusiveOnDodoProduct(
  productId: string,
  basePriceInRupees: number,
  isOneTime = false
): Promise<void> {
  try {
    const priceInPaisa = Math.round(basePriceInRupees * 100);
    await fetch(`${DODO_API_URL}/products/${productId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tax_category: "saas",
        price: isOneTime
          ? {
              type: "one_time_price",
              currency: "INR",
              price: priceInPaisa,
              discount_bps: 0,
              purchasing_power_parity: false,
              tax_inclusive: false, // Customer pays 18% GST separately on top
            }
          : {
              type: "recurring_price",
              currency: "INR",
              price: priceInPaisa,
              discount_bps: 0,
              payment_frequency_count: 1,
              payment_frequency_interval: "Month",
              subscription_period_count: 12,
              subscription_period_interval: "Year",
              purchasing_power_parity: false,
              tax_inclusive: false, // Customer pays 18% GST separately on top
            },
      }),
    });
  } catch (e) {
    console.warn("Could not auto-patch Dodo product tax_inclusive=false:", e);
  }
}

/**
 * Creates a hosted checkout session on Dodo Payments with GST Exclusive pricing (+18% GST paid by user).
 */
export async function createDodoCheckoutSession({
  planType,
  businessId,
  customerEmail,
  customerName,
  returnUrl,
}: CreateCheckoutParams): Promise<{ checkoutUrl: string; error?: string; breakdown?: any }> {
  try {
    // Map legacy keys if passed
    const normalizedKey: PlanKey =
      planType === "starter"
        ? "starter_149"
        : planType === "growth"
        ? "growth_249"
        : (planType as PlanKey);

    const plan = DODO_PLANS[normalizedKey];
    if (!plan) {
      return { checkoutUrl: "", error: "Invalid subscription plan selected" };
    }

    // Ensure product is configured as tax_inclusive: false before checkout
    await enforceTaxExclusiveOnDodoProduct(
      plan.productId,
      plan.basePriceInRupees,
      normalizedKey === "test_1"
    );

    const defaultReturn = `${
      process.env.NEXTAUTH_URL || "https://reviewmitra.opensoz.com"
    }/dashboard/billing?payment=success&plan=${normalizedKey}`;

    const gstAmount = Number(((plan.basePriceInRupees * plan.gstRatePercent) / 100).toFixed(2));
    const totalPayableByCustomer = Number((plan.basePriceInRupees + gstAmount).toFixed(2));

    const payload = {
      product_cart: [{ product_id: plan.productId, quantity: 1 }],
      return_url: returnUrl || defaultReturn,
      customer: {
        email: customerEmail || "help.opensoz@gmail.com",
        name: customerName || "Business Owner",
      },
      billing_currency: "INR",
      metadata: {
        businessId,
        planType: normalizedKey,
        planName: plan.name,
        basePriceInr: String(plan.basePriceInRupees),
        gstExclusive: "true",
        gstAmountInr: String(gstAmount),
        totalPayableInr: String(totalPayableByCustomer),
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
    return {
      checkoutUrl: data.checkout_url,
      breakdown: {
        basePrice: plan.basePriceInRupees,
        gst18Percent: gstAmount,
        totalPayable: totalPayableByCustomer,
        taxInclusive: false,
      },
    };
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

  if (
    eventType === "payment.succeeded" ||
    eventType === "payment_succeeded" ||
    eventType === "subscription.active"
  ) {
    const businessId = data.metadata?.businessId;
    const planKey = (data.metadata?.planType || "starter_149") as PlanKey;
    const paymentId = data.payment_id || data.id;
    const plan = DODO_PLANS[planKey] || DODO_PLANS.starter_149;

    if (businessId) {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + (planKey === "test_1" ? 7 : 30));

      const existing = await db.subscription.findFirst({
        where: { businessId },
      });

      if (existing) {
        await db.subscription.update({
          where: { id: existing.id },
          data: {
            planName: plan.key,
            dodoPaymentId: paymentId,
            status: "active",
            taxExclusive: true,
            monthlyAiReplyLimit: plan.monthlyLimit,
            maxBusinesses: plan.maxBusinesses,
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        await db.subscription.create({
          data: {
            businessId,
            planName: plan.key,
            dodoPaymentId: paymentId,
            status: "active",
            taxExclusive: true,
            monthlyAiReplyLimit: plan.monthlyLimit,
            maxBusinesses: plan.maxBusinesses,
            currentPeriodEnd: periodEnd,
          },
        });
      }
    }
  }

  return { received: true };
}
