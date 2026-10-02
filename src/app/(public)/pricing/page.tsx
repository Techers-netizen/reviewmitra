import type { Metadata } from "next";
import { Star, Zap, CheckCircle2, ArrowRight, ShieldCheck, Building2, Sparkles, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — ReviewMitra",
  description: "Simple, transparent pricing starting at ₹499/month. 7-day free trial, no credit card required.",
};

const plans = [
  {
    name: "Starter",
    monthly: 499,
    yearly: 4999,
    tagline: "Perfect for single-location shops",
    features: [
      { text: "1 Business Location", included: true },
      { text: "Google + Facebook + Justdial sync", included: true },
      { text: "100 AI Replies / month", included: true },
      { text: "Daily review sync (1×/day)", included: true },
      { text: "Auto-reply for positive reviews", included: true },
      { text: "WhatsApp alerts", included: true },
      { text: "English + Hinglish tones", included: true },
      { text: "Custom brand tone", included: false },
      { text: "Priority support", included: false },
    ],
    highlight: false,
    icon: Star,
  },
  {
    name: "Growth",
    monthly: 899,
    yearly: 8999,
    tagline: "For growing MSMEs with multiple outlets",
    features: [
      { text: "Up to 2 Business Locations", included: true },
      { text: "Google + Facebook + Justdial sync", included: true },
      { text: "Unlimited AI Replies", included: true },
      { text: "Real-time sync (every 15 min)", included: true },
      { text: "Auto-reply for positive reviews", included: true },
      { text: "WhatsApp instant alerts", included: true },
      { text: "English + Hinglish tones", included: true },
      { text: "Custom brand tone", included: true },
      { text: "Priority founder support", included: true },
    ],
    highlight: true,
    icon: Zap,
  },
];

const faqs = [
  {
    q: "Free trial me kya milta hai?",
    a: "7 din Growth plan ka full access — unlimited AI replies, real-time sync, sab features. Trial ke baad plan choose karein ya cancel karein. Koi charge nahi lagega.",
  },
  {
    q: "Credit card lagega?",
    a: "Nahi! Trial start karne ke liye koi payment info nahi chahiye. Payment sirf tab lagega jab aap plan choose karenge (Razorpay UPI/Card/Net Banking se).",
  },
  {
    q: "Kya main plan change kar sakta hoon?",
    a: "Haan, kabhi bhi. Starter se Growth ya Growth se Starter — dashboard se ek click me. Prorated billing automatically adjust ho jayegi.",
  },
  {
    q: "AI replies ki quality kaisi hai?",
    a: "ReviewMitra Gemini AI use karta hai — best-in-class Hindi/Hinglish support. Reply owner ki taraf se likha jaata hai, polite aur professional. Negative reviews me automatic empathy + phone number diya jaata hai.",
  },
  {
    q: "Data secure hai?",
    a: "Bilkul. Platform tokens AES-256-GCM se encrypted hote hain. Strict tenant isolation — ek business dusre ka data dekh hi nahi sakta. Review text CDATA-wrapped hai for prompt injection defense.",
  },
  {
    q: "Justdial ka reply kaise hota hai?",
    a: "Justdial ki koi public API nahi hai. ReviewMitra review fetch karta hai (scraping), AI reply generate karta hai, aur clipboard me copy kar deta hai. Phir aap Justdial pe manually paste karein.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ₹499 se shuru — Bharat ke MSMEs ke liye
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple pricing. No hidden fees.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Western tools like Birdeye charge ₹7,000–₹35,000/month. ReviewMitra delivers the same value at a price any local shop owner can afford.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={`relative p-6 sm:p-8 flex flex-col ${
                    plan.highlight
                      ? "border-2 border-emerald-500 shadow-xl shadow-emerald-500/10"
                      : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm">
                      Most popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl ${
                      plan.highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon size={22} />
                    </span>
                    <div>
                      <p className="font-bold text-xl">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-5xl font-extrabold text-slate-900">₹{plan.monthly}</span>
                    <span className="text-base text-slate-500">/month</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    or ₹{plan.yearly.toLocaleString("en-IN")}/year — save 2 months
                  </p>

                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? "" : "opacity-40"}`}>
                        <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${
                          f.included
                            ? plan.highlight ? "text-emerald-600" : "text-slate-500"
                            : "text-slate-300"
                        }`} />
                        <span className="text-slate-700">{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`mt-7 w-full h-12 text-sm font-semibold ${
                      plan.highlight
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                    asChild
                  >
                    <Link href="/signup">Start free trial — 7 days free</Link>
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> AES-256 encryption</span>
            <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-600" /> Tenant isolation</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-600" /> Razorpay UPI AutoPay</span>
            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-emerald-600" /> Hinglish AI</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} className="p-5">
                <p className="font-semibold text-slate-900 text-sm">{faq.q}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Aur koi sawal hai?</h2>
          <p className="mt-2 text-sm text-slate-600">Founder se directly baat karo WhatsApp pe.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-md" asChild>
              <Link href="/signup">Start free trial <ArrowRight size={16} /></Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> Chat with founder
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
