"use client";

import Link from "next/link";
import {
  HelpCircle,
  Building2,
  Globe,
  QrCode,
  Bot,
  Smartphone,
  CreditCard,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GUIDE_SECTIONS = [
  {
    step: "1",
    title: "Managing Multiple Businesses (2+ Shops on One Email)",
    icon: Building2,
    badge: "Multi-Location Support",
    description:
      "If you have 2 or more businesses registered under the same email address, ReviewMitra keeps each business profile separate so reviews never mix.",
    steps: [
      "Look at the top header bar next to the ReviewMitra logo and click the Business Switcher dropdown.",
      "Click '+ Add 2nd / New Business Location' to register your second shop, clinic, or branch.",
      "When you connect Google Business OAuth, ReviewMitra automatically detects all locations on your Google account and creates separate profiles for each.",
      "Switch between your businesses anytime with 1 click from the header dropdown.",
    ],
    actionHref: "/dashboard/connect",
    actionLabel: "Manage Business Locations",
  },
  {
    step: "2",
    title: "Connecting Google Maps, Facebook, Justdial & IndiaMART (No API Keys Needed)",
    icon: Globe,
    badge: "Zero Quota Hassle",
    description:
      "You do not need developer API approvals or paid CRM keys to fetch your real reviews.",
    steps: [
      "Google Maps: Go to 'Connect Platforms' and paste your Google Maps share link, Place ID, or Business Name + City inside the 'Instant Google Maps Link Sync' box.",
      "Facebook Page: Paste your public Facebook Page URL (e.g., https://www.facebook.com/YourPage/reviews) and click 'Connect Facebook URL'.",
      "Justdial: Paste your public Justdial listing URL to extract real customer reviews and ratings via Schema.org JSON-LD.",
      "IndiaMART: Enter your registered IndiaMART Mobile Number, Email Address, or Company Catalog URL — no CRM API Key is required.",
    ],
    actionHref: "/dashboard/connect",
    actionLabel: "Open Platform Connectors",
  },
  {
    step: "3",
    title: "Smart In-Store QR Code Review Booster (Direct Platform Push)",
    icon: QrCode,
    badge: "Direct 5★ Push + 1–3★ Shield",
    description:
      "Your QR Standee routes happy 4–5★ customers directly to your real Google Maps / Facebook / Justdial review box while capturing 1–3★ complaints privately.",
    steps: [
      "Open 'QR Booster' from the left sidebar.",
      "Under '2. Direct Platform Review Links', verify or paste your Google Place ID / Write-a-Review URL, Facebook Review URL, and Justdial URL, then click 'Save Direct Review Links'.",
      "Click 'Print Counter Standee' or 'Download QR PNG' and place the QR code at your reception counter or billing desk.",
      "When a customer scans and taps 4 or 5 stars, AI drafts a natural review for your business, copies it to their clipboard, and opens your exact Google Maps review box.",
      "When a customer taps 1 to 3 stars, their feedback is saved privately in your Unified Inbox under 'In-Store QR (qr_direct)' and triggers an instant WhatsApp alert to your phone.",
    ],
    actionHref: "/dashboard/qr-booster",
    actionLabel: "Configure QR Review Booster",
  },
  {
    step: "4",
    title: "Single-Key Gemini Agentic AI & Automatic Language Matching",
    icon: Bot,
    badge: "12+ Languages · Gemini 2.5 Flash",
    description:
      "ReviewMitra uses a single unified GEMINI_API_KEY (gemini-2.5-flash) with an autonomous 4-stage Agentic AI workflow.",
    steps: [
      "Language Detection: The AI automatically identifies whether the customer wrote in English, Hindi (Devanagari), Gujarati, Marathi, Tamil, Telugu, Bengali, Punjabi, or Hinglish.",
      "Same-Language Reply: The AI writes the reply in the exact same language and script used by the customer.",
      "Positive Reviews (4–5★): Can be set to auto-reply automatically after a natural human-like delay (e.g., 5 minutes).",
      "Negative Reviews (1–2★): Never auto-posted blindly. The AI drafts a polite apology including your support phone number and sends it to your WhatsApp for 1-click approval.",
    ],
    actionHref: "/dashboard/auto-reply",
    actionLabel: "Configure Agentic AI Rules",
  },
  {
    step: "5",
    title: "OpenWA (QR & 8-Digit Pairing Code) WhatsApp Reports",
    icon: Smartphone,
    badge: "No Meta Cloud API Required",
    description:
      "Receive daily morning reputation summaries and instant negative review alerts directly on your personal or shop WhatsApp number.",
    steps: [
      "Go to 'Settings' from the dashboard sidebar.",
      "Enter your 10-digit WhatsApp mobile number in the 'OpenWA Direct WhatsApp Connection' card.",
      "Choose either 'Generate OpenWA QR Code' (scan from WhatsApp → Linked Devices) OR 'Get 8-Digit Pairing Code' (link using your phone number).",
      "Click 'Send Business Report to My WhatsApp Now' anytime to test and receive your live review summary immediately.",
    ],
    actionHref: "/dashboard/settings",
    actionLabel: "Connect OpenWA WhatsApp",
  },
  {
    step: "6",
    title: "Affordable Plans, ₹1 Live Payment Test & GST Policy",
    icon: CreditCard,
    badge: "Tax Exclusive (+18% GST)",
    description:
      "Plans are priced affordably for every shop size (Nano ₹79, Starter ₹149, Growth ₹249, Pro ₹399) with a ₹1 Live Verification Test option.",
    steps: [
      "Before upgrading to a full monthly plan, click 'Run ₹1 Live Payment Test' on the Billing page to verify live UPI/Card checkout and webhook activation.",
      "All plan base prices are strictly tax-exclusive (`tax_inclusive: false`), meaning 18% GST is added transparently at checkout and paid by the subscriber.",
      "Nano (₹79/mo + GST): 100 reviews/mo · Starter (₹149/mo + GST): 500 reviews/mo · Growth (₹249/mo + GST): 1,000 reviews/mo & 2 shops · Pro (₹399/mo + GST): 2,500+ reviews/mo & 5 shops.",
    ],
    actionHref: "/dashboard/billing",
    actionLabel: "View Plans & ₹1 Test",
  },
];

export default function HelpAndGuidePage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Platform Help & Complete Setup Guide
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">Official Documentation</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Step-by-step instructions to connect your businesses, automate same-language AI replies, and receive WhatsApp reports.
          </p>
        </div>

        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5"
        >
          <a href="mailto:help.opensoz@gmail.com?subject=ReviewMitra%20Support%20Request">
            <Mail size={14} /> Contact Support (help.opensoz@gmail.com)
          </a>
        </Button>
      </div>

      {/* ─── Quick Support Banner ───────────────────────────────── */}
      <Card className="p-5 border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Need Direct Assistance from the OpenSoz Engineering Team?
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Email us anytime at{" "}
              <a
                href="mailto:help.opensoz@gmail.com"
                className="font-bold text-emerald-700 underline"
              >
                help.opensoz@gmail.com
              </a>{" "}
              with your business name and registered email address. We respond rapidly to all setup and billing inquiries.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-emerald-800 bg-white px-3 py-2 rounded-xl border border-emerald-200">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>help.opensoz@gmail.com</span>
        </div>
      </Card>

      {/* ─── Step-by-Step Guide Cards ───────────────────────────── */}
      <div className="grid gap-5">
        {GUIDE_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.step} className="p-5 sm:p-6 border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                        Step {sec.step}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                        {sec.badge}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5">{sec.title}</h3>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="text-xs h-8 gap-1.5 shrink-0">
                  <Link href={sec.actionHref}>
                    {sec.actionLabel} <ArrowRight size={13} />
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{sec.description}</p>

              <ul className="space-y-2">
                {sec.steps.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* ─── Supported Languages Reference Card ─────────────────── */}
      <Card className="p-5 border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Languages size={17} className="text-emerald-600" />
          <span>Supported Auto-Detected Review Languages</span>
        </div>
        <p className="text-xs text-slate-600">
          ReviewMitra&apos;s Agentic AI automatically detects and replies in the customer&apos;s exact language:
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "English",
            "Hindi (हिन्दी)",
            "Hinglish (Roman Hindi)",
            "Gujarati (ગુજરાતી)",
            "Marathi (मराठी)",
            "Tamil (தமிழ்)",
            "Telugu (తెలుగు)",
            "Bengali (বাংলা)",
            "Punjabi (ਪੰਜਾਬੀ)",
            "Kannada (ಕನ್ನಡ)",
            "Malayalam (മലയാളം)",
            "Urdu (اردو)",
          ].map((lang) => (
            <span
              key={lang}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px]"
            >
              {lang}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
