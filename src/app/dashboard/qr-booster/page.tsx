"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Printer, Copy, CheckCircle2, ShieldCheck, Star, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function QrBoosterPage() {
  const [businessName, setBusinessName] = useState("My Business");
  const [businessId, setBusinessId] = useState("demo-business");
  const [copied, setCopied] = useState(false);
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch("/api/connect/status");
        if (res.ok) {
          const data = await res.json();
          if (data.businessName) setBusinessName(data.businessName);
          if (data.businessId) setBusinessId(data.businessId);
        }
      } catch (e) {
        console.error("Failed to load business info:", e);
      }
    }
    loadInfo();
  }, []);

  const qrLandingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/r/${businessId}`
    : `https://reviewmitra.opensoz.com/r/${businessId}`;

  // Generate QR Code image url using public qr api
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Smart QR Review Booster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Place on your counter or tables. Drives 5★ Google reviews with 1-tap AI suggestions while privately shielding 1-3★ feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5 py-1 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            Negative Shield Active
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Card Preview & Controls */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 border-slate-200 space-y-5">
            <h2 className="font-bold text-sm text-slate-900">Your Unique In-Store QR Link</h2>
            
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
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-xs h-9 px-2 text-slate-600"
              >
                <a href={qrLandingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                </a>
              </Button>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-emerald-900 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-600" />
                How the Smart Review Funnel Works:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><strong>Happy Customers (4-5★):</strong> Instant AI-drafted positive reviews and 1-tap redirect to your Google Maps review page.</li>
                <li><strong>Unhappy Customers (1-3★):</strong> Routed to a private feedback form on your dashboard. Prevents public 1-star Google damage!</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 font-semibold gap-2 shadow-xs"
              >
                <Printer size={15} /> Print Standee Card
              </Button>
              <Button
                asChild
                variant="outline"
                className="text-xs h-10 font-medium gap-2"
              >
                <a href={qrImageUrl} download={`ReviewMitra_QR_${businessId}.png`} target="_blank" rel="noopener noreferrer">
                  <Download size={15} /> Download QR PNG
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Printable Table Standee Card Mockup */}
        <div className="lg:col-span-5">
          <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-2xl shadow-sm text-center space-y-4 max-w-sm mx-auto print:border-none print:shadow-none">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Star size={20} fill="white" strokeWidth={0} />
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-extrabold">Rate Our Service</p>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{businessName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Scan with your smartphone camera</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={qrImageUrl}
                alt="ReviewMitra Customer Review QR Code"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="flex justify-center items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} fill="currentColor" />
              ))}
            </div>

            <p className="text-xs text-slate-600 leading-snug px-4">
              Tap 5 Stars & Leave Quick AI-assisted Feedback on Google!
            </p>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              Powered by ReviewMitra · reviewmitra.opensoz.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
