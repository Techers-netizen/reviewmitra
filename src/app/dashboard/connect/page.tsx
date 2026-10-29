"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Info,
  Lock,
  Building2,
  Phone,
  Mail,
  Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PlatformStatus {
  connected: boolean;
  account: string | null;
  lastSyncAt: string | null;
}

export default function ConnectPlatformsPage() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [google, setGoogle] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [facebook, setFacebook] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [justdial, setJustdial] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [indiamart, setIndiamart] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });

  const [googleMapsInput, setGoogleMapsInput] = useState("");
  const [googleMapsLoading, setGoogleMapsLoading] = useState(false);

  const [facebookPageUrl, setFacebookPageUrl] = useState("");
  const [facebookUrlLoading, setFacebookUrlLoading] = useState(false);

  const [justdialUrl, setJustdialUrl] = useState("");
  const [justdialLoading, setJustdialLoading] = useState(false);

  // Direct IndiaMART fields (Mobile / Email / Catalog URL — No API Key required)
  const [imMobile, setImMobile] = useState("");
  const [imEmail, setImEmail] = useState("");
  const [imCatalogUrl, setImCatalogUrl] = useState("");
  const [imLoading, setImLoading] = useState(false);

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const savedBizId = typeof window !== "undefined" ? localStorage.getItem("rm_active_business_id") : null;
      const url = savedBizId ? `/api/connect/status?businessId=${encodeURIComponent(savedBizId)}` : "/api/connect/status";
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBusinessId(data.businessId || null);
        setBusinessName(data.businessName || "");
        setGoogle(data.google || { connected: false, account: null, lastSyncAt: null });
        setFacebook(data.facebook || { connected: false, account: null, lastSyncAt: null });
        setJustdial(data.justdial || { connected: false, account: null, lastSyncAt: null });
        setIndiamart(data.indiamart || { connected: false, account: null, lastSyncAt: null });
      }
    } catch (e) {
      console.error("Failed to load platform status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      if (success === "google_connected") {
        setNotification({
          type: "success",
          message: "Google Business Profile connected successfully! All registered business locations have been linked.",
        });
      } else if (success === "facebook_connected") {
        setNotification({
          type: "success",
          message: "Facebook Page connected successfully! Recommendations synced.",
        });
      } else if (error) {
        setNotification({
          type: "error",
          message: `Connection notice: ${error.replace(/_/g, " ")}. You can connect instantly below using your public listing URL.`,
        });
      }
    }
  }, []);

  const handleConnectGoogle = () => {
    const stateParam = businessId ? `?state=${encodeURIComponent(businessId)}` : "";
    window.location.href = `/api/connect/google${stateParam}`;
  };

  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform);
    try {
      const res = await fetch("/api/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, platformName: platform }),
      });
      if (res.ok) {
        setNotification({
          type: "success",
          message: `${platform.toUpperCase()} has been disconnected from this business location.`,
        });
        await fetchStatus();
      }
    } catch (e) {
      console.error("Disconnect error:", e);
      setNotification({ type: "error", message: "Failed to disconnect platform." });
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      const res = await fetch("/api/connect/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, platformName: platform }),
      });
      if (res.ok) {
        const data = await res.json();
        const pSummary = data.summary?.[platform];
        const count = pSummary?.newIngested ?? pSummary?.totalFetched ?? 0;
        const note = pSummary?.note ? ` (${pSummary.note})` : "";
        setNotification({
          type: "success",
          message: `Live sync completed for ${platform.toUpperCase()}! ${count} real reviews synced${note}.`,
        });
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: `Sync for ${platform.toUpperCase()} could not complete. Please verify your listing URL.`,
        });
      }
    } catch (e) {
      console.error("Sync error:", e);
      setNotification({ type: "error", message: "Failed to connect to review sync service." });
    } finally {
      setSyncingPlatform(null);
    }
  };

  // 1. Direct Google Maps / Places Sync (Zero GBP API Quota required)
  const handleGooglePlacesSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleMapsInput.trim()) return;
    setGoogleMapsLoading(true);
    try {
      const res = await fetch("/api/connect/google/places-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, googleMapsUrl: googleMapsInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: data.message || "Google Maps business connected and reviews synced successfully!",
        });
        setGoogleMapsInput("");
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to sync Google Maps reviews.",
        });
      }
    } catch (err: any) {
      console.error("Google Places sync error:", err);
      setNotification({ type: "error", message: "Failed to connect to Google Maps sync engine." });
    } finally {
      setGoogleMapsLoading(false);
    }
  };

  // 2. Direct Facebook Page Public URL Connect (No Meta App Review required)
  const handleFacebookUrlConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facebookPageUrl.trim()) return;
    setFacebookUrlLoading(true);
    try {
      const res = await fetch("/api/connect/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          platformName: "facebook",
          facebookPageUrl: facebookPageUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: data.message || "Facebook Page connected via public URL!",
        });
        setFacebookPageUrl("");
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to connect Facebook Page URL.",
        });
      }
    } catch {
      setNotification({ type: "error", message: "Network error while connecting Facebook Page." });
    } finally {
      setFacebookUrlLoading(false);
    }
  };

  // 3. Connect Justdial by Public Listing URL
  const handleJustdialConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justdialUrl.trim()) return;
    setJustdialLoading(true);
    try {
      const res = await fetch("/api/connect/justdial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, url: justdialUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: data.message || "Justdial listing URL connected successfully!",
        });
        setJustdialUrl("");
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Please enter a valid Justdial listing URL.",
        });
      }
    } catch {
      setNotification({ type: "error", message: "Failed to connect Justdial listing." });
    } finally {
      setJustdialLoading(false);
    }
  };

  // 4. Direct IndiaMART Connection (Mobile Number / Email / Catalog URL — No API Key required)
  const handleIndiaMartConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imMobile.trim() && !imEmail.trim() && !imCatalogUrl.trim()) {
      setNotification({
        type: "error",
        message: "Please enter your IndiaMART Mobile Number, Email Address, or Company Catalog URL.",
      });
      return;
    }
    setImLoading(true);
    try {
      const res = await fetch("/api/connect/indiamart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          mobileNumber: imMobile.trim(),
          email: imEmail.trim(),
          catalogUrl: imCatalogUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: data.message || "IndiaMART seller account connected successfully!",
        });
        setImMobile("");
        setImEmail("");
        setImCatalogUrl("");
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to connect IndiaMART seller account.",
        });
      }
    } catch {
      setNotification({ type: "error", message: "Failed to connect IndiaMART account." });
    } finally {
      setImLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Platform Integrations {businessName ? `— ${businessName}` : ""}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect Google Maps, Facebook Page, Justdial, and IndiaMART without needing complex developer API approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5 py-1 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            No-API Direct Sync Ready
          </Badge>
        </div>
      </div>

      {/* ─── Notification Toast Banner ──────────────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline hover:opacity-80 ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Platform Connection Cards ──────────────────────────── */}
      <div className="grid gap-5">
        {/* 1. Google Business Profile & Direct Maps Sync */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-blue-600 text-xl">G</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900">Google Business Profile & Maps</h3>
                  {google.connected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Connected (Live)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supports multiple businesses under one email. Connect via Google OAuth or paste your Google Maps link below to bypass 0-quota API restrictions.
                </p>
                {google.connected && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">
                      Linked Location: <strong>{google.account || businessName}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      Last sync: {google.lastSyncAt ? new Date(google.lastSyncAt).toLocaleTimeString() : "Recent"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {google.connected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync("google")}
                    disabled={syncingPlatform === "google"}
                    className="text-xs h-9 gap-1.5 font-medium"
                  >
                    <RefreshCw size={13} className={syncingPlatform === "google" ? "animate-spin" : ""} />
                    {syncingPlatform === "google" ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisconnect("google")}
                    disabled={disconnecting === "google"}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                  >
                    {disconnecting === "google" ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold gap-2 shadow-xs"
                >
                  <Globe size={14} /> Connect Google Account
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                Instant Google Maps Link / Place ID Sync (No API Quota Needed)
              </p>
              <span className="text-[11px] text-slate-400">Works immediately for all business locations</span>
            </div>
            <form onSubmit={handleGooglePlacesSync} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Paste Google Maps URL, Place ID, or Business Name + City (e.g. https://maps.app.goo.gl/...)"
                value={googleMapsInput}
                onChange={(e) => setGoogleMapsInput(e.target.value)}
                className="h-9 text-xs flex-1 bg-slate-50/50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={googleMapsLoading || !googleMapsInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold shrink-0 gap-1.5"
              >
                <RefreshCw size={12} className={googleMapsLoading ? "animate-spin" : ""} />
                {googleMapsLoading ? "Syncing Reviews..." : "Connect & Sync Google Maps"}
              </Button>
            </form>
          </div>
        </Card>

        {/* 2. Facebook Page (Direct Public Page URL — No Meta OAuth Headache) */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-indigo-600 text-xl">f</span>
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">Facebook Page Recommendations</h3>
                    {facebook.connected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Connected (Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Paste your public Facebook Page URL below to sync customer recommendations and enable 1-tap AI replies without needing Facebook Login.
                  </p>
                </div>

                {!facebook.connected ? (
                  <form onSubmit={handleFacebookUrlConnect} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <Input
                      type="url"
                      placeholder="https://www.facebook.com/YourBusinessPage/reviews"
                      value={facebookPageUrl}
                      onChange={(e) => setFacebookPageUrl(e.target.value)}
                      className="text-xs h-9 flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={facebookUrlLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold shrink-0 gap-1.5"
                    >
                      <Link2 size={13} />
                      {facebookUrlLoading ? "Connecting..." : "Connect Facebook URL"}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700 truncate max-w-md">
                      Page: <strong>{facebook.account || businessName}</strong>
                    </span>
                    <span>·</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync("facebook")}
                      disabled={syncingPlatform === "facebook"}
                      className="text-xs h-8 gap-1.5"
                    >
                      <RefreshCw size={12} className={syncingPlatform === "facebook" ? "animate-spin" : ""} />
                      {syncingPlatform === "facebook" ? "Syncing..." : "Sync Now"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect("facebook")}
                      disabled={disconnecting === "facebook"}
                      className="text-xs text-red-600 hover:text-red-700 h-8 px-2"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Justdial Listing */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-orange-600 text-lg">Jd</span>
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">Justdial Business Listing</h3>
                    {justdial.connected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Active Scraper
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your public Justdial listing URL to extract real customer reviews and ratings automatically via Schema.org JSON-LD.
                  </p>
                </div>

                {!justdial.connected ? (
                  <form onSubmit={handleJustdialConnect} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <Input
                      type="url"
                      placeholder="https://www.justdial.com/Surat/Your-Business-Name/..."
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
                      {justdialLoading ? "Connecting..." : "Connect Justdial URL"}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700 truncate max-w-md">
                      Listing: <strong>{justdial.account || "Configured Justdial URL"}</strong>
                    </span>
                    <span>·</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync("justdial")}
                      disabled={syncingPlatform === "justdial"}
                      className="text-xs h-8 gap-1.5"
                    >
                      <RefreshCw size={12} className={syncingPlatform === "justdial" ? "animate-spin" : ""} />
                      {syncingPlatform === "justdial" ? "Scraping..." : "Sync Reviews"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect("justdial")}
                      className="text-xs text-red-600 hover:text-red-700 h-8 px-2"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 4. IndiaMART Direct Connect (Mobile Number / Email / Catalog URL — NO API Key Required) */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-blue-700 text-base">IM</span>
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">IndiaMART Direct Seller Connection</h3>
                    <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700">
                      No API Key Required
                    </Badge>
                    {indiamart.connected ? (
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
                    Connect your IndiaMART seller profile directly using your registered Mobile Number, Email Address, or public IndiaMART Company URL.
                  </p>
                </div>

                {!indiamart.connected ? (
                  <form onSubmit={handleIndiaMartConnect} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="Registered Mobile (+91)"
                        value={imMobile}
                        onChange={(e) => setImMobile(e.target.value)}
                        className="text-xs h-9 pl-8"
                      />
                    </div>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="Registered Email Address"
                        value={imEmail}
                        onChange={(e) => setImEmail(e.target.value)}
                        className="text-xs h-9 pl-8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="Catalog URL (optional)"
                        value={imCatalogUrl}
                        onChange={(e) => setImCatalogUrl(e.target.value)}
                        className="text-xs h-9 flex-1"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={imLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold shrink-0"
                      >
                        {imLoading ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">
                      Seller Account: <strong>{indiamart.account || "Connected IndiaMART Profile"}</strong>
                    </span>
                    <span>·</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect("indiamart")}
                      className="text-xs text-red-600 hover:text-red-700 h-7 px-2"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Multi-Business & Security Note ─────────────────────── */}
      <Card className="p-5 border-slate-200 bg-slate-50/70 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Building2 size={16} className="text-emerald-600" />
          <span>Managing Multiple Business Locations on One Account</span>
        </div>
        <p className="leading-relaxed">
          Use the <strong>Business Switcher dropdown</strong> in the top header to switch between your businesses or add a second location. Each business maintains its own platform links, QR code standee, and AI auto-reply memory. For assistance, contact{" "}
          <a href="mailto:help.opensoz@gmail.com" className="text-emerald-700 font-semibold underline">
            help.opensoz@gmail.com
          </a>.
        </p>
      </Card>
    </div>
  );
}
