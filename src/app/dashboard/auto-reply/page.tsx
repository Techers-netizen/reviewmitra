"use client";

import { useState } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Save,
  Languages,
  Sliders,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AutoReplySettingsPage() {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [positiveAuto, setPositiveAuto] = useState(true);
  const [neutralAuto, setNeutralAuto] = useState(false);
  const [postDelay, setPostDelay] = useState("5");
  const [tone, setTone] = useState<"friendly" | "professional" | "hinglish" | "brief">("hinglish");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [cdataDefense, setCdataDefense] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              AI Auto-Reply Configuration
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure karein ki AI bina manual kaam ke reviews ka reply kaise aur kab de.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold h-9 shadow-sm"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Settings Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* ─── Master Toggle Card ─────────────────────────────────── */}
      <Card className="p-5 sm:p-6 border-slate-200 bg-gradient-to-r from-emerald-50/70 via-white to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Master Auto-Reply Switch</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {masterEnabled
                  ? "AI background cron automatically replies according to your configured rules."
                  : "Auto-reply is paused. All incoming reviews will wait for manual approval."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMasterEnabled(!masterEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              masterEnabled ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                masterEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* ─── Sentiment Rules Grid ───────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Sliders size={16} className="text-emerald-600" />
          Sentiment-Based Auto-Reply Rules
        </h3>

        <div className="grid gap-4">
          {/* Rule 1: Positive Reviews (4-5★) */}
          <Card className="p-5 border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Positive Reviews (4★ aur 5★)</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Auto-Pilot Recommended</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Customer ko thank you bolein, unke positive points mention karein, aur agle visit ke liye welcome karein.
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
                <span className="font-medium text-slate-700">Reply Delay:</span>
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
                  (Delay se reply organic aur natural lagta hai, bot jaisa nahi)
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
                  Average experience wale customers. Kya AI automatic reply kare ya pehle draft bana ke aapko notify kare?
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
              Current: <strong>{neutralAuto ? "Auto-post with balanced polite reply" : "Draft saved → Owner approval required"}</strong>
            </div>
          </Card>

          {/* Rule 3: Negative Reviews (1-2★) — Guardrail */}
          <Card className="p-5 border-red-100 bg-red-50/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Negative Reviews (1★ aur 2★)</span>
                  <Badge className="bg-red-100 text-red-800 text-[10px] font-bold">Safety Lock: Draft Only</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Negative review ka reply <strong>kabhi bhi blindly auto-post nahi hota</strong>. AI turant ek empathetic apology draft tayyar karta hai aur aapke WhatsApp pe alert bhejta hai. Aap verify karke 1-tap pe approve karte hain.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                Always Draft
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-red-100/60">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Support Phone Number (Injected into Negative Replies)
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Example: &quot;Humein aapke experience ke liye khed hai. Kripya {supportPhone} pe call karein taaki hum matter resolve kar sakein.&quot;
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Tone Selection ─────────────────────────────────────── */}
      <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Languages size={16} className="text-emerald-600" />
            Default AI Reply Tone
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Yeh tone aapke auto-replies aur standard 1-click generation me use hogi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: "hinglish",
              name: "Hinglish (Recommended)",
              badge: "🇮🇳 Most Natural",
              desc: "Warm Hindi-English mix jo Indian customers ke dil ko touch kare.",
              preview: "Thank you Sharma ji! Aapka trust hamare liye bahut matter karta hai. Agli baar zaroor visit karein!",
            },
            {
              id: "friendly",
              name: "Friendly English",
              badge: "Warm",
              desc: "Polite, upbeat, and hospitable English reply.",
              preview: "Thank you so much for the 5-star review! We're so glad you had a great experience with our team.",
            },
            {
              id: "professional",
              name: "Professional English",
              badge: "Formal",
              desc: "Respectful, clinical, ideal for doctors, dentists & corporate setups.",
              preview: "Thank you for sharing your feedback. We are committed to maintaining the highest standard of care.",
            },
            {
              id: "brief",
              name: "Brief / Short",
              badge: "1-2 Lines",
              desc: "Quick 20-word thank you or acknowledgment.",
              preview: "Thank you for your visit and wonderful rating! Looking forward to serving you again.",
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
                {tone === t.id && (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                )}
              </div>
              <Badge variant="outline" className="text-[9px] py-0 px-1 mb-2 border-slate-200">
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
              Reviewer text ko strictly sanitize aur XML CDATA block me wrap kiya jaata hai taaki koi malicious reviewer system prompt hijack na kar sake.
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
