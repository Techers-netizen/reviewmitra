import type { Metadata } from "next";
import {
  Globe, Bot, Languages, BarChart3, Bell, Lock, Smartphone, Zap,
  Star, CheckCircle2, ArrowRight, ShieldCheck, Building2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features — ReviewMitra",
  description: "Discover all ReviewMitra features: multi-platform sync, AI auto-reply, Hinglish support, sentiment analysis, and more.",
};

const features = [
  {
    icon: Globe,
    title: "Multi-Platform Review Sync",
    desc: "Google Business Profile, Facebook Page, aur Justdial — teenon platforms ke reviews ek unified inbox me. Real-time webhook sync (Google + FB) aur scheduled scraping (Justdial).",
    details: ["Google OAuth integration", "Facebook Graph API", "Justdial URL-based scraping", "Every 15-min auto-sync (Growth plan)"],
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    icon: Bot,
    title: "AI-Powered Smart Replies",
    desc: "Ek click me context-aware, polite reply generate hota hai. AI review ka sentiment samajhta hai — positive review ko thank you, negative review ko empathetic apology + resolution.",
    details: ["Sentiment-aware prompts", "Owner persona writing", "CDATA prompt injection defense", "30-80 word optimized replies"],
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  {
    icon: Zap,
    title: "Auto-Reply System",
    desc: "Positive reviews (4-5★) ka reply automatic ho jaata hai — 24/7, bina manual kaam ke. Negative reviews ka draft tayyar rehta hai, aap sirf approve karo.",
    details: ["Auto-post for positive reviews", "Draft + notify for negative", "Configurable delay (5-30 min)", "WhatsApp notification on auto-reply"],
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    icon: Languages,
    title: "Hinglish & Multilingual",
    desc: "Hindi-English mix (Hinglish) me natural replies jo Indian customer ke saath connect kare. 4 tone presets: Friendly, Professional, Hinglish, Brief.",
    details: ["50%+ transliterated Hindi option", "4 preset tones", "Custom brand tone (Growth)", "Natural WhatsApp-style language"],
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    icon: BarChart3,
    title: "Sentiment Analysis",
    desc: "Har review automatically positive, neutral, ya negative classify hota hai. Dashboard me sentiment breakdown chart dikhta hai — trends track karo.",
    details: ["Auto-classification by rating + text", "Color-coded sentiment badges", "Monthly trend charts", "Negative review alerts"],
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Naya review aate hi WhatsApp pe notification. Negative review ka instant alert — kabhi koi review miss nahi hoga.",
    details: ["WhatsApp Business API integration", "Instant negative review alerts", "Daily summary digest", "Configurable notification hours"],
    color: "bg-pink-50 text-pink-600 border-pink-200",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    desc: "AES-256-GCM encryption for platform tokens. Strict tenant isolation — ek business dusre ka data dekh hi nahi sakta. Zero-trust architecture.",
    details: ["AES-256-GCM token encryption", "IV + Auth Tag per token", "PostgreSQL Row-Level Security", "Prompt injection defense (CDATA)"],
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    icon: Smartphone,
    title: "Mobile-First PWA",
    desc: "Phone pe install karo — app jaisa experience. Offline caching, push notifications, full-screen mode. Koi Play Store ya App Store nahi chahiye.",
    details: ["Progressive Web App", "Install on home screen", "Offline-capable", "Push notifications"],
    color: "bg-teal-50 text-teal-600 border-teal-200",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Sparkles size={12} className="mr-1.5" />
            Full Feature List
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Ek dashboard me{" "}
            <span className="text-emerald-600">sab powers</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            ReviewMitra me wo sab features hain jo Western tools ₹35,000/month me dete hain.
            Hum ₹499 me dete hain — kyunki Indian MSME ka budget alag hai.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              const isReversed = i % 2 === 1;
              return (
                <Card key={f.title} className={`overflow-hidden ${i % 2 === 0 ? "" : ""}`}>
                  <div className={`flex flex-col sm:flex-row ${isReversed ? "sm:flex-row-reverse" : ""}`}>
                    {/* Icon panel */}
                    <div className={`sm:w-1/3 p-8 flex items-center justify-center ${f.color} border-b sm:border-b-0 ${isReversed ? "sm:border-l" : "sm:border-r"}`}>
                      <Icon size={64} strokeWidth={1.2} />
                    </div>
                    {/* Content */}
                    <div className="sm:w-2/3 p-6 sm:p-8">
                      <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                      <ul className="mt-4 grid grid-cols-2 gap-2">
                        {f.details.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to try? 7 din free trial.
          </h2>
          <p className="mt-2 text-sm text-slate-600">No credit card required. Cancel anytime.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-md" asChild>
              <Link href="/signup">Start free trial <ArrowRight size={16} /></Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
