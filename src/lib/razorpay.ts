import crypto from "crypto";

export interface PlanConfig {
  id: string;
  name: string;
  priceInPaisa: number;
  monthlyAiLimit: number;
}

export const RAZORPAY_PLANS: Record<string, PlanConfig> = {
  starter_499: {
    id: "plan_starter_499",
    name: "Starter Plan",
    priceInPaisa: 49900, // ₹499
    monthlyAiLimit: 100,
  },
  growth_899: {
    id: "plan_growth_899",
    name: "Growth Plan",
    priceInPaisa: 89900, // ₹899
    monthlyAiLimit: 999999, // Unlimited
  },
};

/**
 * Verifies Razorpay webhook signature using HMAC SHA256.
 */
export function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (err) {
    return false;
  }
}
