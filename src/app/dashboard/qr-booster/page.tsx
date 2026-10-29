"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Printer,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Star,
  Sparkles,
  ExternalLink,
  Save,
  Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function QrBoosterPage() {
  const [businessName, setBusinessName] = useState("My Business");
  const [businessCity, setBusinessCity] = useState("");
  const [businessId, setBusinessId] = useState("demo-business");
  const [copied, setCopied] = useState(false);

  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [facebookPageUrl, setFacebookPageUrl] = useState("");
  const [justdialUrl, setJustdialUrl] = useState("");
  const [indiamartUrl, setIndiamartUrl] = useState("");

  const [savingLinks, setSavingLinks] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        const savedBizId = typeof window !== "undefined" ? localStorage.getItem("rm_active_business_id") : null;
        const url = savedBizId ? `/api/connect/status?businessId=${encodeURIComponent(savedBizId)}` : "/api/connect/status";
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.businessName) setBusinessName(data.businessName);
          if (data.city) setBusinessCity(data.city);
          if (data.businessId) setBusinessId(data.businessId);
          if (data.googlePlaceId) setGooglePlaceId(data.googlePlaceId);
          if (data.googleReviewUrl) setGoogleReviewUrl(data.googleReviewUrl);
          if (data.facebookPageUrl) setFacebookPageUrl(data.facebookPageUrl);
          if (data.justdialUrl) setJustdialUrl(data.justdialUrl);
          if (data.indiamartUrl) setIndiamartUrl(data.indiamartUrl);
        }
      } catch (e) {
        console.error("Failed to load business QR info:", e);
      }
    }
    void loadInfo();
  }, []);

  const [origin, setOrigin] = useState("https://reviewmitra.opensoz.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const qrLandingUrl = `${origin}/r/${businessId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrLandingUrl
  )}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrLandingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSavePlatformLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLinks(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/connect/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          googlePlaceId: googlePlaceId.trim(),
          googleReviewUrl: googleReviewUrl.trim(),
          facebookPageUrl: facebookPageUrl.trim(),
          justdialUrl: justdialUrl.trim(),
          indiamartUrl: indiamartUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.business?.googleReviewUrl) {
          setGoogleReviewUrl(data.business.googleReviewUrl);
        }
        setSaveMessage("Direct review links saved! Your QR code will now push 4–5★ customers directly to your real business profiles.");
      } else {
        setSaveMessage(data.error || "Failed to save direct review links.");
      }
    } catch {
      setSaveMessage("Network error while saving review links.");
    } finally {
      setSavingLinks(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Smart QR Review Booster — {businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Print and place on your counter. Pushes 4–5★ customers directly to your real Google Maps, Facebook, or Justdial review box while privately shielding 1–3★ complaints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5 py-1 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            Direct Push + Negative Shield Active
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Link & Direct Destination URL Configuration */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 border-slate-200 space-y-5">
            <h2 className="font-bold text-sm text-slate-900">
              1. Your Unique In-Store QR Funnel Link
            </h2>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={qrLandingUrl}
                className="text-xs h-9 bg-slate-50 font-mono text-slate-700"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="text-xs h-9 font-medium gap-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="text-xs h-9 px-3 text-emerald-700 border-emerald-200 bg-emerald-50"
              >
                <a href={qrLandingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} className="mr-1" /> Test Live Page
                </a>
              </Button>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-emerald-900 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-600" />
                How Your Real QR Review Booster Works:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>
                  <strong>4–5 Star Rating:</strong> AI drafts a personalized review mentioning <strong>{businessName}</strong>, copies it to the customer&apos;s clipboard, and opens your exact Google Maps / Facebook / Justdial review box.
                </li>
                <li>
                  <strong>1–3 Star Rating:</strong> Saved privately in your Unified Inbox under <strong>In-Store QR (`qr_direct`)</strong> and triggers an instant WhatsApp alert to your phone.
                </li>
              </ul>
            </div>

            <div className="pt-1 flex flex-wrap gap-3">
              <Button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 font-semibold gap-2 shadow-xs"
              >
                <Printer size={15} /> Print Counter Standee
              </Button>
              <Button
                asChild
                variant="outline"
                className="text-xs h-10 font-medium gap-2"
              >
                <a
                  href={qrImageUrl}
                  download={`ReviewMitra_QR_${businessName.replace(/\s+/g, "_")}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={15} /> Download QR PNG
                </a>
              </Button>
            </div>
          </Card>

          {/* Direct Platform Review Links Configuration */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Link2 size={16} className="text-emerald-600" />
                  2. Direct Platform Review Links (4–5★ Destination)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the exact review URLs where happy customers are redirected after tapping 4 or 5 stars.
                </p>
              </div>
            </div>

            {saveMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSavePlatformLinks} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Place ID (Optional)
                  </label>
                  <Input
                    value={googlePlaceId}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Google Write-a-Review URL
                  </label>
                  <Input
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facebook Page Review URL
                  </label>
                  <Input
                    value={facebookPageUrl}
                    onChange={(e) => setFacebookPageUrl(e.target.value)}
                    placeholder="https://www.facebook.com/YourPage/reviews"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Justdial Listing URL
                  </label>
                  <Input
                    value={justdialUrl}
                    onChange={(e) => setJustdialUrl(e.target.value)}
                    placeholder="https://www.justdial.com/..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IndiaMART Catalog URL (Optional)
                </label>
                <Input
                  value={indiamartUrl}
                  onChange={(e) => setIndiamartUrl(e.target.value)}
                  placeholder="https://www.indiamart.com/your-company/"
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={savingLinks}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-semibold gap-2"
              >
                <Save size={14} />
                {savingLinks ? "Saving Direct Links..." : "Save Direct Review Links"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Printable Table Standee Card */}
        <div className="lg:col-span-5">
          <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-2xl shadow-sm text-center space-y-4 max-w-sm mx-auto print:border-none print:shadow-none">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Star size={20} fill="white" strokeWidth={0} />
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-extrabold">
                Rate Your Experience
              </p>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mt-0.5">
                {businessName}
              </h3>
              {businessCity && (
                <p className="text-[11px] font-medium text-slate-500">{businessCity}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">
                Scan with your phone camera to share quick feedback
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={qrImageUrl}
                alt={`Review QR Code for ${businessName}`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="flex justify-center items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} fill="currentColor" />
              ))}
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-semibold text-slate-600">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Google Maps
              </span>
              {facebookPageUrl && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Facebook
                </span>
              )}
              {justdialUrl && (
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Justdial
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-snug px-4">
              Tap 5 Stars & Post a Review in 10 Seconds with AI Assistance!
            </p>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              Powered by ReviewMitra · help.opensoz@gmail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
