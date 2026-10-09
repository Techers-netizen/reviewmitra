import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | ReviewMitra by OpenSoz",
  description: "Official cancellation and non-refundable subscription policy for ReviewMitra SaaS.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <Link href="/" className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-2">
            <RefreshCcw size={16} /> Commercial Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective Date: October 2026 · ReviewMitra by OpenSoz (reviewmitra.opensoz.com)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Important Highlight Box */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base text-amber-800">
              <AlertCircle size={20} />
              Important Notice: Strict Non-Refundable Policy
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90">
              ReviewMitra provides a full-featured <span className="font-bold underline">7-Day Free Trial</span> with no credit card required so that every business owner can thoroughly test all review aggregation, AI responses, and QR booster features prior to payment. Consequently, <span className="font-bold">all paid subscription fees are strictly non-refundable</span> once processed.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. 7-Day Risk-Free Trial Period
            </h2>
            <p>
              We believe in complete transparency. Every new business account registered on ReviewMitra receives a complimentary 7-day trial period with full access to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Multi-platform integration with Google, Facebook, and Justdial.</li>
              <li>AI-powered review generation and auto-reply testing.</li>
              <li>Unified inbox management and review QR code generation.</li>
            </ul>
            <p>
              During this trial, no payment method is required. You are encouraged to evaluate the software to ensure it satisfies your operational needs before committing to a paid tier.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Non-Refundable Subscription Policy
            </h2>
            <p>
              Upon the conclusion of your trial period, upgrading to a paid subscription (Starter at ₹399/mo or Growth at ₹799/mo) initiates immediate recurring billing via our payment processor, <span className="font-semibold text-slate-900">Dodo Payments</span>.
            </p>
            <p>
              Due to the immediate allocation of dedicated server resources, third-party LLM API token costs, and automated database sync infrastructure upon activation:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-bold text-slate-900">No Partial or Full Refunds:</span> We do not offer refunds, credits, or prorated charges for partially used billing cycles.
              </li>
              <li>
                <span className="font-bold text-slate-900">Digital SaaS Delivery:</span> Access to the software and AI quota is delivered digitally and immediately upon payment confirmation.
              </li>
              <li>
                <span className="font-bold text-slate-900">Chargeback Policy:</span> Any unauthorized chargeback disputes initiated without contacting support will result in immediate suspension of the associated business account and deletion of connected API tokens.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Effortless 1-Click Cancellation
            </h2>
            <p>
              You maintain total autonomy over your billing. You may cancel your subscription at any time without having to contact customer support:
            </p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <p className="font-semibold text-slate-800 text-xs">How to cancel your active subscription:</p>
              <ol className="list-decimal pl-5 text-xs space-y-1 text-slate-600">
                <li>Log in to your dashboard at <span className="font-mono text-emerald-600">reviewmitra.opensoz.com/dashboard</span>.</li>
                <li>Navigate to the <span className="font-semibold">Billing</span> tab in the navigation menu.</li>
                <li>Click on <span className="font-semibold text-red-600">Cancel Subscription</span> under your current plan details.</li>
              </ol>
            </div>
            <p>
              Upon cancellation, your subscription remains active until the end of your current paid billing period. After this date, your card will not be charged again, and your account will automatically revert to the inactive state without incurring fees.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Exceptional Circumstances (Technical Billing Errors)
            </h2>
            <p>
              In the rare event of a duplicate charge caused by a technical gateway malfunction with Dodo Payments, we will promptly investigate and refund the duplicate payment upon verification. Requests for duplicate billing corrections must be submitted within 7 days of the transaction date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Contact Billing & Support
            </h2>
            <p>
              For questions regarding invoices, billing status, or technical support, please contact:
            </p>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 font-mono text-xs space-y-1">
              <p>Billing Inquiries: billing@opensoz.com</p>
              <p>General Support: support@opensoz.com</p>
              <p>Developer & Publisher: OpenSoz (https://opensoz.com)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
