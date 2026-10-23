"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  ShieldCheck,
  CheckCircle2,
  Save,
  Languages,
  Sliders,
  Check,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AutoReplySettingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("My Business");
  const [positiveAuto, setPositiveAuto] = useState(true);
  const [neutralAuto, setNeutralAuto] = useState(false);
  const [postDelay, setPostDelay] = useState("5");
  const [tone, setTone] = useState<"friendly" | "professional" | "hinglish" | "brief">("friendly");
  const [matchReviewLanguage, setMatchReviewLanguage] = useState(true);
  const [supportPhone, setSupportPhone] = useState("");
  const [cdataDefense, setCdataDefense] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedBizId = typeof window !== "undefined" ? localStorage.getItem("rm_active_business_id") : null;
        const url = savedBizId ? `/api/whatsapp/test-alert?businessId=${encodeURIComponent(savedBizId)}` : "/api/whatsapp/test-alert";
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.business) {
            setBusinessId(data.business.id);
            setBusinessName(data.business.businessName || "My Business");
            setPositiveAuto(Boolean(data.business.autoReplyPositive));
            setNeutralAuto(Boolean(data.business.autoReplyNeutral));
            setPostDelay(String(data.business.autoReplyDelay ?? 5));
            setTone((data.business.defaultTone as any) || "friendly");
            setMatchReviewLanguage(data.business.matchReviewLanguage !== false);
            setSupportPhone(data.business.phoneSupport || "");
          }
        }
      } catch (e) {
        console.error("Failed to load AI auto-reply settings:", e);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/whatsapp/test-alert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          autoReplyPositive: positiveAuto,
          autoReplyNeutral: neutralAuto,
          autoReplyDelay: Number(postDelay) || 5,
          defaultTone: tone,
          matchReviewLanguage,
          phoneSupport: supportPhone.trim(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setNotice("Agentic AI configuration saved to database successfully.");
        setTimeout(() => setSaved(false), 2500);
      } else {
        setNotice("Failed to save AI configuration. Please try again.");
      }
    } catch {
      setNotice("Network error while saving AI configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Agentic AI Auto-Reply — {businessName}
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">Gemini 2.5 Flash</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Powered by a single unified Gemini API key. Automatically detects the customer&apos;s language and replies in the exact same language.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold h-9 shadow-sm"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Saving..." : saved ? "Saved to Database!" : "Save Changes"}
        </Button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="underline text-xs ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Same-Language Agentic AI Card ──────────────────────── */}
      <Card className="p-5 sm:p-6 border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0">
              <Languages size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900">
                  Automatic Customer Language Matching
                </h3>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                  12+ Indian & Global Languages
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                When enabled, the Agentic AI detects the exact language and script of every incoming review (English, Hindi, Gujarati, Marathi, Tamil, Telugu, Bengali, Punjabi, or Hinglish) and writes the reply in that exact same language.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMatchReviewLanguage(!matchReviewLanguage)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              matchReviewLanguage ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                matchReviewLanguage ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* ─── Sentiment Rules Grid ───────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Sliders size={16} className="text-emerald-600" />
          Sentiment-Based Autonomous Rules
        </h3>

        <div className="grid gap-4">
          {/* Rule 1: Positive Reviews (4-5★) */}
          <Card className="p-5 border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Positive Reviews (4★ and 5★)</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Auto-Pilot Recommended</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Thank the customer warmly, acknowledge the specific praise they mentioned, and invite them back in their own language.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPositiveAuto(!positiveAuto)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  positiveAuto ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    positiveAuto ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {positiveAuto && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Human-Like Reply Delay:</span>
                <div className="flex items-center gap-1.5">
                  {["0", "5", "15", "30"].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPostDelay(mins)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        postDelay === mins
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {mins === "0" ? "Instant" : `${mins} min`}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400">
                  (Natural delay makes automated replies appear human-written)
                </span>
              </div>
            )}
          </Card>

          {/* Rule 2: Neutral Reviews (3★) */}
          <Card className="p-5 border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Neutral Reviews (3★)</span>
                  <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50 text-[10px]">
                    Configurable
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Customers who had an average visit. Choose whether AI replies automatically or saves a draft for owner review.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNeutralAuto(!neutralAuto)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  neutralAuto ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    neutralAuto ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Current mode: <strong>{neutralAuto ? "Auto-post balanced polite reply" : "Save draft and notify owner"}</strong>
            </div>
          </Card>

          {/* Rule 3: Negative Reviews (1-2★) — Guardrail */}
          <Card className="p-5 border-red-100 bg-red-50/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Negative Reviews (1★ and 2★)</span>
                  <Badge className="bg-red-100 text-red-800 text-[10px] font-bold">Safety Lock: Owner Approval</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Negative reviews are <strong>never auto-posted blindly</strong>. The Agentic AI immediately drafts a de-escalating apology in the customer&apos;s language and sends it to your WhatsApp for 1-click approval.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded shrink-0">
                Draft + WhatsApp Alert
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-red-100/60">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Owner / Support Resolution Phone Number (Included in 1–2★ Apology Replies)
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs bg-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Allows unhappy customers to call your management desk directly to resolve their issue offline.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Tone Selection ─────────────────────────────────────── */}
      <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-600" />
            Default Brand Personality & Tone
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select how your business sounds when replying to customers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: "friendly",
              name: "Friendly & Warm",
              badge: "Recommended",
              desc: "Polite, welcoming, and personable owner tone.",
              preview: "Thank you so much for the 5-star review! We are delighted you had a great visit with our team.",
            },
            {
              id: "professional",
              name: "Professional & Clinical",
              badge: "Formal",
              desc: "Respectful and formal, ideal for clinics, hospitals, and B2B companies.",
              preview: "Thank you for sharing your feedback. We remain committed to delivering the highest standard of care.",
            },
            {
              id: "hinglish",
              name: "Conversational Hinglish",
              badge: "Local Touch",
              desc: "Warm Indian shop-owner style when replying to Hinglish reviews.",
              preview: "Thank you so much! Aapka feedback hamari team ke liye bahut मायने rakhta hai.",
            },
            {
              id: "brief",
              name: "Brief & Direct",
              badge: "1–2 Sentences",
              desc: "Quick, crisp 25-word thank-you response.",
              preview: "Thank you for your wonderful rating! We look forward to serving you again soon.",
            },
          ].map((t) => (
            <div
              key={t.id}
              onClick={() => setTone(t.id as any)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                tone === t.id
                  ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">{t.name}</span>
                {tone === t.id && <CheckCircle2 size={16} className="text-emerald-600" />}
              </div>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 mb-2 border-slate-200">
                {t.badge}
              </Badge>
              <p className="text-[11px] text-slate-500 leading-snug">{t.desc}</p>
              <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[10px] text-slate-600 italic border border-slate-100">
                &quot;{t.preview}&quot;
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Security Defense: CDATA ────────────────────────────── */}
      <Card className="p-4 sm:p-5 border-slate-200 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-xs text-slate-900">CDATA Prompt Injection Defense</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              All incoming review text is strictly isolated inside XML CDATA blocks so malicious text can never override your AI instructions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCdataDefense(!cdataDefense)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            cdataDefense ? "bg-emerald-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
              cdataDefense ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </Card>
    </div>
  );
}
