"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Zap,
  Star,
  Building2,
  ArrowRight,
  Menu,
  X,
  Bell,
  CheckCircle2,
  Clock,
  TrendingUp,
  Globe,
  Smartphone,
  Bot,
  BarChart3,
  Languages,
  Lock,
  Play,
  Quote,
  QrCode,
  Mail,
  Send,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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
              <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                by OpenSoz
              </span>
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
                Get Started
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
                    <Link href="/signup">Get Started</Link>
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

// ─── HERO SECTION WITH 3D GEMINI-STYLE LIVE AI TYPING VIDEO STAGE ───
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/50" />
      <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] rounded-full bg-sky-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left — Copy */}
          <div className="lg:col-span-6">
            <FadeUp>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50/80 text-emerald-700 backdrop-blur-sm px-3 py-1 text-xs font-medium"
              >
                <Sparkles size={12} className="mr-1.5" />
                Agentic AI Reputation Engine · An OpenSoz Product
              </Badge>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="mt-5 text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Every review answered{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600">
                  in the customer&apos;s own language.
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
                Connect Google Maps, Facebook Pages, Justdial, and IndiaMART without API approval headaches. Our Gemini 2.5 Agentic AI detects the exact language of every incoming review, crafts a personalized reply, and sends live reports to your WhatsApp via OpenWA.
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
                    Start Now — Plans from ₹79/mo
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
                    Try Live AI Demo
                  </a>
                </Button>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Multi-Business Switcher (2+ Shops)
                </span>
                <span className="flex items-center gap-1.5">
                  <QrCode size={14} className="text-emerald-600" />
                  Smart In-Store QR Booster
                </span>
                <span className="flex items-center gap-1.5">
                  <Languages size={14} className="text-emerald-600" />
                  Same-Language Auto Reply
                </span>
              </div>
            </FadeUp>
          </div>

          {/* Right — Gemini-Style 3D Live AI Agent Typing Stage */}
          <FadeUp delay={0.25} className="lg:col-span-6">
            <Hero3DAgentStage />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/**
 * Gemini-Inspired 3D Interactive Video/Animation Stage:
 * Shows a real incoming customer review arriving on a 3D glass stage,
 * the Agentic AI brain detecting the language & sentiment, typing out the reply
 * character-by-character in real time, and dispatching it automatically!
 */
