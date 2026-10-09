"use client";

import { useState, use } from "react";
import { Star, CheckCircle2, MessageSquare, Send, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerReviewFunnelPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
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

  const tags = [
    "Super Fast Service",
    "Clean & Sanitized",
    "Friendly & Caring Staff",
    "Great Value for Money",
    "Highly Recommended",
  ];

  const handleSelectStar = (stars: number) => {
    setRating(stars);
    if (stars >= 4) {
      setGeneratedReview(
        "Wonderful experience! The staff was incredibly welcoming and professional. Everything was seamless and quick. Highly recommend to everyone in the area!"
      );
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag === "Super Fast Service") {
      setGeneratedReview("Outstanding service! Extremely fast turnaround and prompt attention. Very impressed with the efficiency!");
    } else if (tag === "Clean & Sanitized") {
      setGeneratedReview("Impressed by the spotless hygiene and clean environment. Professional team and top-notch safety standards.");
    } else if (tag === "Friendly & Caring Staff") {
      setGeneratedReview("The team here is so warm, attentive, and helpful. They listened carefully and took great care of us!");
    } else if (tag === "Great Value for Money") {
      setGeneratedReview("Top quality service at very reasonable pricing. Completely satisfied and worth every rupee!");
    } else {
      setGeneratedReview("One of the best experiences in town. Five stars for quality, courtesy, and prompt support!");
    }
  };

  const handleCopyToGoogle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    // Deep link directly to Google Search / Maps review prompt
    // In production, each business configures their exact g.page review shortlink
    window.open(`https://www.google.com/search?q=${encodeURIComponent("write a review")}`, "_blank");
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
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-600 text-white shadow-md font-bold">
            <Star size={24} fill="white" strokeWidth={0} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">How was your experience today?</h1>
          <p className="text-xs text-slate-500">Your genuine rating helps us improve our service daily.</p>
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
                    size={36}
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

          <p className="text-xs font-medium text-slate-600">
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

        {/* FLOW A: Positive Rating (4-5 Stars) -> Direct to Google */}
        {rating && rating >= 4 && (
          <Card className="p-6 border-emerald-200 bg-emerald-50/40 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <Sparkles size={16} className="text-emerald-600" />
              <span>1-Tap AI Positive Review Suggestion</span>
            </div>

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

            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-slate-700 leading-relaxed italic">
              "{generatedReview}"
            </div>

            <Button
              onClick={handleCopyToGoogle}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-11 gap-2 shadow-sm"
            >
              {copied ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
              {copied ? "Copied! Opening Google Reviews..." : "Copy Review & Post on Google Maps"}
            </Button>
            <p className="text-[10px] text-center text-slate-500">
              Review is automatically copied to your clipboard. Just paste and tap Post!
            </p>
          </Card>
        )}

        {/* FLOW B: Unhappy Rating (1-3 Stars) -> Private Feedback Shield */}
        {rating && rating <= 3 && !submittedPrivate && (
          <Card className="p-6 border-amber-200 bg-amber-50/40 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <AlertCircle size={16} className="text-amber-600" />
              <span>We value your feedback. Let the manager know:</span>
            </div>
            <p className="text-xs text-slate-600">
              Please share what went wrong so management can address it directly.
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
                placeholder="Phone Number for manager callback (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs h-9 bg-white"
              />
              <Textarea
                placeholder="How could we have made your visit better?..."
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
                {submitting ? "Sending..." : "Submit Private Feedback to Management"}
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
              Your feedback has been privately forwarded to the owner. We appreciate your honesty and look forward to serving you better next time.
            </p>
          </Card>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Powered by <span className="font-semibold text-slate-600">ReviewMitra</span> · An OpenSoz Product
          </p>
        </div>
      </div>
    </div>
  );
}
