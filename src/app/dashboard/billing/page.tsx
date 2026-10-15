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
  Calendar,
  AlertCircle,
  FileText,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<"starter" | "growth">("starter");
  const [upgrading, setUpgrading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        setPaymentSuccess(true);
        if (params.get("plan") === "growth") {
          setCurrentPlan("growth");
        }
      }
    }
  }, []);

  const handleSubscribe = async (plan: "starter" | "growth") => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/dodo-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Could not initiate payment checkout session.");
      }
    } catch (e) {
      console.error("Subscription initiation error:", e);
      alert("Failed to connect to billing service.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Subscription & Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your subscription tier, monitor AI reply quota, or upgrade your plan.
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 py-1 px-3 text-xs w-fit">
          <ShieldCheck size={14} className="mr-1 text-emerald-600" />
          Powered by Dodo Payments (UPI & Cards)
        </Badge>
      </div>

      {/* Payment Success Alert */}
      {paymentSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Payment successful! Your ReviewMitra subscription is active and refreshed.</span>
          </div>
          <button onClick={() => setPaymentSuccess(false)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Current Plan & AI Quota Card ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 sm:p-6 border-slate-200 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  {currentPlan === "starter" ? "Starter Plan" : "Growth Plan"}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentPlan === "starter" ? "₹399 / month · Single Location" : "₹799 / month · Up to 3 Locations"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Renews on</span>
              <p className="text-xs font-semibold text-slate-700">Nov 1, 2026</p>
            </div>
          </div>

          {/* AI Usage Quota Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-600" />
                Monthly AI Replies Quota
              </span>
              <span className="text-slate-600">
                <strong>18</strong> / {currentPlan === "starter" ? "100 used" : "Unlimited"}
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: currentPlan === "starter" ? "18%" : "5%" }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {currentPlan === "starter"
                ? "82 AI replies remaining this billing cycle. Renews on Nov 1."
                : "Unlimited AI replies enabled across Google, Meta, and QR channels."}
            </p>
          </div>
        </Card>

        {/* Quick Payment Details */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={15} className="text-emerald-600" />
            Payment Gateway
          </h4>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Dodo Payments Hosted</p>
            <p className="text-slate-500 text-[11px]">UPI AutoPay, Rupay, Visa, NetBanking</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <Lock size={12} className="text-emerald-600" />
            <span>Cancel anytime from your account settings.</span>
          </div>
        </Card>
      </div>

      {/* ─── Plan Comparison & Upgrade Card ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Vyapar Growth</span>
            <Badge className="bg-emerald-600 text-white text-[10px]">Most Popular</Badge>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">₹349</span>
            <span className="text-xs text-slate-500">/month</span>
          </div>
          <p className="text-xs text-slate-600">
            500 AI replies, up to 2 businesses (e.g. Pharmacy + Restaurant), multilingual agentic AI, Google Maps + Meta + IndiaMART.
          </p>
          <Button
            onClick={() => handleSubscribe("growth")}
            disabled={upgrading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
          >
            {upgrading ? "Redirecting..." : "Upgrade to Vyapar Growth (₹349/mo)"}
            <ArrowRight size={14} />
          </Button>
        </Card>

        <Card className="p-5 border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Bharat Pro</span>
            <Badge variant="outline" className="text-[10px] text-slate-600">Multi-Location</Badge>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">₹699</span>
            <span className="text-xs text-slate-500">/month</span>
          </div>
          <p className="text-xs text-slate-600">
            1,500+ AI replies, up to 5 business locations, autonomous brand voice memory, WhatsApp report digests.
          </p>
          <Button
            onClick={() => handleSubscribe("growth")}
            disabled={upgrading}
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs h-9 gap-1.5"
          >
            {upgrading ? "Redirecting..." : "Upgrade to Bharat Pro (₹699/mo)"}
            <ArrowRight size={14} />
          </Button>
        </Card>
      </div>


      {/* ─── Billing History Table ──────────────────────────────── */}
      <Card className="p-5 border-slate-200 space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" />
          Invoice & Payment History
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {[
            { id: "INV-2026-001", date: "Oct 1, 2026", plan: "Starter Plan", amount: "₹399.00", status: "Paid via Dodo Payments" },
          ].map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">{inv.id}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{inv.date} · {inv.plan}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{inv.amount}</span>
                <span className="block text-[11px] text-emerald-600 font-medium">{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