function Hero3DAgentStage() {
  const LIVE_SCENARIOS = [
    {
      platform: "Google Maps",
      badge: "G",
      badgeBg: "bg-blue-600",
      business: "Smile Dental Clinic · Branch 1",
      reviewer: "Ananya Verma",
      rating: 5,
      languageTag: "English Detected",
      review:
        "Painless root canal treatment! Dr. Mehta explained every step clearly and the clinic is spotless.",
      aiReply:
        "Thank you so much for the 5-star review, Ananya! Dr. Mehta and our team at Smile Dental Clinic are thrilled you had a comfortable, painless experience. We look forward to seeing you at your next checkup!",
    },
    {
      platform: "Justdial",
      badge: "Jd",
      badgeBg: "bg-orange-600",
      business: "Royal Mens Salon & Spa",
      reviewer: "राजेश शर्मा",
      rating: 5,
      languageTag: "Hindi (हिन्दी) Detected",
      review:
        "बहुत ही शानदार सर्विस और साफ-सफाई! स्टाफ का व्यवहार बहुत अच्छा है, समय पर काम हुआ।",
      aiReply:
        "नमस्ते राजेश जी, रॉयल मेन्स सैलून को 5-स्टार रेटिंग देने के लिए आपका हार्दिक धन्यवाद! हमें खुशी है कि आपको हमारी सर्विस और साफ-सफाई पसंद आई। जल्द ही फिर से पधारें! 🙏",
    },
    {
      platform: "IndiaMART",
      badge: "IM",
      badgeBg: "bg-indigo-600",
      business: "Surat Textile Hub · Branch 2",
      reviewer: "केतन पटेल (Ketan Patel)",
      rating: 5,
      languageTag: "Gujarati (ગુજરાતી) Detected",
      review:
        "કાપડની ક્વોલિટી ખૂબ જ સરસ છે અને ડિલિવરી પણ સમયસર મળી ગઈ. ખૂબ સંતોષકારક સેવા!",
      aiReply:
        "નમસ્તે કેતનભાઈ, સુરત ટેક્સટાઇલ હબને 5-સ્ટાર રેટિંગ આપવા બદલ ખૂબ ખૂબ આભાર! અમને આનંદ છે કે તમને અમારા કાપડની ક્વોલિટી અને સમયસર ડિલિવરી પસંદ આવી. 🙏",
    },
  ];

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<"incoming" | "analyzing" | "typing" | "sent">("incoming");
  const [typedChars, setTypedChars] = useState(0);

  const active = LIVE_SCENARIOS[scenarioIdx];

  useEffect(() => {
    setPhase("incoming");
    setTypedChars(0);

    const t1 = setTimeout(() => setPhase("analyzing"), 900);
    const t2 = setTimeout(() => setPhase("typing"), 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scenarioIdx]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typedChars < active.aiReply.length) {
      const timer = setTimeout(() => {
        setTypedChars((c) => Math.min(active.aiReply.length, c + 3));
      }, 24);
      return () => clearTimeout(timer);
    } else {
      const sentTimer = setTimeout(() => setPhase("sent"), 400);
      return () => clearTimeout(sentTimer);
    }
  }, [phase, typedChars, active.aiReply.length]);

  useEffect(() => {
    if (phase !== "sent") return;
    const nextTimer = setTimeout(() => {
      setScenarioIdx((i) => (i + 1) % LIVE_SCENARIOS.length);
    }, 2800);
    return () => clearTimeout(nextTimer);
  }, [phase, LIVE_SCENARIOS.length]);

  return (
    <div className="relative mx-auto max-w-lg [perspective:1200px]">
      {/* 3D Ambient Gemini Aura Glow */}
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r from-emerald-400/30 via-teal-400/25 to-sky-400/30 blur-2xl animate-pulse" />

      {/* 3D Tilted Glass Stage */}
      <motion.div
        initial={{ rotateY: -6, rotateX: 4 }}
        animate={{ rotateY: [-5, 4, -5], rotateX: [3, -2, 3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[2rem] border border-slate-800/80 bg-slate-950 p-5 sm:p-6 text-white shadow-2xl shadow-emerald-950/40"
      >
        {/* Embedded 3D Animated MP4 Video Player */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-inner">
          <video
            src="/gemini-ai-review-agent.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
        </div>

        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu size={13} className="text-emerald-400" />
              Gemini 2.5 Agentic AI · Live Stream
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            24/7 Auto-Pilot
          </span>
        </div>

        {/* Step 1: Incoming Customer Review Card */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl ${active.badgeBg} text-white text-xs font-extrabold shadow-md`}
              >
                {active.badge}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">{active.reviewer}</p>
                  <span className="text-[10px] text-slate-400">on {active.platform}</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">{active.business}</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: active.rating }).map((_, idx) => (
                <Star key={idx} size={12} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            &ldquo;{active.review}&rdquo;
          </p>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
              <Languages size={12} /> {active.languageTag}
            </span>
            <span>Received just now</span>
          </div>
        </div>

        {/* Step 2: Agentic AI Thinking & Live Typing Box */}
        <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-bold shadow">
                <Bot size={15} />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  ReviewMitra Agentic AI
                </p>
                <p className="text-[10px] text-slate-400">
                  {phase === "incoming" && "Detecting new review..."}
                  {phase === "analyzing" && `Analyzing sentiment & matching ${active.languageTag}...`}
                  {phase === "typing" && "Typing personalized owner response..."}
                  {phase === "sent" && `Published live to ${active.platform} & sent to WhatsApp!`}
                </p>
              </div>
            </div>

            {phase === "sent" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-slate-950 px-2.5 py-0.5 text-[10px] font-extrabold">
                <CheckCircle2 size={11} /> Auto-Sent
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 text-emerald-300 px-2.5 py-0.5 text-[10px] font-semibold">
                <Sparkles size={10} className="animate-spin" /> Agent Active
              </span>
            )}
          </div>

          <div className="min-h-[84px] rounded-xl bg-slate-950/80 border border-emerald-500/20 p-3 text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
            {phase === "incoming" || phase === "analyzing" ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:300ms]" />
                <span className="text-xs ml-1">
                  Agentic Brain: Extracting context & matching customer language...
                </span>
              </div>
            ) : (
              <p>
                {active.aiReply.slice(0, typedChars)}
                {phase === "typing" && (
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-emerald-400 animate-pulse" />
                )}
              </p>
            )}
          </div>

          {/* Scenario selector dots */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {LIVE_SCENARIOS.map((s, idx) => (
                <button
                  key={s.platform}
                  type="button"
                  onClick={() => setScenarioIdx(idx)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    scenarioIdx === idx
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {s.platform}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Send size={10} /> OpenWA Synced
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: Globe,
      text: "Logging into Google Maps, Facebook, Justdial, and IndiaMART separately every day",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: MessageCircle,
      text: "Missing negative reviews or replying in the wrong tone when customers are upset",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Clock,
      text: "Struggling with 0-quota API errors or complicated developer approvals",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Smartphone,
      text: "Expensive ₹5,000+/month tools that small and medium businesses cannot justify",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
              Why ReviewMitra?
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Your customers leave reviews daily.{" "}
              <span className="text-emerald-600">Let Agentic AI handle them automatically.</span>
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
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect All Your Businesses",
      desc: "Link 1, 2, or up to 5 business locations on the same email. Connect Google Maps, Facebook, Justdial, and IndiaMART directly via URL, Mobile, or Email.",
      icon: Globe,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      step: "02",
      title: "Same-Language Agentic AI Replies",
      desc: "Our Gemini 2.5 Flash agent detects whether a review is in English, Hindi, Gujarati, Marathi, Tamil, or Hinglish and replies in the exact same language.",
      icon: Bot,
      gradient: "from-teal-500 to-sky-500",
    },
    {
      step: "03",
      title: "QR Review Booster & OpenWA Reports",
      desc: "Push 4–5★ customers directly to your Google Maps review box via in-store QR standees, and receive daily reports on your WhatsApp via OpenWA QR/Pairing Code.",
      icon: QrCode,
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
              3-Step Setup
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Setup in 2 minutes. Runs 24/7 on autopilot.
            </h2>
          </div>
        </FadeUp>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {steps.map((s, i) => (
            <FadeUp key={s.step} delay={i * 0.15}>
              <div className="relative group">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg shadow-emerald-600/10 group-hover:scale-105 transition-transform`}
                  >
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                      Step {s.step}
                    </p>
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

function FeaturesGrid() {
  const features = [
    {
      icon: Globe,
      title: "4-Platform No-API Sync",
      desc: "Sync Google Maps, Facebook Pages, Justdial, and IndiaMART without waiting for developer API quota approvals.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Building2,
      title: "Multi-Business Switcher",
      desc: "Have 2 or more businesses on the same email? Switch between outlets in 1 click from the top header.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Languages,
      title: "Same-Language Agentic AI",
      desc: "Automatically detects the language of every incoming review and crafts the reply in the exact same language.",
      color: "bg-orange-50 text-orange-600",
    },
    {
      icon: QrCode,
      title: "Direct Push QR Booster",
      desc: "Routes 4–5★ customers directly to your real Google Maps review box while shielding 1–3★ complaints privately.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: Smartphone,
      title: "OpenWA QR & Pairing Code",
      desc: "Link your WhatsApp via QR scan or 8-digit code to receive daily reports and negative review alerts on your own number.",
      color: "bg-teal-50 text-teal-600",
    },
    {
      icon: BarChart3,
      title: "Sentiment & Safety Lock",
      desc: "Negative 1–2★ reviews are never auto-posted blindly—they include your support phone number and alert you first.",
      color: "bg-pink-50 text-pink-600",
    },
    {
      icon: Lock,
      title: "AES-256 Security & Email Verify",
      desc: "Full email verification with instant resend, Google + Password account linking, and encrypted session storage.",
      color: "bg-slate-100 text-slate-700",
    },
    {
      icon: Zap,
      title: "Pocket-Friendly Plans",
      desc: "Plans start at just ₹79/month (+18% GST) for 100 reviews, plus a ₹1 live verification test plan.",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sparkles size={12} className="mr-1.5" />
              Complete Reputation Suite
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Built for Real Local Businesses & B2B Sellers
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Everything you need to grow 5-star ratings across Google Maps, Facebook, Justdial, and IndiaMART.
            </p>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.05}>
              <Card className="p-5 h-full group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${f.color} group-hover:scale-110 transition-transform`}
                >
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

function InteractiveDemo() {
  const [activeReview, setActiveReview] = useState(0);
  const [showReply, setShowReply] = useState(false);
  const [generating, setGenerating] = useState(false);

  const demoReviews = [
    {
      name: "Priya Iyer",
      platform: "Google Maps",
      lang: "English",
      rating: 5,
      text: "Painless tooth extraction! The doctor explained every step before starting. Affordable and professional.",
      sentiment: "positive",
      reply:
        "Thank you so much for the 5-star review, Priya! Our entire clinical team is delighted to hear you had a comfortable and painless experience. We look forward to welcoming you back at your next visit!",
    },
    {
      name: "अमित कुमार (Amit Kumar)",
      platform: "Justdial",
      lang: "Hindi (हिन्दी)",
      rating: 5,
      text: "बहुत ही बढ़िया सर्विस और वाजिब दाम। स्टाफ ने बहुत अच्छे से मदद की।",
      sentiment: "positive",
      reply:
        "नमस्ते अमित जी, आपके 5-स्टार रिव्यू और सराहना के लिए हार्दिक धन्यवाद! हमें खुशी है कि आपको हमारी सर्विस और कीमतें पसंद आईं। फिर से सेवा का अवसर दें! 🙏",
    },
    {
      name: "Mohammed Ali",
      platform: "Google Maps",
      lang: "English (De-escalation)",
      rating: 1,
      text: "Took appointment for 6pm, reached on time, was made to wait 45 minutes. Very frustrating.",
      sentiment: "negative",
      reply:
        "Dear Mohammed, we sincerely apologize for the wait you experienced despite booking an appointment. We have updated our scheduling buffer to prevent this. Please reach out to our management desk directly so we can make this right for you.",
    },
  ];

  const handleGenerate = () => {
    setShowReply(false);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowReply(true);
    }, 900);
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
              Interactive Agentic AI Demo
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Test Same-Language AI Reply Generation
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Select a sample review below and click &quot;Generate Same-Language Reply&quot;.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-10 max-w-3xl mx-auto">
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
                  <span className={r.rating >= 4 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                    ★{r.rating}
                  </span>
                  {r.name}
                  <span className="text-slate-400">· {r.lang}</span>
                </button>
              ))}
            </div>

            <Card className="overflow-hidden border-slate-200">
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
                            className={
                              i < review.rating
                                ? review.rating >= 4
                                  ? "text-emerald-500"
                                  : "text-red-400"
                                : "text-slate-200"
                            }
                            fill={i < review.rating ? "currentColor" : "none"}
                            strokeWidth={i < review.rating ? 0 : 2}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 bg-emerald-50 text-emerald-700">
                        {review.lang}
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
                    {generating
                      ? "Agentic AI Analyzing..."
                      : showReply
                      ? "Regenerate Reply"
                      : "Generate Same-Language Reply"}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showReply && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-2">
                        <CheckCircle2 size={14} />
                        Gemini 2.5 Flash · Matched Language: {review.lang}
                      </div>
                      <p className="text-sm text-emerald-950 leading-relaxed">{review.reply}</p>
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

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Dr. Arvind Mehta",
      business: "Smile Dental Clinic (2 Branches), Mumbai",
      text: "Both of our clinic branches are linked under one email. Positive reviews get answered automatically in the patient's language, and our QR standee doubled our 5-star Google reviews.",
      rating: 5,
    },
    {
      name: "Priyanka Nair",
      business: "Glow & Grace Salon, Bengaluru",
      text: "The OpenWA QR connection sends our daily morning summary directly to my WhatsApp. Whenever a 1-2 star review comes in, I get an alert with a ready apology draft.",
      rating: 5,
    },
    {
      name: "Ketan Patel",
      business: "Patel Engineering Works (IndiaMART Seller), Surat",
      text: "Connecting IndiaMART with just our mobile number and catalog link was effortless. And at ₹149/month, it is the most value-for-money software we use.",
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
              Trusted by Indian MSMEs
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Built for Clinics, Salons, Retailers & IndiaMART Sellers
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
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AFFORDABLE PRICING PREVIEW (₹79, ₹149, ₹249, ₹399 + 18% GST Extra) ───
function PricingPreview() {
  const plans = [
    {
      name: "Nano Plan",
      monthly: 79,
      gst: "14.22",
      reviews: "100 Reviews / month",
      shops: "1 Business Location",
      tagline: "For small single-counter shops",
      highlight: false,
    },
    {
      name: "Starter Plan",
      monthly: 149,
      gst: "26.82",
      reviews: "500 Reviews / month",
      shops: "1 Business Location",
      tagline: "Ideal for clinics, salons & cafes",
      highlight: false,
    },
    {
      name: "Growth Plan",
      monthly: 249,
      gst: "44.82",
      reviews: "1,000 Reviews / month",
      shops: "Up to 2 Business Locations",
      tagline: "Best for owners with 2 businesses",
      highlight: true,
    },
    {
      name: "Pro Unlimited",
      monthly: 399,
      gst: "71.82",
      reviews: "2,500+ Reviews / month",
      shops: "Up to 5 Business Locations",
      tagline: "For high-volume multi-outlet chains",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Affordable Plans · Tax Exclusive (+18% GST at Checkout)
            </Badge>
            <h2 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Honest Pricing for Every Business Size
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Whether you get 100 reviews a month or 2,500+, we have an affordable plan for you. Includes a <strong>₹1 Live Payment Test</strong> inside your billing dashboard.
            </p>
          </div>
        </FadeUp>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.08}>
              <Card
                className={`relative p-6 flex flex-col justify-between h-full hover:shadow-xl transition-shadow ${
                  plan.highlight
                    ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-slate-200"
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white shadow-sm">
                    Most Popular (2 Shops)
                  </Badge>
                )}

                <div>
                  <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">₹{plan.monthly}</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    + ₹{plan.gst} (18% GST extra)
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2 font-bold text-slate-900">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      {plan.reviews}
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 size={14} className="text-emerald-600 shrink-0" />
                      {plan.shops}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      Google Maps, Facebook, Justdial & IndiaMART
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      Same-Language Gemini 2.5 Agentic AI
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      In-Store QR Booster & OpenWA Reports
                    </li>
                  </ul>
                </div>

                <Button
                  className={`mt-6 w-full h-10 text-xs font-semibold ${
                    plan.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                  asChild
                >
                  <Link href="/signup">Choose {plan.name}</Link>
                </Button>
              </Card>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> ₹1 Live Payment Test Available
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-600" /> Powered by Dodo Payments (UPI & Cards)
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} className="text-emerald-600" /> Support: help.opensoz@gmail.com
            </span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-8 sm:p-14 text-center text-white">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Automate your business reviews{" "}
                <span className="text-emerald-200">in every customer&apos;s language</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
                Plans start at ₹79/month (+18% GST) · Connect Google, Facebook, Justdial & IndiaMART in minutes.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 shadow-lg shadow-black/10 text-base h-12 px-7 font-semibold"
                  asChild
                >
                  <Link href="/signup">
                    Create Your Account
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 gap-2 text-base h-12 px-7"
                  asChild
                >
                  <a href="mailto:help.opensoz@gmail.com">
                    <Mail size={18} />
                    Email help.opensoz@gmail.com
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

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                <Star size={16} fill="white" strokeWidth={0} />
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 leading-none">
                  Review<span className="text-emerald-600">Mitra</span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                  by OpenSoz
                </span>
              </div>
            </Link>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-[220px]">
              Agentic AI review management, direct QR review booster, and OpenWA WhatsApp reporting for Indian businesses.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#demo" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Live AI Demo
                </a>
              </li>
              <li>
                <Link href="/dashboard/help" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Platform Setup Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Legal & Company
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-slate-500 hover:text-slate-900 transition-colors text-amber-600">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://opensoz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  OpenSoz ↗
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Support
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:help.opensoz@gmail.com"
                  className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors font-semibold"
                >
                  <Mail size={14} />
                  help.opensoz@gmail.com
                </a>
              </li>
              <li>
                <Link href="/dashboard/help" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Help & Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} ReviewMitra · Published by{" "}
            <a href="https://opensoz.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
              OpenSoz
            </a>
            {" "}· Support: help.opensoz@gmail.com
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="hover:text-slate-600 transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
