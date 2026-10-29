"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Star,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanItem {
  key: string;
  name: string;
  tagline: string;
  basePriceInRupees: number;
  gstAmount: number;
  totalPayableByCustomer: number;
  monthlyLimit: number;
  maxBusinesses: number;
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    key: "nano_79",
    name: "Nano Plan",
    tagline: "For small single-counter shops & kirana stores",
    basePriceInRupees: 79,
    gstAmount: 14.22,
    totalPayableByCustomer: 93.22,
    monthlyLimit: 100,
    maxBusinesses: 1,
  },
  {
    key: "starter_149",
    name: "Starter Plan",
    tagline: "Ideal for clinics, salons & local cafes",
    basePriceInRupees: 149,
    gstAmount: 26.82,
    totalPayableByCustomer: 175.82,
    monthlyLimit: 500,
    maxBusinesses: 1,
  },
  {
    key: "growth_249",
    name: "Growth Plan",
    tagline: "For busy businesses with up to 2 locations",
    basePriceInRupees: 249,
    gstAmount: 44.82,
    totalPayableByCustomer: 293.82,
    monthlyLimit: 1000,
    maxBusinesses: 2,
  },
  {
    key: "pro_399",
    name: "Pro Unlimited Plan",
    tagline: "High-volume chains & multi-outlet brands (up to 5 locations)",
    basePriceInRupees: 399,
    gstAmount: 71.82,
    totalPayableByCustomer: 470.82,
    monthlyLimit: 2500,
    maxBusinesses: 5,
  },
];

