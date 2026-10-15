"use client";

import { useState, useEffect, use } from "react";
import { Star, CheckCircle2, MessageSquare, Send, Sparkles, AlertCircle, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function CustomerReviewFunnelPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);

  const [businessInfo, setBusinessInfo] = useState<{
    businessName: string;
    category: string;
    googleReviewUrl: string;
  }>({
    businessName: "National Medical",
    category: "clinic",
    googleReviewUrl: "https://www.google.com/search?q=National+medical",
  });

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Positive flow (4-5 stars)
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [generatedReview, setGeneratedReview] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Negative flow (1-3 stars)
  const [reviewerName, setReviewerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submittedPrivate, setSubmittedPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load actual business info
  useEffect(() => {
    async function loadBiz() {
      try {
        const res = await fetch(`/api/qr/info?businessId=${encodeURIComponent(businessId)}`);
        if (res.ok) {
          const data = await res.json();
          setBusinessInfo({
            businessName: data.businessName || "Our Business",
            category: data.category || "retail",
            googleReviewUrl: data.googleReviewUrl || "https://www.google.com",
          });
        }
      } catch (e) {
        console.error("Failed to load business details for QR:", e);
      }
    }
    loadBiz();
  }, [businessId]);

  const isRestaurant = businessInfo.category === "restaurant" ||
    businessInfo.businessName.toLowerCase().includes("lucky") ||
    businessInfo.businessName.toLowerCase().includes("restaurant");

  const tags = isRestaurant
    ? [
        "Delicious Taste & Food",
        "Super Fast Service",
        "Polite & Attentive Staff",
        "Hygienic & Clean Seating",
        "Great Value for Money",
      ]
    : [
        "Genuine & Authentic Medicines",
        "Quick Counter Service",
        "Polite & Helpful Pharmacist",
        "Fair & Reasonable Pricing",
        "Highly Recommended",
      ];

  const handleSelectStar = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      if (isRestaurant) {
        setGeneratedReview(
          `Bohot hi lajawab khana aur shandar service! ${businessInfo.businessName} par taste aur hygiene dono top-class hai. Highly recommended to everyone! 5 stars!`
        );
      } else {
        setGeneratedReview(
          `Bohot badhiya anubhav raha! ${businessInfo.businessName} par saari medicines time par aur sahi rate me mil gayi. Staff ka vyavhar bohot cooperative hai. 5 stars!`
        );
      }
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag.includes("Taste") || tag.includes("Medicines")) {
      setGeneratedReview(`Top quality and 100% genuine experience at ${businessInfo.businessName}. Completely satisfied!`);
    } else if (tag.includes("Fast Service")) {
      setGeneratedReview(`Outstanding service at ${businessInfo.businessName}! Extremely fast turnaround and very courteous staff.`);
    } else if (tag.includes("Staff") || tag.includes("Pharmacist")) {
      setGeneratedReview(`The staff at ${businessInfo.businessName} is warm, polite, and very helpful. Best experience in the area!`);
    } else if (tag.includes("Pricing") || tag.includes("Value")) {
      setGeneratedReview(`Great pricing and top quality at ${businessInfo.businessName}. Worth every rupee!`);
    } else {
      setGeneratedReview(`Five stars for ${businessInfo.businessName}! Highly recommended for outstanding quality and service.`);
    }
  };

  const handleCopyToGoogle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    // Deep link directly to the business's actual Google Maps search/review page
    const targetUrl = businessInfo.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(businessInfo.businessName + " review")}`;
    window.open(targetUrl, "_blank");
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
          reviewerName,
          customerPhone,
          feedbackText,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Actual Business Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-600 text-white shadow-md font-bold">
            <Star size={28} fill="white" strokeWidth={0} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {isRestaurant ? "Restaurant & Cafe" : "Healthcare & Pharmacy"}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {businessInfo.businessName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Rate your experience with us today</p>
          </div>
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
                  aria-label={`${star} star`}
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

          <p className="text-xs font-semibold text-slate-700">
            {rating === null
              ? "Tap the stars above to rate"
              : rating === 5
              ? "Excellent! (5 Stars)"
              : rating === 4
              ? "Great! (4 Stars)"
              : rating === 3
              ? "Average (3 Stars)"
              : "Needs Improvement (1-2 Stars)"}
          </p>
        </Card>

        {/* FLOW A: Positive Rating (4-5 Stars) -> Direct to Real Google Maps */}
        {rating && rating >= 4 && (
          <Card className="p-6 border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-600" />
                1-Tap Google Review for {businessInfo.businessName}
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px]">Google Maps</Badge>
            </div>

            <p className="text-xs text-slate-600">
              Tap a phrase below to personalize your review, then click the green button to post directly on our Google profile:
            </p>

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

            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 leading-relaxed italic shadow-inner">
              &quot;{generatedReview}&quot;
            </div>

            <Button
              onClick={handleCopyToGoogle}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-12 gap-2 shadow-md shadow-emerald-600/20"
            >
              {copied ? <CheckCircle2 size={16} /> : <ExternalLink size={16} />}
              {copied ? "Opening Google Maps..." : `Post 5★ Review on Google Maps`}
            </Button>

            <p className="text-[10px] text-center text-slate-500">
              Opens our real Google Maps listing directly. Review text is already copied to your clipboard!
            </p>
          </Card>
        )}

        {/* FLOW B: Unhappy Rating (1-3 Stars) -> Private Feedback Shield */}
        {rating && rating <= 3 && !submittedPrivate && (
          <Card className="p-6 border-amber-200 bg-amber-50/40 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <ShieldCheck size={18} className="text-amber-600" />
              <span>Private Owner Feedback for {businessInfo.businessName}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We are sorry your experience wasn&apos;t 5-stars. Please tell the owner directly what went wrong so we can resolve it immediately.
            </p>

            <form onSubmit={handleSubmitPrivateFeedback} className="space-y-3">
              <Input
                placeholder="Your Name (optional)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="text-xs h-9 bg-white"
              />
              <Input
                type="tel"
                placeholder="Mobile number for callback (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs h-9 bg-white"
              />
              <Textarea
                placeholder="Please share what happened so management can fix it..."
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
                {submitting ? "Sending..." : "Submit Private Feedback to Owner"}
              </Button>
            </form>
          </Card>
        )}

        {/* Confirmation when private feedback is submitted */}
        {submittedPrivate && (
          <Card className="p-6 border-emerald-200 bg-emerald-50 text-center space-y-3 animate-in fade-in">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Thank you for your feedback</h3>
            <p className="text-xs text-slate-600">
              Your feedback has been privately sent to {businessInfo.businessName} management. We will look into it right away.
            </p>
          </Card>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Powered by <span className="font-semibold text-slate-600">ReviewMitra</span> · Built by OpenSoz
          </p>
        </div>
      </div>
    </div>
  );
}
