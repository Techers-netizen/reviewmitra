"use client";

import { useState } from "react";
import {
  Sparkles, ShieldCheck, MessageCircle, Zap, Star, Building2,
  ArrowRight, Menu, X, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dashboard } from "@/components/review-mitra/dashboard";
import { PricingSection } from "@/components/review-mitra/pricing-section";
import { WhatsAppSupport } from "@/components/review-mitra/whatsapp-support";
import { PlatformIcon } from "@/components/review-mitra/platform-icon";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40">
      <Header />
      <main className="flex-1">
        <Hero />
        <DashboardSection />
        <PricingSection />
        <SecuritySection />
      </main>
      <SiteFooter />
      <WhatsAppSupport />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Sparkles size={16} />
            </span>
            <span className="text-base font-bold tracking-tight">
              Review<span className="text-emerald-600">Mitra</span>
            </span>
          </a>
          <nav className="hidden sm:flex items-center gap-1">
            <a href="#dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Dashboard
            </a>
            <a href="#pricing" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Pricing
            </a>
            <a href="#security" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs">Log in</Button>
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5" asChild>
              <a href="#pricing">
                Get started
                <ArrowRight size={14} />
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="sm:hidden pb-3 flex flex-col gap-1 border-t border-slate-200 pt-2">
            <a href="#dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">Dashboard</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">Pricing</a>
            <a href="#security" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">Security</a>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="review-mitra-gradient border-b border-emerald-100/50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-10 items-center">
          <div>
            <Badge variant="outline" className="border-emerald-200 bg-white/70 text-emerald-700 backdrop-blur-sm">
              <Sparkles size={11} className="mr-1" />
              Built for Bharat&apos;s 6+ crore MSMEs
            </Badge>
            <h1 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              All your reviews.{" "}
              <span className="text-emerald-600">1-tap AI replies.</span>
              <br className="hidden sm:block" /> Sab ek dashboard me.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
              Google, Facebook aur Justdial ke reviews ek mobile dashboard par.
              AI 1-click me Hindi, English ya Hinglish me polite professional reply likh deta hai.
              Bina kisi tech headache ke.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm" asChild>
                <a href="#dashboard">
                  Try the live demo
                  <ArrowRight size={16} />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-white gap-2" asChild>
                <a href="#pricing">
                  See pricing
                </a>
              </Button>
            </div>
            <div className="mt-5 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-600" /> AES-256 encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-600" /> Strict tenant isolation
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={13} className="text-emerald-600" /> No credit card
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hidden sm:block">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px]">
      <div className="absolute inset-0 -rotate-6 rounded-[2.5rem] bg-emerald-200/40 blur-xl" />
      <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-emerald-500/20">
        <div className="overflow-hidden rounded-[1.8rem] bg-white">
          {/* Notch */}
          <div className="flex justify-center pt-1.5">
            <span className="h-1.5 w-16 rounded-full bg-slate-300" />
          </div>
          {/* App content */}
          <div className="px-3 py-3 space-y-2.5 h-[440px] overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Smile Dental Care</p>
                <p className="text-xs font-bold">Today&apos;s reviews</p>
              </div>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
                <Bell size={13} />
              </span>
            </div>

            {/* mock review cards */}
            <Card className="p-2.5 gap-1.5 border-l-2 border-l-emerald-400">
              <div className="flex items-center gap-1.5">
                <PlatformIcon platform="google" size={22} />
                <span className="text-[10px] font-semibold">Rohit Sharma</span>
                <span className="ml-auto text-[9px] text-muted-foreground">1m</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Doctor ne bahut achha treatment diya. Highly recommended!
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[9px] px-2 py-0.5 w-fit">
                <Sparkles size={9} /> AI Reply
              </span>
            </Card>

            <Card className="p-2.5 gap-1.5 border-l-2 border-l-red-400">
              <div className="flex items-center gap-1.5">
                <PlatformIcon platform="facebook" size={22} />
                <span className="text-[10px] font-semibold">Megha S.</span>
                <span className="ml-auto text-[9px] text-muted-foreground">1h</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Booked 12pm appointment, stylist not there. Had to wait 1 hour.
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-red-700 text-[9px] px-2 py-0.5">
                Needs attention
              </span>
            </Card>

            <Card className="p-2.5 gap-1.5 border-l-2 border-l-amber-400">
              <div className="flex items-center gap-1.5">
                <PlatformIcon platform="justdial" size={22} />
                <span className="text-[10px] font-semibold">Lakshmi M.</span>
                <span className="ml-auto text-[9px] text-muted-foreground">3d</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Good equipment, friendly staff. Steam room is a plus.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Zap size={11} className="mr-1" />
              Live demo
            </Badge>
            <h2 className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight">
              Your unified review inbox
            </h2>
          </div>
          <p className="hidden sm:block text-xs text-muted-foreground max-w-xs text-right">
            Real AI-generated replies powered by on-device LLM. Tap any review&apos;s <b>AI Reply</b> button.
          </p>
        </div>
        <Dashboard />
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="border-t bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <ShieldCheck size={11} className="mr-1" />
            Tight security, by default
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            Bharat ke business data ko seriously lete hain
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "AES-256-GCM Token Vault",
              body: "Google, Facebook, Justdial ke access & refresh tokens database me kabhi plain-text nahi hote. App-level encryption with IV + auth tag.",
              icon: ShieldCheck,
            },
            {
              title: "Strict Tenant Isolation",
              body: "Har query me mandatory business_id filter. PostgreSQL Row-Level Security (production) ke saath ek business dusre ka data dekh hi nahi sakta.",
              icon: Building2,
            },
            {
              title: "Prompt Injection Defense",
              body: "Customer reviews untrusted CDATA block me wrapped hote hain. AI reply ke liye review text sirf data hai, instruction nahi.",
              icon: Sparkles,
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} className="p-5 gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={18} />
                </span>
                <p className="mt-1 font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white">
                <Sparkles size={14} />
              </span>
              <span className="font-bold">Review<span className="text-emerald-600">Mitra</span></span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs">
              Bharat ke local businesses ke liye bana review reply engine.
              Clinics, salons, gyms, restaurants — sab ke liye.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs">
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#security" className="text-muted-foreground hover:text-foreground">Security</a>
            <a href="#dashboard" className="text-muted-foreground hover:text-foreground">Live demo</a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800">
              <MessageCircle size={12} />
              WhatsApp support
            </a>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>© {new Date().getFullYear()} ReviewMitra. Made in Bharat 🇮🇳 for Bharat.</p>
          <p>Demo build — mock data shown. OAuth tokens are simulated for sandbox.</p>
        </div>
      </div>
    </footer>
  );
}