export default function BillingPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("My Business");
  const [currentPlanKey, setCurrentPlanKey] = useState<string>("nano_79");
  const [currentPlanName, setCurrentPlanName] = useState<string>("Nano Plan");
  const [basePrice, setBasePrice] = useState<number>(79);
  const [aiRepliesUsed, setAiRepliesUsed] = useState<number>(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(100);
  const [maxBusinesses, setMaxBusinesses] = useState<number>(1);

  const [upgradingKey, setUpgradingKey] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadBilling() {
      try {
        const savedBizId = typeof window !== "undefined" ? localStorage.getItem("rm_active_business_id") : null;
        const url = savedBizId
          ? `/api/billing/dodo-checkout?businessId=${encodeURIComponent(savedBizId)}`
          : "/api/billing/dodo-checkout";
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.businessId) setBusinessId(data.businessId);
          if (data.businessName) setBusinessName(data.businessName);
          if (data.subscription) {
            setCurrentPlanKey(data.subscription.planKey || "nano_79");
            setCurrentPlanName(data.subscription.planName || "Nano Plan");
            setBasePrice(data.subscription.basePriceInRupees ?? 79);
            setAiRepliesUsed(data.subscription.aiRepliesUsed ?? 0);
            setMonthlyLimit(data.subscription.monthlyAiReplyLimit ?? 100);
            setMaxBusinesses(data.subscription.maxBusinesses ?? 1);
          }
        }
      } catch (e) {
        console.error("Failed to load billing details:", e);
      }
    }
    void loadBilling();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        setPaymentSuccess(true);
      }
    }
  }, []);

  const handleSubscribe = async (planKey: string) => {
    setUpgradingKey(planKey);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/billing/dodo-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: planKey, businessId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErrorNotice(data.error || "Could not initiate payment checkout session.");
      }
    } catch (e) {
      console.error("Subscription initiation error:", e);
      setErrorNotice("Failed to connect to billing service.");
    } finally {
      setUpgradingKey(null);
    }
  };

  const usagePercent = Math.min(100, Math.round((aiRepliesUsed / Math.max(1, monthlyLimit)) * 100));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Subscription & Affordable Plans — {businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Designed to help every shop owner grow affordably. All plan prices are tax-exclusive (+18% GST paid at checkout).
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 py-1 px-3 text-xs w-fit">
          <ShieldCheck size={14} className="mr-1.5 text-emerald-600" />
          Dodo Payments · Tax Exclusive (18% GST Extra)
        </Badge>
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Payment verified! Your ReviewMitra subscription and AI reply quota have been updated.</span>
          </div>
          <button onClick={() => setPaymentSuccess(false)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center justify-between text-xs font-medium">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Current Plan & Live Quota + ₹1 Live Verification Card ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="p-5 sm:p-6 border-slate-200 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{currentPlanName}</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ₹{basePrice}/month (+18% GST) · Up to {maxBusinesses} Business Location{maxBusinesses > 1 ? "s" : ""}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400">Tax Mode</span>
              <p className="text-xs font-semibold text-emerald-700">18% GST Paid by User</p>
            </div>
          </div>

          {/* Real Database AI Usage Quota Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-600" />
                Monthly Reviews & AI Replies Used (Live DB Count)
              </span>
              <span className="text-slate-700 font-bold">
                {aiRepliesUsed} / {monthlyLimit} Reviews
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {Math.max(0, monthlyLimit - aiRepliesUsed)} reviews remaining in your current billing cycle.
            </p>
          </div>
        </Card>

        {/* ₹1 Live Payment Verification Card */}
        <Card className="p-5 sm:p-6 border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-600 text-white text-[10px] gap-1">
                <FlaskConical size={11} /> Pre-Launch Verification
              </Badge>
              <span className="text-xs font-bold text-slate-900">
                ₹1.00 <span className="text-[11px] font-normal text-slate-500">+ ₹0.18 GST</span>
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              ₹1 Live Payment & Webhook Test
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Test your live Dodo Payments gateway, UPI checkout, and webhook activation with a real ₹1 transaction (Total ₹1.18 with 18% GST) before going live.
            </p>
          </div>

          <Button
            onClick={() => handleSubscribe("test_1")}
            disabled={upgradingKey !== null}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 gap-2 shadow-sm"
          >
            <CreditCard size={14} />
            {upgradingKey === "test_1" ? "Opening ₹1 Checkout..." : "Run ₹1 Live Payment Test (₹1 + 18% GST)"}
          </Button>
        </Card>
      </div>

      {/* ─── 4 Affordable MSME Plans (100, 500, 1k, 2.5k+ Reviews) ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-600" />
            Affordable Monthly Plans (100 to 2,500+ Reviews/Month)
          </h2>
          <span className="text-xs text-slate-500">
            18% GST is added separately at checkout (`tax_inclusive: false`)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_PLANS.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            const isPopular = plan.key === "growth_249";

            return (
              <Card
                key={plan.key}
                className={`p-5 flex flex-col justify-between relative ${
                  isPopular
                    ? "border-2 border-emerald-500 shadow-md shadow-emerald-500/10"
                    : "border-slate-200"
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px]">
                    Most Popular (2 Shops)
                  </Badge>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{plan.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{plan.tagline}</p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        ₹{plan.basePriceInRupees}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                    </div>
                    <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                      + ₹{plan.gstAmount.toFixed(2)} (18% GST) = ₹{plan.totalPayableByCustomer.toFixed(2)}
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2 font-semibold text-slate-900">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      {plan.monthlyLimit.toLocaleString("en-IN")} Reviews / month
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 size={13} className="text-emerald-600 shrink-0" />
                      Up to {plan.maxBusinesses} Business Location{plan.maxBusinesses > 1 ? "s" : ""}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      Google, Facebook, Justdial & IndiaMART
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      Same-Language Gemini Agentic AI
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      In-Store Smart QR Booster & OpenWA Reports
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={upgradingKey !== null}
                  className={`mt-5 w-full text-xs h-9 font-semibold gap-1.5 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                      : isPopular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {upgradingKey === plan.key
                    ? "Redirecting..."
                    : isCurrent
                    ? "Renew / Switch Plan"
                    : `Choose ${plan.name}`}
                  <ArrowRight size={13} />
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Footer Security Note ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <span className="flex items-center gap-1.5">
          <Lock size={13} className="text-emerald-600" />
          All payments are processed securely via Dodo Payments (UPI, Cards & NetBanking).
        </span>
        <span>
          Billing Support:{" "}
          <a href="mailto:help.opensoz@gmail.com" className="text-emerald-700 font-semibold underline">
            help.opensoz@gmail.com
          </a>
        </span>
      </div>
    </div>
  );
}
