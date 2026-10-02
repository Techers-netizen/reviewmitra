"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<"starter" | "growth">("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      setCurrentPlan("growth");
    }, 1500);
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
            Apna active plan dekhein, AI reply quota track karein ya Growth plan me upgrade karein.
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 py-1 px-3 text-xs w-fit">
          <ShieldCheck size={14} className="mr-1 text-emerald-600" />
          UPI AutoPay Protected
        </Badge>
      </div>

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
                {currentPlan === "starter" ? "₹499 / month · Single Location" : "₹899 / month · Up to 2 Locations"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Next billing date</span>
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
                : "Unlimited AI replies available across all connected platforms."}
            </p>
          </div>
        </Card>

        {/* Quick Payment Details */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={15} className="text-emerald-600" />
            Payment Method
          </h4>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Google Pay / PhonePe UPI</p>
            <p className="text-slate-500 text-[11px] font-mono">dr.rajesh@okhdfcbank</p>
          </div>
          <p className="text-[11px] text-slate-400">
            UPI AutoPay via Razorpay. Kabhi bhi 1-click me cancel kar sakte hain.
          </p>
        </Card>
      </div>

      {/* ─── Plan Comparison & Upgrade Card ─────────────────────── */}
      {currentPlan === "starter" && (
        <Card className="p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white text-[10px]">Recommended Upgrade</Badge>
                <h3 className="font-bold text-base text-slate-900">Upgrade to Growth Plan (₹899/mo)</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Unlimited AI replies, real-time 15-minute sync, multi-outlet support aur WhatsApp VIP founder support.
              </p>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Unlimited AI Review Replies (no 100/mo cap)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Real-time sync (every 15 min instead of daily)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Up to 2 Business Locations / Outlets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Priority WhatsApp support directly from founders
                </li>
              </ul>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 gap-2 shrink-0 shadow-sm"
            >
              {upgrading ? "Upgrading..." : "Upgrade to Growth — ₹899/mo"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Billing History Table ──────────────────────────────── */}
      <Card className="p-5 border-slate-200 space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" />
          Invoice & Payment History
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {[
            { id: "INV-2026-001", date: "Oct 1, 2026", plan: "Starter Plan", amount: "₹499.00", status: "Paid via UPI" },
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
