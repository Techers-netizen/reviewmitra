"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Info,
  Lock,
  ExternalLink,
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
  const [businessName, setBusinessName] = useState("");
  const [google, setGoogle] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [facebook, setFacebook] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [justdial, setJustdial] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  const [indiamart, setIndiamart] = useState<PlatformStatus>({ connected: false, account: null, lastSyncAt: null });
  
  const [googleMapsInput, setGoogleMapsInput] = useState("");
  const [googleMapsLoading, setGoogleMapsLoading] = useState(false);
  const [justdialUrl, setJustdialUrl] = useState("");
  const [justdialLoading, setJustdialLoading] = useState(false);
  const [imApiKey, setImApiKey] = useState("");
  const [imMobile, setImMobile] = useState("");
  const [imLoading, setImLoading] = useState(false);

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load real connection status from DB
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/connect/status");
      if (res.ok) {
        const data = await res.json();
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
    fetchStatus();

    // Check query params for OAuth return messages
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      if (success === "google_connected") {
        setNotification({ type: "success", message: "Google Business Profile connected successfully! Initial reviews synced." });
      } else if (success === "facebook_connected") {
        setNotification({ type: "success", message: "Facebook Page connected successfully! Recommendations synced." });
      } else if (error) {
        setNotification({ type: "error", message: `Connection notice: ${error.replace(/_/g, " ")}` });
      }
    }
  }, []);

  // Initiate real Google OAuth
  const handleConnectGoogle = () => {
    window.location.href = "/api/connect/google";
  };

  // Initiate real Facebook OAuth
  const handleConnectFacebook = () => {
    window.location.href = "/api/connect/facebook";
  };

  // Disconnect a platform
  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform);
    try {
      const res = await fetch("/api/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName: platform }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: `${platform.toUpperCase()} disconnected and encrypted tokens removed.` });
        await fetchStatus();
      }
    } catch (e) {
      console.error("Disconnect error:", e);
    } finally {
      setDisconnecting(null);
    }
  };

  // Trigger real review sync from live APIs
  const handleSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      const res = await fetch("/api/connect/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName: platform }),
      });
      if (res.ok) {
        const data = await res.json();
        const pSummary = data.summary?.[platform];
        const count = pSummary?.newIngested ?? pSummary?.totalFetched ?? 0;
        const note = pSummary?.note ? ` (${pSummary.note})` : "";
        setNotification({
          type: "success",
          message: `Real API sync completed for ${platform.toUpperCase()}! ${count} new reviews ingested${note}.`,
        });
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: `Live sync for ${platform.toUpperCase()} completed with a notice. Ensure your Google/Meta app has required review permissions.`,
        });
      }
    } catch (e) {
      console.error("Sync error:", e);
      setNotification({ type: "error", message: "Failed to connect to review sync service." });
    } finally {
      setSyncingPlatform(null);
    }
  };

  // Instant Google Maps / Places Sync (Zero GBP quota needed)
  const handleGooglePlacesSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleMapsInput.trim()) return;
    setGoogleMapsLoading(true);
    try {
      const res = await fetch("/api/connect/google/places-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleMapsUrl: googleMapsInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: data.message || "Google reviews successfully synced!",
        });
        setGoogleMapsInput("");
        await fetchStatus();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to sync Google reviews.",
        });
      }
    } catch (err: any) {
      console.error("Google Places sync error:", err);
      setNotification({ type: "error", message: "Failed to connect to Google Places sync." });
    } finally {
      setGoogleMapsLoading(false);
    }
  };

  // Connect Justdial by URL
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
        setNotification({ type: "success", message: "Justdial business URL connected! Reviews queued for scrape." });
        setJustdialUrl("");
        await fetchStatus();
      }
    } catch (e) {
      console.error("Justdial connect error:", e);
    } finally {
      setJustdialLoading(false);
    }
  };

  // Connect IndiaMART seller CRM
  const handleIndiaMartConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imApiKey || !imMobile) return;
    setImLoading(true);
    try {
      const res = await fetch("/api/connect/indiamart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: imApiKey, mobileNumber: imMobile }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: "IndiaMART seller CRM connected! Buyer ratings linked." });
        setImApiKey("");
        setImMobile("");
        await fetchStatus();
      } else {
        const err = await res.json();
        setNotification({ type: "error", message: err.error || "Failed to connect IndiaMART." });
      }
    } catch (e) {
      console.error("IndiaMART connect error:", e);
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
            Platform Integrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect live review channels to enable real-time aggregation and automated AI responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5 py-1 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            AES-256 Token Encryption Active
          </Badge>
        </div>
      </div>

      {/* ─── Notification Alert ─────────────────────────────────── */}
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
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

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
                  Sync Google Maps & Search reviews via official Google Business API. Automated replies post directly.
                </p>
                {google.connected && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Account: <strong>{google.account || businessName}</strong></span>
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
                  <Globe size={14} /> Connect Google Profile
                </Button>
              )}
            </div>
          </div>

          {/* Quick Instant Google Maps Sync (No GBP quota required) */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                Instant Google Maps Sync (Direct link se instant reviews fetch karein)
              </p>
              <span className="text-[11px] text-slate-400">Zero waiting for Google API quota approval</span>
            </div>
            <form onSubmit={handleGooglePlacesSync} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Paste Google Maps URL ya Shop Name (e.g. https://maps.app.goo.gl/... ya 'Smile Dental Mumbai')"
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
                {googleMapsLoading ? "Syncing Reviews..." : "Sync Google Reviews"}
              </Button>
            </form>
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
                  <h3 className="font-bold text-base text-slate-900">Facebook Page Recommendations</h3>
                  {facebook.connected ? (
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
                  Facebook Page customer recommendations sync via Meta Graph API. AI drafts responses with 1-click clipboard paste.
                </p>
                {facebook.connected && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Page: <strong>{facebook.account || businessName}</strong></span>
                    <span>·</span>
                    <span className="text-slate-400">
                      Last sync: {facebook.lastSyncAt ? new Date(facebook.lastSyncAt).toLocaleTimeString() : "Recent"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {facebook.connected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync("facebook")}
                    disabled={syncingPlatform === "facebook"}
                    className="text-xs h-9 gap-1.5 font-medium"
                  >
                    <RefreshCw size={13} className={syncingPlatform === "facebook" ? "animate-spin" : ""} />
                    {syncingPlatform === "facebook" ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisconnect("facebook")}
                    disabled={disconnecting === "facebook"}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                  >
                    {disconnecting === "facebook" ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectFacebook}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold gap-2 shadow-xs"
                >
                  <Globe size={14} /> Connect Facebook Page
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* 3. Justdial */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-orange-600 text-lg">Jd</span>
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-slate-900">Justdial Listing</h3>
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
                    Justdial does not offer a public API. Enter your public listing URL to schedule automated daily review scraping.
                  </p>
                </div>

                {!justdial.connected ? (
                  <form onSubmit={handleJustdialConnect} className="flex flex-col sm:flex-row gap-2 max-w-lg">
                    <Input
                      type="url"
                      placeholder="https://www.justdial.com/Mumbai/Dr-Mehta-Dental-Care/..."
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
                      {justdialLoading ? "Connecting..." : "Connect URL"}
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700 truncate max-w-md">
                      URL: {justdial.account || "Configured Listing"}
                    </span>
                    <span>·</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect("justdial")}
                      className="text-xs text-red-600 hover:text-red-700 h-7 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 4. IndiaMART */}
        <Card className="p-5 sm:p-6 border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-blue-700 text-base">IM</span>
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-slate-900">IndiaMART Seller B2B Integration</h3>
                    {indiamart.connected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Connected (CRM Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect your IndiaMART CRM API Key and Seller Mobile to sync B2B buyer inquiries, verified ratings, and auto-dispatch instant replies.
                  </p>
                </div>

                {!indiamart.connected ? (
                  <form onSubmit={handleIndiaMartConnect} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <Input
                      type="password"
                      placeholder="IndiaMART CRM API Key"
                      value={imApiKey}
                      onChange={(e) => setImApiKey(e.target.value)}
                      className="text-xs h-9 flex-1"
                      required
                    />
                    <Input
                      type="tel"
                      placeholder="Seller Mobile (+91)"
                      value={imMobile}
                      onChange={(e) => setImMobile(e.target.value)}
                      className="text-xs h-9 w-36"
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={imLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold shrink-0"
                    >
                      {imLoading ? "Linking..." : "Connect IndiaMART"}
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700 truncate max-w-md">
                      Account: {indiamart.account || "IndiaMART Seller Account"}
                    </span>
                    <span>·</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect("indiamart")}
                      className="text-xs text-red-600 hover:text-red-700 h-7 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Security & OAuth Instructions Box ──────────────────── */}
      <Card className="p-5 border-slate-200 bg-slate-50/70 space-y-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Info size={16} className="text-blue-600" />
          <span>OAuth Production Verification & Redirect URI Info</span>
        </div>
        <p className="leading-relaxed">
          Google Cloud Console and Meta require your authorized redirect URIs to match your live deployment URL:
        </p>
        <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] space-y-1 text-slate-700">
          <p>• Google OAuth Redirect URI: <span className="text-emerald-700 font-bold">https://reviewmitra-et3bg1sz4-opensoz.vercel.app/api/connect/google/callback</span></p>
          <p>• Custom Domain URI: <span className="text-emerald-700 font-bold">https://reviewmitra.opensoz.com/api/connect/google/callback</span></p>
          <p>• Meta Facebook Redirect URI: <span className="text-indigo-700 font-bold">https://reviewmitra-et3bg1sz4-opensoz.vercel.app/api/connect/facebook/callback</span></p>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 pt-1">
          <Lock size={12} className="text-emerald-600" />
          <span>All tokens are encrypted using AES-256-GCM before storage in Neon PostgreSQL.</span>
        </div>
      </Card>
    </div>
  );
}
