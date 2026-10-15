"use client";

import { useState } from "react";
import {
  HelpCircle,
  Globe,
  Star,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Copy,
  Info,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<"google" | "facebook" | "indiamart" | "qr" | "whatsapp">("google");
  const [copiedLink, setCopiedLink] = useState(false);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HelpCircle className="text-emerald-600" size={24} />
            Platform Setup & Connection Guide
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete step-by-step instructions to connect Google Maps, Facebook, IndiaMART, Justdial, and in-store QR Standees.
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 py-1 px-3 text-xs w-fit">
          <Sparkles size={13} className="mr-1 text-emerald-600" />
          MSME Quick Setup
        </Badge>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: "google", label: "Google Maps", icon: Globe },
          { id: "facebook", label: "Facebook Page", icon: Star },
          { id: "indiamart", label: "IndiaMART", icon: Building2 },
          { id: "qr", label: "In-Store QR Standee", icon: QrCode },
          { id: "whatsapp", label: "WhatsApp Alerts", icon: MessageCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Guide Content ──────────────────────────────────────── */}
      <div className="space-y-6">
        {/* TAB 1: GOOGLE MAPS */}
        {activeTab === "google" && (
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">How to Connect Google Maps & Google Business</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sync customer reviews and direct 5-star ratings directly to Google</p>
              </div>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Link href="/dashboard/connect">Go to Connect Page</Link>
              </Button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950">Zero Quota Barrier (Instant Connection)</p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Google Business Profile (GBP) official API aam developers ke liye restrict hoti hai. ReviewMitra direct Google Maps URL aur Place ID sync use karta hai jisse koi approval wait nahi karna padta.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Step-by-Step Instructions:</h3>
                
                <ol className="list-decimal list-inside space-y-3 pl-1 text-slate-600">
                  <li className="pl-1">
                    <strong className="text-slate-800">Open Google Maps:</strong> Apne phone ya computer par Google Maps open karein aur apni dukaan / restaurant / clinic search karein (e.g. <em>&quot;New Lucky Restaurant&quot;</em> ya <em>&quot;National Medical&quot;</em>).
                  </li>
                  <li className="pl-1">
                    <strong className="text-slate-800">Copy Business Link:</strong> <strong>&quot;Share&quot;</strong> button par click karein aur link copy karein (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">https://maps.app.goo.gl/...</code> ya full Google Search URL).
                  </li>
                  <li className="pl-1">
                    <strong className="text-slate-800">Paste in ReviewMitra:</strong> ReviewMitra dashboard me <Link href="/dashboard/connect" className="text-emerald-600 underline font-semibold">Connect Platforms</Link> page par jayein, Google box me link paste karein aur <strong>&quot;Sync Google Reviews&quot;</strong> dabayein.
                  </li>
                  <li className="pl-1">
                    <strong className="text-slate-800">Done!</strong> Aapke business ke reviews sync ho jayenge aur AI Agent unka multilingual reply automatically prepare karega.
                  </li>
                </ol>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 2: FACEBOOK PAGE */}
        {activeTab === "facebook" && (
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">How to Connect Your Facebook Business Page</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sync Facebook Recommendations and auto-post comment replies</p>
              </div>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                <Link href="/dashboard/connect">Go to Connect Page</Link>
              </Button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <ol className="list-decimal list-inside space-y-3 pl-1 text-slate-600">
                <li className="pl-1">
                  <strong className="text-slate-800">Admin Account:</strong> Make sure aap us personal Facebook account se logged in hain jo aapke Business Page ka Admin hai.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-800">Click &quot;Connect Facebook Page&quot;:</strong> ReviewMitra connect page par jakar Facebook button dabayein. Meta ka popup open hoga.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-800">Select Your Business Page:</strong> Apne restaurant, clinic ya shop ka Page select karein aur permissions allow karein.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-800">Automatic Sync:</strong> Customer recommendations automatically ReviewMitra inbox me sync ho jayenge.
                </li>
              </ol>
            </div>
          </Card>
        )}

        {/* TAB 3: INDIAMART */}
        {activeTab === "indiamart" && (
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">How to Connect IndiaMART Seller CRM</h2>
                <p className="text-xs text-slate-500 mt-0.5">10-second connection with your Registered Mobile Number or Seller Email</p>
              </div>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Link href="/dashboard/connect">Connect IndiaMART</Link>
              </Button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900">
                <strong>No API Key Needed:</strong> IndiaMART connect karne ke liye kisi complex technical CRM key ki zaroorat nahi hai. Bas apna registered IndiaMART phone ya email daalein.
              </div>

              <ol className="list-decimal list-inside space-y-3 pl-1 text-slate-600">
                <li className="pl-1">
                  <strong className="text-slate-800">Enter Number:</strong> IndiaMART seller portal par jo 10-digit mobile number ya email registered hai wo input karein.
                </li>
                <li className="pl-1">
                  <strong className="text-slate-800">Click &quot;Connect IndiaMART&quot;:</strong> ReviewMitra aapka seller account link kar lega aur verified B2B buyer inquiries monitor karega.
                </li>
              </ol>
            </div>
          </Card>
        )}

        {/* TAB 4: IN-STORE QR STANDEE */}
        {activeTab === "qr" && (
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">In-Store Smart QR Code Booster Guide</h2>
                <p className="text-xs text-slate-500 mt-0.5">Boost 5-star Google ratings while privately shielding 1-3 star complaints</p>
              </div>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Link href="/dashboard/qr-booster">Download Standee</Link>
              </Button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Happy Customers (4-5★)
                  </p>
                  <p className="text-xs text-emerald-800">
                    Customer gets 1-tap AI written positive review suggestions and is redirected directly to your real Google Maps review box!
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-1">
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-amber-600" />
                    Unhappy Customers (1-3★)
                  </p>
                  <p className="text-xs text-amber-800">
                    Feedback is routed privately to your dashboard so you can fix customer issues offline without public Google rating damage.
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm pt-2">Best Placement Tips:</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
                <li><strong>Restaurants & Cafes:</strong> Table standee par lagayein bill ke sath.</li>
                <li><strong>Medical Stores & Clinics:</strong> Cash billing counter aur waiting area me lagayein.</li>
                <li><strong>Salons & Retail:</strong> Reception desk aur exit door par lagayein.</li>
              </ul>
            </div>
          </Card>
        )}

        {/* TAB 5: WHATSAPP ALERTS */}
        {activeTab === "whatsapp" && (
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">WhatsApp Alert Notifications Guide</h2>
                <p className="text-xs text-slate-500 mt-0.5">Receive instant alerts on your WhatsApp number without expensive Meta API costs</p>
              </div>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Link href="/dashboard/settings">Notification Settings</Link>
              </Button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                ReviewMitra connects to your personal WhatsApp number to send two types of critical alerts:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-slate-600">
                <li><strong>Instant Negative Review Alert:</strong> Jab bhi kisi customer ka 1★ ya 2★ review aayega, aapko turant alert aur AI apology draft WhatsApp par aayega.</li>
                <li><strong>Daily 9:00 AM Morning Digest:</strong> Pichle 24 ghante ke total reviews, average star rating aur AI response count ka summary.</li>
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* ─── Direct Help Support Card ───────────────────────────── */}
      <Card className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Still have a question or need personalized setup help?</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Humari dedicated support team email par 1-on-1 assistance deti hai.
          </p>
        </div>
        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0">
          <a href="mailto:help.opensoz@gmail.com">Contact help.opensoz@gmail.com</a>
        </Button>
      </Card>
    </div>
  );
}
