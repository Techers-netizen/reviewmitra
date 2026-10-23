"use client";

import { Check, Sparkles, Zap, ShieldCheck, Building2, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PLANS = [
  {
    id: "nano_79",
    name: "Nano",
    monthly: 79,
    gst: "14.22",
    tagline: "For small single-counter shops",
    features: [
      "100 Reviews / month",
      "1 Business Location",
      "Google Maps + Justdial + QR Booster",
      "Same-language Gemini Agentic AI",
      "OpenWA WhatsApp daily report",
    ],
    highlight: false,
    icon: Star,
  },
  {
    id: "starter_149",
    name: "Starter",
    monthly: 149,
    gst: "26.82",
    tagline: "Ideal for clinics, salons & cafes",
    features: [
      "500 Reviews / month",
      "1 Business Location",
      "Google + Facebook + Justdial + IndiaMART",
      "Same-language Gemini Agentic AI",
      "Instant WhatsApp negative review alerts",
    ],
    highlight: false,
    icon: Sparkles,
  },
  {
    id: "growth_249",
    name: "Growth",
    monthly: 249,
    gst: "44.82",
    tagline: "For businesses with 2 branches",
    features: [
      "1,000 Reviews / month",
      "Up to 2 Business Locations",
      "All 4 Platforms + Smart QR Shield",
      "Self-learning brand voice memory",
      "OpenWA QR & Pairing Code reports",
    ],
    highlight: true,
    icon: Zap,
  },
  {
    id: "pro_399",
    name: "Pro Unlimited",
    monthly: 399,
    gst: "71.82",
    tagline: "For high-volume multi-outlet brands",
    features: [
      "2,500+ Reviews / month",
      "Up to 5 Business Locations",
      "Priority real-time review sync",
      "Dedicated multi-branch switcher",
      "Priority support (help.opensoz@gmail.com)",
    ],
    highlight: false,
    icon: Rocket,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Pocket-Friendly Plans Starting at ₹79/month (+18% GST)
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Built to Help Every Indian Shop Owner Grow
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
            Choose a plan based on your monthly review volume (100, 500, 1,000, or 2,500+ reviews). All prices are tax-exclusive (+18% GST added at checkout). Includes a ₹1 live verification option inside the dashboard.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-5 flex flex-col justify-between",
                  plan.highlight
                    ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-border"
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        plan.highlight
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-bold text-sm">{plan.name}</p>
                      <p className="text-[11px] text-muted-foreground">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">₹{plan.monthly}</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">
                    + ₹{plan.gst} (18% GST extra)
                  </p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check
                          size={14}
                          className={cn(
                            "mt-0.5 shrink-0",
                            plan.highlight ? "text-emerald-600" : "text-slate-500"
                          )}
                        />
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className={cn(
                    "mt-5 w-full text-xs h-9 font-semibold",
                    plan.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> ₹1 Live Payment Test Available
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-600" /> Multi-Business Support
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" /> Support: help.opensoz@gmail.com
          </span>
        </div>
      </div>
    </section>
  );
}
