"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Check,
  Bell,
  QrCode,
  KeyRound,
  Send,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Unplug,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BusinessSettingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("clinic");
  const [city, setCity] = useState("");
  const [phoneSupport, setPhoneSupport] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  // OpenWA QR & Pairing Code State
  const [openwaStatus, setOpenwaStatus] = useState<string>("disconnected");
  const [openwaSession, setOpenwaSession] = useState<any>(null);
  const [openwaTab, setOpenwaTab] = useState<"qr" | "code">("qr");
  const [openwaLoading, setOpenwaLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [directWaUrl, setDirectWaUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
            setBusinessName(data.business.businessName || "");
            setCategory(data.business.category || "clinic");
            setCity(data.business.city || "");
            setPhoneSupport(data.business.phoneSupport || "");
            setWhatsappNumber(data.business.notifyWhatsappNumber || data.business.phoneSupport || "");
            setWhatsappAlerts(Boolean(data.business.notifyWhatsapp));
            setDailyDigest(Boolean(data.business.dailyDigestEnabled));
            setOpenwaStatus(data.business.openwaStatus || "disconnected");
            setOpenwaSession(data.business.openwaSession || null);
          }
        }
      } catch (e) {
        console.error("Failed to load business settings:", e);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/whatsapp/test-alert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          businessName: businessName.trim(),
          category,
          city: city.trim(),
          phoneSupport: phoneSupport.trim(),
          notifyWhatsapp: whatsappAlerts,
          notifyWhatsappNumber: whatsappNumber.trim(),
          dailyDigestEnabled: dailyDigest,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setNotice({ type: "success", text: data.message || "Business profile and WhatsApp settings saved to database!" });
        setTimeout(() => setSaved(false), 2500);
      } else {
        setNotice({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error while saving settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenWaAction = async (action: "start_qr" | "start_pairing_code" | "confirm_session" | "disconnect_openwa") => {
    setOpenwaLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/whatsapp/test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          action,
          phoneNumber: whatsappNumber || phoneSupport,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpenwaStatus(data.openwaStatus || "disconnected");
        setOpenwaSession(data.openwaSession || null);
        setNotice({ type: "success", text: data.message });
      } else {
        setNotice({ type: "error", text: data.error || "Could not complete OpenWA action." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error while connecting to OpenWA service." });
    } finally {
      setOpenwaLoading(false);
    }
  };

  const handleSendWhatsAppReport = async (mode: "send_test_report" | "send_daily_digest") => {
    setSendingReport(true);
    setNotice(null);
    try {
      const res = await fetch("/api/whatsapp/test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          action: mode,
          phoneNumber: whatsappNumber || phoneSupport,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDirectWaUrl(data.whatsappDirectUrl || null);
        setNotice({
          type: "success",
          text: data.message || "WhatsApp report dispatched! Click 'Open in WhatsApp' below to view immediately.",
        });
      } else {
        setNotice({ type: "error", text: data.error || "Failed to send WhatsApp report." });
      }
    } catch {
      setNotice({ type: "error", text: "Failed to connect to WhatsApp reporting service." });
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Business & OpenWA WhatsApp Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your business profile and link your WhatsApp via OpenWA QR Code or 8-Digit Pairing Code for instant review reports.
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
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="underline ml-4 shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── Business Information Card ─────────────────────────── */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-emerald-600" />
              Business Profile
            </h3>
            <Badge variant="outline" className="text-[10px] text-slate-600 font-mono">
              ID: {businessId || "loading"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bizName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Name
              </label>
              <Input
                id="bizName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-10 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="bizCategory" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="bizCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="clinic">Clinic / Doctor / Healthcare</option>
                <option value="salon">Salon / Spa / Wellness</option>
                <option value="gym">Gym / Fitness Center</option>
                <option value="restaurant">Restaurant / Cafe / Food</option>
                <option value="retail">Retail / Showroom / Store</option>
                <option value="b2b">B2B / IndiaMART Wholesale</option>
              </select>
            </div>

            <div>
              <label htmlFor="bizCity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                City / Location
              </label>
              <Input
                id="bizCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 text-xs"
                placeholder="e.g. Surat, Mumbai, Bengaluru"
              />
            </div>

            <div>
              <label htmlFor="phoneSupport" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Support Phone (For Negative Review Resolution)
              </label>
              <Input
                id="phoneSupport"
                value={phoneSupport}
                onChange={(e) => setPhoneSupport(e.target.value)}
                className="h-10 text-xs"
                placeholder="+91 98765 43210"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Automatically included in AI apology replies so unhappy customers can contact you directly.
              </p>
            </div>
          </div>
        </Card>

        {/* ─── OpenWA (QR & 8-Digit Pairing Code) WhatsApp Linking Card ─── */}
        <Card className="p-5 sm:p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <QrCode size={16} className="text-emerald-600" />
                  OpenWA Direct WhatsApp Connection (QR & Pairing Code)
                </h3>
                {openwaStatus === "connected" ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                    <CheckCircle2 size={11} /> Connected
                  </Badge>
                ) : openwaStatus === "qr_ready" ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]">
                    Awaiting Scan / Pairing
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    Not Linked
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No Meta Official API required. Link your WhatsApp number via QR scan or 8-digit pairing code to receive all daily reports and negative review alerts directly on your WhatsApp.
              </p>
            </div>

            {openwaStatus === "connected" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleOpenWaAction("disconnect_openwa")}
                disabled={openwaLoading}
                className="text-xs text-red-600 hover:bg-red-50 h-8 gap-1.5"
              >
                <Unplug size={13} /> Disconnect OpenWA
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Shop Owner WhatsApp Number (Receives All Reports & Alerts) *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Enter 10-digit WhatsApp Number (e.g. 9876543210)"
                    className="h-9 text-xs bg-white flex-1"
                  />
                </div>
              </div>

              {/* Method Tabs: QR Code vs 8-Digit Pairing Code */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenwaTab("qr");
                    void handleOpenWaAction("start_qr");
                  }}
                  disabled={openwaLoading}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    openwaTab === "qr"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <QrCode size={14} /> Generate OpenWA QR Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenwaTab("code");
                    void handleOpenWaAction("start_pairing_code");
                  }}
                  disabled={openwaLoading}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    openwaTab === "code"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <KeyRound size={14} /> Get 8-Digit Pairing Code
                </button>
              </div>

              {/* Dispatch Report Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendWhatsAppReport("send_daily_digest")}
                  disabled={sendingReport}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 gap-1.5 font-semibold"
                >
                  <Send size={13} />
                  {sendingReport ? "Sending Report..." : "Send Business Report to My WhatsApp Now"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendWhatsAppReport("send_test_report")}
                  disabled={sendingReport}
                  className="text-xs h-9 gap-1.5"
                >
                  <RefreshCw size={13} /> Send Test Alert
                </Button>
              </div>

              {directWaUrl && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-medium">
                    Report ready for your WhatsApp number!
                  </span>
                  <a
                    href={directWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 underline"
                  >
                    Open in WhatsApp <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Right: QR / Pairing Code Display Box */}
            <div className="md:col-span-5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                {openwaStatus === "connected" ? (
                  <div className="py-6 space-y-2">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                    <p className="text-xs font-bold text-slate-900">
                      OpenWA Session Active
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Linked to +{openwaSession?.linkedPhone || whatsappNumber}
                    </p>
                  </div>
                ) : openwaSession?.mode === "pairing_code" && openwaSession?.pairingCode ? (
                  <div className="py-3 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Your 8-Digit WhatsApp Pairing Code
                    </p>
                    <div className="py-3 px-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xl font-extrabold tracking-widest">
                      {openwaSession.pairingCode}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Open WhatsApp → Linked Devices → Link with phone number instead → Enter this code.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenWaAction("confirm_session")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                    >
                      I Entered the Code — Confirm Link
                    </Button>
                  </div>
                ) : openwaSession?.qrImageUrl ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Scan with WhatsApp Linked Devices
                    </p>
                    <img
                      src={openwaSession.qrImageUrl}
                      alt="OpenWA QR Code"
                      className="w-40 h-40 mx-auto rounded-lg border border-slate-200 p-1.5"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenWaAction("confirm_session")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                    >
                      I Scanned the QR — Confirm Link
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 space-y-2 text-slate-400">
                    <QrCode size={34} className="mx-auto text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">
                      Enter your WhatsApp number and click Generate QR Code or 8-Digit Pairing Code.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Notification Preferences ──────────────────────────── */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bell size={16} className="text-emerald-600" />
              Automated WhatsApp Report & Alert Rules
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Instant Negative Review Alert (1★–3★)</p>
                <p className="text-[11px] text-slate-500">
                  Receive an instant WhatsApp alert with an AI-drafted apology whenever a 1-star to 3-star review arrives.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  whatsappAlerts ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    whatsappAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t pt-3 border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">Daily Morning Summary Report (9:00 AM)</p>
                <p className="text-[11px] text-slate-500">
                  Receive a daily summary of new reviews, average star rating, and AI replies on your WhatsApp number.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDailyDigest(!dailyDigest)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  dailyDigest ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    dailyDigest ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
