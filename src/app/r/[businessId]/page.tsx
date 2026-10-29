"use client";

import { useState, useEffect, use } from "react";
import {
  Star,
  CheckCircle2,
  Send,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface PlatformLinkInfo {
  enabled: boolean;
  label: string;
  reviewUrl: string | null;
}

export default function CustomerReviewFunnelPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const [businessName, setBusinessName] = useState("Our Business");
  const [businessCity, setBusinessCity] = useState("");
  const [platforms, setPlatforms] = useState<Record<string, PlatformLinkInfo>>({
    google: { enabled: true, label: "Google Maps", reviewUrl: null },
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("google");

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Positive flow (4-5 stars)
  const [customerName, setCustomerName] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [generatedReview, setGeneratedReview] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [pushingPublic, setPushingPublic] = useState<boolean>(false);

  // Negative flow (1-3 stars)
  const [reviewerName, setReviewerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submittedPrivate, setSubmittedPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tags = [
    "Excellent Service",
    "Clean & Hygienic",
    "Friendly & Helpful Staff",
    "Great Value for Money",
    "Highly Recommended",
  ];

  useEffect(() => {
    async function loadBusinessProfile() {
      try {
        const res = await fetch(`/api/qr/feedback?businessId=${encodeURIComponent(businessId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.business) {
            setBusinessName(data.business.businessName || "Our Business");
            setBusinessCity(data.business.city || "");
            if (data.business.platforms) {
              setPlatforms(data.business.platforms);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load QR business details:", err);
      }
    }
    void loadBusinessProfile();
  }, [businessId]);

  const buildSuggestedReview = (tag: string, stars: number) => {
    const locText = businessCity ? ` in ${businessCity}` : "";
    if (tag === "Excellent Service") {
      return `Had an excellent experience at ${businessName}${locText}! Fast turnaround, prompt attention, and top-quality service. Highly recommended!`;
    }
    if (tag === "Clean & Hygienic") {
      return `Very impressed with the spotless hygiene and professional atmosphere at ${businessName}${locText}. Great attention to detail!`;
    }
    if (tag === "Friendly & Helpful Staff") {
      return `The staff at ${businessName}${locText} is extremely warm, polite, and helpful. They took great care of everything from start to finish!`;
    }
    if (tag === "Great Value for Money") {
      return `Great quality and transparent pricing at ${businessName}${locText}. Completely satisfied with the experience!`;
    }
    return `Wonderful ${stars}-star experience at ${businessName}${locText}! Professional team, smooth service, and genuinely helpful support.`;
  };

  const handleSelectStar = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      const defaultTag = selectedTag || "Highly Recommended";
      setSelectedTag(defaultTag);
      setGeneratedReview(buildSuggestedReview(defaultTag, stars));
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setGeneratedReview(buildSuggestedReview(tag, rating || 5));
  };

  // Direct Review Push to exact Business Platform URL
  const handleDirectReviewPush = async () => {
    setPushingPublic(true);
    try {
      if (navigator.clipboard && generatedReview.trim()) {
        await navigator.clipboard.writeText(generatedReview.trim());
        setCopied(true);
      }

      const res = await fetch("/api/qr/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          reviewerName: customerName.trim() || "Verified QR Customer",
          rating: rating || 5,
          feedbackText: generatedReview.trim(),
          targetPlatform: selectedPlatform,
        }),
      });

      const data = await res.json();
      const targetUrl =
        data.redirectUrl ||
        platforms[selectedPlatform]?.reviewUrl ||
        platforms.google?.reviewUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${businessName} ${businessCity}`.trim()
        )}`;

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Direct review push error:", err);
    } finally {
      setPushingPublic(false);
    }
  };

  const handleSubmitPrivateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/qr/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          rating,
          reviewerName: reviewerName.trim() || "In-Store Customer",
          customerPhone: customerPhone.trim(),
          feedbackText: feedbackText.trim(),
          targetPlatform: "qr_direct",
        }),
      });
      if (res.ok) {
        setSubmittedPrivate(true);
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const enabledPlatformKeys = Object.keys(platforms).filter(
    (k) => platforms[k]?.enabled
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Verified Business Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-600 text-white shadow-md font-bold">
            <Building2 size={24} />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {businessName}
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1 px-2 py-0.5">
              <ShieldCheck size={11} className="text-emerald-600" /> Verified
            </Badge>
          </div>
          {businessCity && (
            <p className="text-xs font-medium text-slate-500">{businessCity}</p>
          )}
          <p className="text-xs text-slate-500">
            How was your experience with <strong>{businessName}</strong> today?
          </p>
        </div>

        {/* 5-Star Selection Card */}
        <Card className="p-6 border-slate-200 shadow-sm text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating || 0) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleSelectStar(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={38}
                    className={`${
                      active
                        ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                        : "text-slate-200 fill-slate-100 hover:text-amber-200"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-slate-600">
            {rating === null
              ? "Tap a star above to rate your experience"
              : rating === 5
              ? "Excellent! (5 Stars) — Thank you!"
              : rating === 4
              ? "Great! (4 Stars) — Glad you enjoyed!"
              : rating === 3
              ? "Average (3 Stars) — Tell us how we can improve"
              : "We apologize (1–2 Stars) — Share directly with management"}
          </p>
        </Card>

        {/* FLOW A: Positive Rating (4-5 Stars) -> Direct Platform Review Push */}
        {rating && rating >= 4 && (
          <Card className="p-5 sm:p-6 border-emerald-200 bg-emerald-50/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <Sparkles size={15} className="text-emerald-600" />
                <span>AI Review Assistant for {businessName}</span>
              </div>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                1-Tap Direct Push
              </span>
            </div>

            {/* Platform Selector (Google Maps / Facebook / Justdial / IndiaMART) */}
            {enabledPlatformKeys.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Select Platform to Post Your Review:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {enabledPlatformKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlatform(key)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedPlatform === key
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{platforms[key].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight Tags */}
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTagClick(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedTag === t
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Input
              placeholder="Your Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs h-9 bg-white border-emerald-200"
            />

            {/* Editable Review Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold">Your Review (Editable):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedReview);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Copy size={11} /> {copied ? "Copied!" : "Copy Text"}
                </button>
              </div>
              <Textarea
                value={generatedReview}
                onChange={(e) => setGeneratedReview(e.target.value)}
                rows={3}
                className="bg-white border-emerald-200 text-xs text-slate-800 leading-relaxed"
              />
            </div>

            <Button
              type="button"
              onClick={handleDirectReviewPush}
              disabled={pushingPublic}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-11 gap-2 shadow-sm"
            >
              {copied ? <CheckCircle2 size={16} /> : <ExternalLink size={16} />}
              {pushingPublic
                ? `Opening ${platforms[selectedPlatform]?.label || "Google Maps"}...`
                : `Copy Review & Post on ${platforms[selectedPlatform]?.label || "Google Maps"}`}
            </Button>

            <p className="text-[11px] text-center text-slate-600">
              Your review is copied to your clipboard and opens <strong>{businessName}</strong> directly on{" "}
              <strong>{platforms[selectedPlatform]?.label || "Google Maps"}</strong>.
            </p>
          </Card>
        )}

        {/* FLOW B: Unhappy Rating (1-3 Stars) -> Private Feedback Shield (Saved as qr_direct) */}
        {rating && rating <= 3 && !submittedPrivate && (
          <Card className="p-6 border-amber-200 bg-amber-50/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600" />
              <span>Direct Message to {businessName} Management</span>
            </div>
            <p className="text-xs text-slate-600">
              We truly value your experience. Share what went wrong below so the owner of <strong>{businessName}</strong> can resolve it for you immediately.
            </p>

            <form onSubmit={handleSubmitPrivateFeedback} className="space-y-3">
              <Input
                placeholder="Your Full Name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="text-xs h-9 bg-white"
                required
              />
              <Input
                type="tel"
                placeholder="Your Phone Number for priority callback"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs h-9 bg-white"
              />
              <Textarea
                placeholder="Please tell us how we can make things right for you..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                required
                className="text-xs bg-white"
              />
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-10 gap-2"
              >
                <Send size={14} />
                {submitting ? "Sending to Management..." : "Send Private Feedback to Owner"}
              </Button>
            </form>
          </Card>
        )}

        {/* Confirmation when private feedback is submitted */}
        {submittedPrivate && (
          <Card className="p-6 border-emerald-200 bg-emerald-50 text-center space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Thank You for Your Feedback
            </h3>
            <p className="text-xs text-slate-600">
              Your message has been delivered directly to the management of <strong>{businessName}</strong> and alerted on their WhatsApp.
            </p>
          </Card>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Powered by <span className="font-semibold text-slate-600">ReviewMitra</span> · Support:{" "}
            <a href="mailto:help.opensoz@gmail.com" className="underline">
              help.opensoz@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
