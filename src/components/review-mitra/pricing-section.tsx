"use client";

import { Check, Sparkles, Zap, ShieldCheck, Building2, Infinity as Inf, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter_499",
    name: "Starter",
    monthly: 499,
    yearly: 4999,
    tagline: "Perfect for single-location shops",
    features: [
      "1 Business Location",
      "Google + Facebook + Justdial",
      "100 AI Replies / month",
      "Standard daily sync",
      "In-app WhatsApp support",
      "English + Hinglish tones",
    ],
    highlight: false,
    icon: Star,
  },
  {
    id: "growth_899",
    name: "Growth",
    monthly: 899,
    yearly: 8999,
    tagline: "For growing MSMEs with multiple outlets",
    features: [
      "Up to 2 Business Locations",
      "Unlimited AI Replies",
      "Real-time webhook sync (Google + FB)",
      "4× daily Justdial scrape",
      "Custom Brand Tone",
      "WhatsApp instant review alerts",
      "Priority founder support",
    ],
    highlight: true,
    icon: Zap,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ₹499 se ₹999 — Bharat ke MSMEs ke liye
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Transparent pricing. No setup fee. Cancel anytime.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Western tools like Birdeye / Podium charge ₹7,000–₹35,000/month. We deliver the same core value at a price a local shop owner can afford without thinking.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-5 sm:p-6 flex flex-col",
                  plan.highlight
                    ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-border"
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white hover:bg-emerald-600">
                    Most popular
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    plan.highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                  )}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-base">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{plan.monthly}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  or ₹{plan.yearly.toLocaleString("en-IN")}/year — save 2 months
                </p>

                <ul className="mt-4 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} className={cn("mt-0.5 shrink-0", plan.highlight ? "text-emerald-600" : "text-slate-500")} />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-5 w-full",
                    plan.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                  asChild
                >
                  <a href="#dashboard">Start free trial — 7 days</a>
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> AES-256 token encryption</span>
          <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-600" /> Strict tenant isolation</span>
          <span className="flex items-center gap-1.5"><Inf size={14} className="text-emerald-600" /> Razorpay UPI AutoPay</span>
          <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-emerald-600" /> Hinglish-native AI</span>
        </div>
      </div>
    </section>
  );
}
