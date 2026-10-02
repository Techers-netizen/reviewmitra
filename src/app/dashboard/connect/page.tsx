"use client";

import { useState } from "react";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  Phone,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ConnectPlatformsPage() {
  const [googleConnected, setGoogleConnected] = useState(true);
  const [facebookConnected, setFacebookConnected] = useState(true);
  const [justdialUrl, setJustdialUrl] = useState("");
  const [justdialConnected, setJustdialConnected] = useState(false);
  const [justdialLoading, setJustdialLoading] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("9876543210");
  const [whatsappSaved, setWhatsappSaved] = useState(true);

  const handleSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      await fetch("/api/connect/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName: platform }),
      });
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleJustdialConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justdialUrl) return;
    setJustdialLoading(true);
    try {
      const res = await fetch("/api/connect/justdial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: justdialUrl }),
      });
      if (res.ok) {
        setJustdialConnected(true);
      }
    } catch (e) {
      console.error("Justdial connect error:", e);
    } finally {
      setJustdialLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Platform Connections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apne review platforms connect karein taaki naye reviews auto-sync ho sakein.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5 py-1 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            AES-256 Token Encryption Active
          </Badge>
        </div>
      </div>

      {/* ─── Platform Connection Cards ──────────────────────────── */}
      <div className="grid gap-5">
        {/* 1. Google Business Profile */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-blue-600 text-xl">G</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-slate-900">Google Business Profile</h3>
                  {googleConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Google Maps & Search reviews instant sync. Real-time webhooks + 1-click official API auto-reply.
                </p>
                {googleConnected && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Location: <strong>Smile Dental Care, Andheri West</strong></span>
                    <span>·</span>
                    <span className="text-slate-400">Last synced: 5 min ago</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {googleConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync("google")}
                    disabled={syncingPlatform === "google"}
                    className="text-xs h-9 gap-1.5 font-medium"
                  >
                    <RefreshCw size={13} className={syncingPlatform === "google" ? "animate-spin" : ""} />
                    {syncingPlatform === "google" ? "Syncing..." : "Re-sync"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setGoogleConnected(false)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setGoogleConnected(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold gap-2 shadow-xs"
                >
                  <Globe size={14} /> Connect Google Profile
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* 2. Facebook Page */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-indigo-600 text-xl">f</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-slate-900">Facebook Page Reviews</h3>
                  {facebookConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Facebook Page recommendations auto-sync. AI drafts replies with 1-click clipboard paste to Meta Business Suite.
                </p>
                {facebookConnected && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Page: <strong>Smile Dental Care Official</strong></span>
                    <span>·</span>
                    <span className="text-slate-400">Last synced: 15 min ago</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {facebookConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync("facebook")}
                    disabled={syncingPlatform === "facebook"}
                    className="text-xs h-9 gap-1.5 font-medium"
                  >
                    <RefreshCw size={13} className={syncingPlatform === "facebook" ? "animate-spin" : ""} />
                    {syncingPlatform === "facebook" ? "Syncing..." : "Re-sync"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFacebookConnected(false)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setFacebookConnected(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold gap-2 shadow-xs"
                >
                  <Globe size={14} /> Connect Facebook Page
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* 3. Justdial Listing */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-orange-600 text-lg">JD</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-slate-900">Justdial Listing</h3>
                  {justdialConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Active (Hourly Scrape)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Setup Needed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Justdial me official public API nahi hota — apna listing URL daalein aur ReviewMitra automated scraper reviews fetch karega.
                </p>

                {!justdialConnected ? (
                  <form onSubmit={handleJustdialConnect} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-lg">
                    <Input
                      type="url"
                      placeholder="https://www.justdial.com/Mumbai/Smile-Dental-Care..."
                      value={justdialUrl}
                      onChange={(e) => setJustdialUrl(e.target.value)}
                      className="text-xs h-9 flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={justdialLoading}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 font-semibold shrink-0"
                    >
                      {justdialLoading ? "Validating..." : "Connect URL"}
                    </Button>
                  </form>
                ) : (
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <span className="truncate max-w-md font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {justdialUrl || "https://www.justdial.com/Mumbai/Smile-Dental-Care/..."}
                    </span>
                    <button
                      onClick={() => setJustdialConnected(false)}
                      className="text-xs text-red-600 hover:underline shrink-0"
                    >
                      Change URL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 4. WhatsApp Business Instant Alerts */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Phone size={22} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-slate-900">WhatsApp Instant Alerts</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Negative review (1-2★) aate hi aapke WhatsApp number pe instant alert aayega, draft reply ke saath.
                </p>

                <div className="mt-3 flex items-center gap-2 max-w-sm">
                  <span className="text-xs text-slate-500 font-medium">+91</span>
                  <Input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => {
                      setWhatsappPhone(e.target.value);
                      setWhatsappSaved(false);
                    }}
                    maxLength={10}
                    className="h-9 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => setWhatsappSaved(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shrink-0 font-semibold"
                  >
                    {whatsappSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Security & Isolation Info ───────────────────────────── */}
      <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Lock size={16} className="text-slate-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-slate-800">Bank-Grade Token Security</p>
          <p className="mt-0.5 leading-relaxed">
            Google aur Facebook OAuth tokens hamare database me AES-256-GCM encryption ke saath store hote hain. Har token ke paas unique Initialization Vector (IV) aur Authentication Tag hota hai. ReviewMitra kabhi aapka direct password ya platform credentials save nahi karta.
          </p>
        </div>
      </div>
    </div>
  );
}
