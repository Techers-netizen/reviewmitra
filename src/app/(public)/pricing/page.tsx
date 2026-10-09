import type { Metadata } from "next";
import { Star, Zap, CheckCircle2, ArrowRight, ShieldCheck, Building2, Sparkles, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing Plans — ReviewMitra by OpenSoz",
  description: "Transparent, affordable pricing starting at ₹399/month. 7-day free trial, powered by Dodo Payments.",
};

const plans = [
  {
    name: "Starter",
    monthly: 399,
    yearly: 3999,
    tagline: "Ideal for single-location shops & clinics",
    features: [
      { text: "1 Business Location", included: true },
      { text: "Google + Facebook + Justdial sync", included: true },
      { text: "100 AI Replies / month", included: true },
      { text: "Daily review auto-sync", included: true },
      { text: "Smart in-store Review QR booster", included: true },
      { text: "WhatsApp & email alert summaries", included: true },
      { text: "English, Hindi & Hinglish models", included: true },
      { text: "Custom brand voice & learning", included: false },
      { text: "Priority developer support", included: false },
    ],
    highlight: false,
    icon: Star,
  },
  {
    name: "Growth",
    monthly: 799,
    yearly: 7999,
    tagline: "For high-volume stores & multi-outlet practices",
    features: [
      { text: "Up to 2 Business Locations", included: true },
      { text: "Google + Facebook + Justdial sync", included: true },
      { text: "Unlimited AI Replies", included: true },
      { text: "Real-time webhook review sync", included: true },
      { text: "4× daily Justdial review monitoring", included: true },
      { text: "Smart in-store Review QR booster", included: true },
      { text: "Custom brand voice & learning memory", included: true },
      { text: "Priority developer support", included: true },
      { text: "Multilingual engine (10+ languages)", included: true },
    ],
    highlight: true,
    icon: Zap,
  },
];

const faqs = [
  {
    q: "What is included in the 7-day free trial?",
    a: "You get full, unrestricted access to the Growth plan features for 7 days — unlimited AI replies, multi-platform sync, and in-store QR code generator. No credit card is required to begin.",
  },
  {
    q: "Is a credit card required for signing up?",
    a: "No! You can register and test the entire platform without entering any payment information. You only choose a plan when you are ready to continue after your trial.",
  },
  {
    q: "How does payment and billing work?",
    a: "We process payments securely via Dodo Payments, supporting UPI, credit cards, debit cards, and net banking. Billing is recurring monthly or annually with automatic invoicing.",
  },
  {
    q: "What is your refund and cancellation policy?",
    a: "You can cancel your subscription at any time with a single click in your Billing settings. Because we provide a risk-free 7-day trial and immediately allocate cloud AI resources, paid subscriptions are non-refundable once processed. Please view our full Refund Policy for details.",
  },
  {
    q: "How natural are the AI replies?",
    a: "ReviewMitra uses tuned Google Gemini models trained specifically on local customer review etiquette. It crafts respectful, empathetic owner-voice responses in English, Hindi, Hinglish, Gujarati, and other languages without sounding generic or robotic.",
  },
  {
    q: "How does the Smart Review QR Booster work?",
    a: "Your dashboard generates a branded QR code card. When in-store customers scan it, they choose a rating and get 1-tap positive review prompts, redirecting them straight to your Google Maps review page.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Fair Pricing · Built by OpenSoz
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            World-class reputation management and AI automation starting at just ₹399/month. No setup fees, no hidden charges.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={`relative p-8 flex flex-col ${
                    plan.highlight
                      ? "border-2 border-emerald-500 shadow-xl shadow-emerald-500/10"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm px-3">
                      Most Popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`grid h-12 w-12 place-items-center rounded-xl ${
                      plan.highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon size={24} />
                    </span>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">₹{plan.monthly}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Billed monthly via Dodo Payments · Cancel anytime</p>

                  <ul className="mt-8 space-y-3 flex-1 border-t pt-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle2
                          size={16}
                          className={`shrink-0 ${f.included ? "text-emerald-600" : "text-slate-300"}`}
                        />
                        <span className={f.included ? "text-slate-700" : "text-slate-400 line-through"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`mt-8 w-full h-12 text-sm font-semibold ${
                      plan.highlight
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                    asChild
                  >
                    <Link href="/signup">Start 7-Day Free Trial</Link>
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-600" /> AES-256 encrypted tokens</span>
            <span className="flex items-center gap-1.5"><Building2 size={16} className="text-emerald-600" /> Strict tenant data isolation</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={16} className="text-emerald-600" /> Powered by Dodo Payments</span>
            <span className="flex items-center gap-1.5"><Sparkles size={16} className="text-emerald-600" /> 10+ language AI models</span>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-slate-50 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <Card key={i} className="p-6 bg-white border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm">{faq.q}</h4>
                <p className="text-xs leading-relaxed text-slate-600">{faq.a}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-600">
              Have specific questions? Review our{" "}
              <Link href="/refund-policy" className="text-emerald-600 underline font-medium">Refund Policy</Link> or{" "}
              <Link href="/contact" className="text-emerald-600 underline font-medium">contact support</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
