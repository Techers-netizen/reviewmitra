"use client";

import { Check, Sparkles, Zap, ShieldCheck, Building2, Infinity as Inf, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter_149",
    name: "Vyapar Starter",
    monthly: 149,
    yearly: 1499,
    tagline: "Single clinic, pharmacy or shop",
    features: [
      "1 Business Location",
      "Google Maps + Meta + IndiaMART",
      "100 AI Replies / month",
      "Smart QR Standee generator",
      "Hindi, Hinglish & English replies",
      "WhatsApp review notifications",
    ],
    highlight: false,
    icon: Star,
  },
  {
    id: "growth_349",
    name: "Vyapar Growth",
    monthly: 349,
    yearly: 3499,
    tagline: "For 2 businesses (e.g. Pharmacy + Restaurant)",
    features: [
      "Up to 2 Business Outlets (Multi-Store)",
      "500 AI Replies / month",
      "Instant Google Places & Maps Sync",
      "Negative Review Private Shield",
      "Interactive Multi-Store Header Switcher",
      "Custom brand voice & emoji tuning",
      "Priority WhatsApp support",
    ],
    highlight: true,
    icon: Zap,
  },
  {
    id: "scale_699",
    name: "Bharat Pro",
    monthly: 699,
    yearly: 6999,
    tagline: "Multi-branch retail & enterprises",
    features: [
      "Up to 5 Business Locations",
      "1,500+ AI Replies / month",
      "Auto-Reply Cron Sync",
      "Custom QR Standee with Shop Logo",
      "Full Sentiment & Competitor Analytics",
      "Dedicated account manager",
    ],
    highlight: false,
    icon: Building2,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ₹149 se ₹699 — Bharat ke sabhi MSMEs ke liye
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Pocket-Friendly MSME Pricing. No Hidden Setup Fees.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Expensive foreign software charge ₹5,000–₹15,000/month. ReviewMitra gives Indian local shops and restaurants world-class AI review management starting at just ₹149/mo.
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
