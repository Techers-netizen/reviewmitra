"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles, ShieldCheck, MessageCircle, Zap, Star, Building2,
  ArrowRight, Menu, X, Bell, CheckCircle2, Clock, TrendingUp,
  Globe, Smartphone, Bot, BarChart3, Languages, Lock,
  Play, Quote, QrCode, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

// ─── Fade-up animation wrapper ─────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <FeaturesGrid />
        <InteractiveDemo />
        <TestimonialsSection />
        <PricingPreview />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

// ─── HEADER ─────────────────────────────────────────────────────────
function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:shadow-emerald-600/40 transition-shadow">
              <Star size={18} fill="white" strokeWidth={0} />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                Review<span className="text-emerald-600">Mitra</span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">by OpenSoz</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Pricing", href: "#pricing" },
              { label: "Live Demo", href: "#demo" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-sm text-slate-600 hover:text-slate-900"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all"
              asChild
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight size={14} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-200/60"
            >
              <div className="py-3 flex flex-col gap-1">
                {[
                  { label: "Features", href: "#features" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Live Demo", href: "#demo" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 pt-2 border-t border-slate-100 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" asChild>
                    <Link href="/signup">Start Free Trial</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/50" />
      <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] rounded-full bg-sky-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <FadeUp>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50/80 text-emerald-700 backdrop-blur-sm px-3 py-1 text-xs font-medium"
              >
                <Sparkles size={12} className="mr-1.5" />
                Smart Reputation Management · An OpenSoz Product
              </Badge>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="mt-5 text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                All your customer reviews.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  AI auto-replies in 1-click.
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
                Connect Google Business, Facebook, and Justdial in a unified dashboard.
                Our trained AI crafts personalized, polite, and culturally resonant replies across
                English, Hindi, Hinglish, and 10+ languages.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all text-base h-12 px-6"
                  asChild
                >
                  <Link href="/signup">
                    Start 7-Day Free Trial
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-white/70 backdrop-blur-sm text-base h-12 px-6"
                  asChild
                >
                  <a href="#demo">
                    <Play size={16} />
                    Try Interactive Demo
                  </a>
                </Button>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  AES-256 token encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" />
                  2-minute onboarding
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-emerald-600" />
                  No credit card required
                </span>
              </div>
            </FadeUp>
          </div>

          {/* Right — Phone Mockup */}
          <FadeUp delay={0.3} className="hidden lg:block">
            <HeroPhoneMockup />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── HERO PHONE MOCKUP ──────────────────────────────────────────────
function HeroPhoneMockup() {
  const mockReviews = [
    { name: "Rohit Sharma", platform: "Google", rating: 5, text: "Excellent care and painless treatment. Highly recommended!", time: "1m ago", color: "text-[#4285F4]", bg: "bg-[#4285F4]/10", label: "G", sentiment: "positive" },
    { name: "Megha Singh", platform: "Facebook", rating: 1, text: "Booked appointment, had to wait 45 minutes for my session.", time: "1h ago", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", label: "f", sentiment: "negative" },
    { name: "Lakshmi Menon", platform: "Justdial", rating: 4, text: "Courteous staff and state of the art equipment. Very satisfied.", time: "3d ago", color: "text-[#F04E23]", bg: "bg-[#F04E23]/10", label: "Jd", sentiment: "positive" },
  ];

  return (
    <div className="relative mx-auto w-[300px]">
      {/* Glow */}
      <div className="absolute inset-0 -rotate-3 rounded-[3rem] bg-gradient-to-br from-emerald-200/50 to-teal-200/30 blur-2xl scale-105" />

      {/* Phone frame */}
      <div className="relative rounded-[2.8rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/30">
        <div className="overflow-hidden rounded-[2.2rem] bg-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1">
            <span className="text-[10px] font-semibold text-slate-500">9:41</span>
            <span className="h-[22px] w-[80px] rounded-full bg-slate-900" />
            <span className="text-[10px] text-slate-500">5G · 100%</span>
          </div>

          {/* App header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <div>
              <p className="text-[9px] text-slate-400 font-medium">METRO DENTAL CLINIC</p>
              <p className="text-xs font-bold text-slate-900">Today&apos;s Reviews</p>
            </div>
            <span className="relative grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
              <Bell size={12} />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            </span>
          </div>

          {/* Review cards */}
          <div className="px-3 py-2.5 space-y-2 h-[380px] overflow-hidden">
            {mockReviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.5 }}
                className={`rounded-xl border p-2.5 space-y-1.5 ${
                  r.sentiment === "negative" ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${r.bg} ${r.color} text-[9px] font-bold border border-current/20`}>
                    {r.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-800">{r.name}</span>
                  <span className="ml-auto text-[8px] text-slate-400">{r.time}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      size={9}
                      className={si < r.rating ? (r.rating >= 4 ? "text-emerald-500" : "text-red-400") : "text-slate-200"}
                      fill={si < r.rating ? "currentColor" : "none"}
                      strokeWidth={si < r.rating ? 0 : 2}
                    />
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">{r.text}</p>
                {r.sentiment === "positive" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[8px] px-2 py-0.5 w-fit">
                    <Sparkles size={7} /> AI Replied
                  </span>
                )}
                {r.sentiment === "negative" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-red-600 text-[8px] px-2 py-0.5">
                    ⚠ Needs attention
                  </span>
                )}
              </motion.div>
            ))}

            {/* AI reply preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5"
            >
              <div className="flex items-center gap-1.5 text-[8px] font-medium text-emerald-700 mb-1">
                <CheckCircle2 size={9} />
                AI auto-replied · Warm tone
              </div>
              <p className="text-[8px] text-emerald-800/80 leading-snug">
                &quot;Thank you so much Rohit! Your kind words mean the world to our team. We look forward to seeing you again soon! 🙂&quot;
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROBLEM SECTION ────────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    { icon: Globe, text: "Juggling 3 different portals every day — Google Maps, Facebook, and Justdial", color: "from-orange-500 to-red-500" },
    { icon: MessageCircle, text: "Fear of handling negative feedback — an uncalculated reply can damage your brand", color: "from-red-500 to-pink-500" },
    { icon: Clock, text: "15 minutes per reply adds up — managing 5 reviews a day wastes over an hour daily", color: "from-purple-500 to-indigo-500" },
    { icon: Smartphone, text: "Clunky desktop-first dashboards that are painful to navigate on mobile devices", color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
              The Problem
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Your customers leave reviews daily.{" "}
              <span className="text-red-500">Replying shouldn&apos;t feel like a chore.</span>
            </h2>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <Card className="relative overflow-hidden p-5 h-full group hover:shadow-lg transition-shadow">
                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${p.color}`} />
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
                  <p.icon size={20} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700 leading-relaxed">{p.text}</p>
              </Card>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <div className="mt-10 text-center">
            <p className="text-lg font-semibold text-emerald-700">
              ReviewMitra automates the entire lifecycle — <span className="underline decoration-emerald-300 decoration-2 underline-offset-4">2-minute setup, total peace of mind.</span>
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ───────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect Platforms",
      desc: "Link Google Business Profile, Facebook Page, and Justdial listings in one click. Secure OAuth authentication keeps your credentials safe.",
      icon: Globe,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      step: "02",
      title: "Instant Sync & Alerts",
      desc: "All incoming feedback flows into a unified inbox with automated sentiment classification and optional WhatsApp summary alerts.",
      icon: Bell,
      gradient: "from-teal-500 to-sky-500",
    },
    {
      step: "03",
      title: "AI Auto-Reply & Boost",
      desc: "Positive reviews receive instant professional replies. Negative feedback is queued safely for owner review, and in-store QR codes drive new 5★ ratings.",
      icon: Bot,
      gradient: "from-sky-500 to-indigo-500",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <Zap size={12} className="mr-1.5" />
              Streamlined Workflow
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Setup in 2 minutes. Runs effortlessly 24/7.
            </h2>
          </div>
        </FadeUp>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {steps.map((s, i) => (
            <FadeUp key={s.step} delay={i * 0.15}>
              <div className="relative group">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden lg:block absolute top-14 -right-4 w-8 border-t-2 border-dashed border-slate-200" />
                )}
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg shadow-emerald-600/10 group-hover:scale-105 transition-transform`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Step {s.step}</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES GRID ──────────────────────────────────────────────────
function FeaturesGrid() {
  const features = [
    { icon: Globe, title: "Multi-Platform Aggregation", desc: "Manage Google Business, Facebook Pages, and Justdial reviews from a single unified inbox.", color: "bg-blue-50 text-blue-600" },
    { icon: Bot, title: "Automated AI Replies", desc: "Instantly respond to 4★ and 5★ reviews with personalized, non-robotic replies around the clock.", color: "bg-emerald-50 text-emerald-600" },
    { icon: Languages, title: "Multilingual Intelligence", desc: "Flawlessly comprehends and crafts responses in English, Hindi, Hinglish, Gujarati, Marathi, and 10+ languages.", color: "bg-orange-50 text-orange-600" },
    { icon: QrCode, title: "Smart In-Store QR Booster", desc: "Print custom QR code cards for your store counter. Customers scan, tap a 5★ draft, and post in seconds.", color: "bg-purple-50 text-purple-600" },
    { icon: BarChart3, title: "Sentiment Intelligence", desc: "Automated sentiment tagging ensures negative reviews receive empathetic, safety-checked care.", color: "bg-pink-50 text-pink-600" },
    { icon: Lock, title: "Bank-Grade Encryption", desc: "All OAuth tokens and API credentials are protected with AES-256-GCM hardware-grade security.", color: "bg-slate-100 text-slate-700" },
    { icon: Smartphone, title: "Mobile PWA Experience", desc: "Install ReviewMitra directly on your mobile device for lightning-fast review management on the go.", color: "bg-teal-50 text-teal-600" },
    { icon: Zap, title: "1-Click Custom Approval", desc: "Review, customize, and post AI responses in under 3 seconds whenever manual approval is preferred.", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sparkles size={12} className="mr-1.5" />
              Comprehensive Platform
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Everything Your Business Needs to Shine
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Enterprise reputation platforms charge $100–$300/month. ReviewMitra delivers world-class AI automation starting at just ₹399.
            </p>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.05}>
              <Card className="p-5 h-full group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon size={20} />
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── INTERACTIVE DEMO ───────────────────────────────────────────────
function InteractiveDemo() {
  const [activeReview, setActiveReview] = useState(0);
  const [showReply, setShowReply] = useState(false);
  const [generating, setGenerating] = useState(false);

  const demoReviews = [
    {
      name: "Priya Iyer",
      platform: "Google",
      rating: 5,
      text: "Painless tooth extraction! The doctor explained every step before starting. Affordable and professional.",
      sentiment: "positive",
      reply: "Thank you so much Priya! Dr. Mehta and our entire clinical team are delighted to hear you had a comfortable and painless experience. We take pride in transparent care. Looking forward to keeping your smile bright at your next checkup! 🙂",
    },
    {
      name: "Mohammed Ali",
      platform: "Google",
      rating: 1,
      text: "Took appointment for 6pm, reached on time, was made to wait 1.5 hours. Very frustrating.",
      sentiment: "negative",
      reply: "Dear Mohammed, we sincerely apologize for the delay you experienced. A 1.5-hour wait is unacceptable, and we have adjusted our doctor buffer times to prevent this. Please call our front desk directly at +91 98765 43210 so our management can personally ensure your next appointment is seamless. 🙏",
    },
    {
      name: "Kavita Reddy",
      platform: "Facebook",
      rating: 5,
      text: "Best dental clinic! Got teeth whitening done — absolutely loved the sparkling result.",
      sentiment: "positive",
      reply: "Thank you so much Kavita! 😊 We are thrilled that you loved the whitening results. Keep sharing your confident smile with family and friends — we look forward to welcoming you back! 🦷✨",
    },
  ];

  const handleGenerate = () => {
    setShowReply(false);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowReply(true);
    }, 1200);
  };

  useEffect(() => {
    setShowReply(false);
    setGenerating(false);
  }, [activeReview]);

  const review = demoReviews[activeReview];

  return (
    <section id="demo" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <Play size={12} className="mr-1.5" />
              Live Demonstration
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Experience the AI Reply Engine
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Select a review below and click &quot;Generate AI Reply&quot;. Fully interactive — no registration required.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-10 max-w-3xl mx-auto">
            {/* Review selector pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {demoReviews.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setActiveReview(i)}
                  className={`shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                    activeReview === i
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r.rating >= 4 ? (
                    <span className="text-emerald-500">★{r.rating}</span>
                  ) : (
                    <span className="text-red-500">★{r.rating}</span>
                  )}
                  {r.name}
                  <span className="text-slate-400">· {r.platform}</span>
                </button>
              ))}
            </div>

            {/* Review card */}
            <Card className="overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                    {review.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{review.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < review.rating ? (review.rating >= 4 ? "text-emerald-500" : "text-red-400") : "text-slate-200"}
                            fill={i < review.rating ? "currentColor" : "none"}
                            strokeWidth={i < review.rating ? 0 : 2}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className={`text-[10px] h-5 ${
                        review.sentiment === "positive"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {review.sentiment === "positive" ? "Positive" : "Negative"}
                      </Badge>
                      <span className="text-xs text-slate-400">{review.platform}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-700 leading-relaxed">{review.text}</p>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 shadow-sm"
                  >
                    <Sparkles size={14} className={generating ? "animate-spin" : ""} />
                    {generating ? "Crafting reply..." : showReply ? "Regenerate" : "Generate AI Reply"}
                  </Button>
                  {!showReply && !generating && (
                    <span className="text-xs text-slate-400">← Click to test live AI response</span>
                  )}
                </div>
              </div>

              {/* AI Reply */}
              <AnimatePresence>
                {showReply && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 mb-2">
                        <CheckCircle2 size={14} />
                        AI-generated draft · Friendly business tone
                      </div>
                      <p className="text-sm text-emerald-900/80 leading-relaxed">{review.reply}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 text-xs h-8">
                          <CheckCircle2 size={12} /> Publish to Platform
                        </Button>
                        <span className="text-[10px] text-slate-500">Live preview — no action taken on demo</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ───────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Dr. Arvind Mehta",
      business: "Smile Dental Clinic, Mumbai",
      text: "We used to spend 40 minutes every evening manually writing responses on Google Maps and Justdial. With ReviewMitra, positive reviews are replied to instantly, and my team spends their time with patients instead.",
      rating: 5,
    },
    {
      name: "Priyanka Nair",
      business: "Glow & Grace Salon, Bengaluru",
      text: "Handling sensitive feedback was always stressful. ReviewMitra drafts polite, de-escalating responses with owner contact details that win customers back. An absolute game-changer.",
      rating: 5,
    },
    {
      name: "Rajesh Malhotra",
      business: "Iron Fitness Gyms, Delhi NCR",
      text: "Managing reputation across 3 branches was painful. Having all reviews in one unified inbox plus multilingual support gives us immense peace of mind.",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <Star size={12} className="mr-1.5 fill-emerald-600" />
              Trusted by Hundreds of Local Businesses
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Loved by Clinics, Salons & Restaurants
            </h2>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
                <Quote size={28} className="text-emerald-200 mb-3" />
                <p className="text-sm text-slate-700 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.business}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} size={11} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING PREVIEW ────────────────────────────────────────────────
function PricingPreview() {
  const plans = [
    {
      name: "Starter",
      monthly: 399,
      tagline: "Ideal for single-location shops & practices",
      features: [
        "1 Business Location",
        "Google + Facebook + Justdial",
        "100 AI Replies / month",
        "Daily review auto-sync",
        "Smart in-store Review QR booster",
        "English, Hindi & Hinglish tones",
      ],
      highlight: false,
      icon: Star,
    },
    {
      name: "Growth",
      monthly: 799,
      tagline: "For high-volume businesses & multiple outlets",
      features: [
        "Up to 2 Business Locations",
        "Unlimited AI Replies",
        "Real-time webhook review sync",
        "4× daily Justdial monitoring",
        "Custom brand voice & learning memory",
        "Instant review alert notifications",
        "Priority developer support",
      ],
      highlight: true,
      icon: Zap,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Affordable Pricing · No Hidden Fees
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Transparent, Fair, and Predictable
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Try every feature free for 7 days. Upgrade only when you see real growth in your reviews and rating.
            </p>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <FadeUp key={plan.name} delay={i * 0.1}>
                <Card
                  className={`relative p-6 flex flex-col hover:shadow-xl transition-shadow ${
                    plan.highlight
                      ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm">
                      Most popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${
                      plan.highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">₹{plan.monthly}</span>
                    <span className="text-sm text-slate-500">/month</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    7-day free trial · Cancel anytime
                  </p>

                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`mt-6 w-full h-11 text-sm font-semibold ${
                      plan.highlight
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                    asChild
                  >
                    <Link href="/signup">Start 7-Day Free Trial</Link>
                  </Button>
                </Card>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> AES-256 token encryption</span>
            <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-600" /> Strict tenant isolation</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-600" /> Powered by Dodo Payments</span>
            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-emerald-600" /> 10+ language AI models</span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── FINAL CTA ──────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-8 sm:p-14 text-center text-white">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-black/10 blur-2xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Supercharge your business reputation{" "}
                <span className="text-emerald-200">on autopilot</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
                7 days free trial · Setup in 2 minutes · No credit card required.
                Start turning reviews into loyal customer relationships today.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 shadow-lg shadow-black/10 text-base h-12 px-7 font-semibold"
                  asChild
                >
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 gap-2 text-base h-12 px-7"
                  asChild
                >
                  <a href="https://wa.me/919876543210?text=Hello,%20I%20would%20like%20to%20know%20more%20about%20ReviewMitra" target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} />
                    Chat with Founder
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                <Star size={16} fill="white" strokeWidth={0} />
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 leading-none">
                  Review<span className="text-emerald-600">Mitra</span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">by OpenSoz</span>
              </div>
            </Link>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-[200px]">
              AI-powered review management and auto-reply suite for local businesses. An OpenSoz product.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-slate-500 hover:text-slate-900 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-slate-500 hover:text-slate-900 transition-colors">Pricing</a></li>
              <li><a href="#demo" className="text-slate-500 hover:text-slate-900 transition-colors">Interactive Demo</a></li>
              <li><a href="#how-it-works" className="text-slate-500 hover:text-slate-900 transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Legal & Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-slate-500 hover:text-slate-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-slate-500 hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="text-slate-500 hover:text-slate-900 transition-colors text-amber-600">Refund Policy</Link></li>
              <li><a href="https://opensoz.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900 transition-colors">OpenSoz ↗</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Support</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:help.opensoz@gmail.com"
                  className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                >
                  <Mail size={13} />
                  help.opensoz@gmail.com
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Contact & Demo Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} ReviewMitra. Published by <a href="https://opensoz.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">OpenSoz</a>. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-slate-600 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
