"use client";

import { useEffect, useState } from "react";
import { Sparkles, Send, Copy, Check, RefreshCw, ExternalLink, Info } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { PlatformIcon } from "./platform-icon";
import type { ReviewItem, Tone } from "./types";
import { TONES } from "@/lib/review-engine";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ReviewItem | null;
  businessName: string;
  onGenerate: (reviewId: string, tone: Tone) => Promise<{ reply: string; toneUsed: Tone }>;
  onPost: (reviewId: string, replyText: string, tone: Tone) => Promise<{ ok: boolean; postStatus: string; note?: string; platform: string }>;
}

export function AiReplyDrawer({
  open,
  onOpenChange,
  review,
  businessName,
  onGenerate,
  onPost,
}: DrawerProps) {
  const [tone, setTone] = useState<Tone>("friendly");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postResult, setPostResult] = useState<string | null>(null);

  // Auto-generate when a new review opens
  useEffect(() => {
    if (open && review && !draft) {
      void runGenerate(review.id, tone, true);
    }
  }, [open, review?.id, draft, tone]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setDraft("");
      setError(null);
      setPostResult(null);
      setCopied(false);
    }
  }, [open]);

  async function runGenerate(reviewId: string, t: Tone, initial = false) {
    setError(null);
    setPostResult(null);
    setLoading(true);
    try {
      const res = await onGenerate(reviewId, t);
      if (!res?.reply) throw new Error("AI returned an empty reply.");
      setDraft(res.reply);
      setTone(res.toneUsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate reply";
      setError(msg);
      if (!initial) {
        // surface only on manual retries
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!review || !draft.trim()) return;
    setPosting(true);
    setError(null);
    setPostResult(null);
    try {
      const res = await onPost(review.id, draft.trim(), tone);
      if (!res.ok) throw new Error("Failed to post reply");
      setPostResult(res.note || "Reply posted.");
      // close drawer shortly after success
      setTimeout(() => onOpenChange(false), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard not available. Please select & copy manually.");
    }
  }

  const isJustdial = review?.platform === "justdial";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] flex flex-col bg-white p-0 gap-0">
        {/* Header — fixed top */}
        <DrawerHeader className="flex-none px-4 pt-3 pb-2 text-left">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} className="text-emerald-600" />
            AI Reply
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Generate and post an AI-written reply to a customer review.
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable middle section */}
        {review && (
          <div className="flex-1 overflow-y-auto scroll-thin px-4 pb-3">
            {/* Review snippet */}
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="flex items-start gap-2.5">
                <PlatformIcon platform={review.platform} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{review.reviewerName}</p>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                    {review.reviewText || "(no text)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tone selector */}
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Reply tone</p>
              <div className="grid grid-cols-4 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-all",
                      tone === t.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-lg leading-none">{t.emoji}</span>
                    <span className="mt-1 text-[11px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable reply */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Editable draft</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => runGenerate(review.id, tone)}
                  disabled={loading}
                  className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:text-emerald-800"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  Regenerate
                </Button>
              </div>
              <Textarea
                value={loading ? "" : draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={loading}
                placeholder={loading ? "Writing a thoughtful reply…" : "Type or edit the reply"}
                className="min-h-[120px] max-h-[200px] resize-none text-sm leading-relaxed"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{loading ? "AI is composing…" : `${draft.trim().split(/\s+/).filter(Boolean).length} words`}</span>
                <span className="text-emerald-700">by {businessName}</span>
              </div>
            </div>

            {error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {postResult && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-start gap-1.5">
                <Check size={14} className="mt-0.5 shrink-0" />
                <span>{postResult}</span>
              </div>
            )}

            {isJustdial && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>
                  Justdial does not expose a public reply API. We&apos;ll copy your reply and open the Justdial portal — paste it manually.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sticky footer — always visible */}
        <div className="flex-none border-t bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            {isJustdial && (
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={!draft || loading || posting}
                className="flex-1 gap-1.5"
              >
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy reply"}
              </Button>
            )}
            <Button
              onClick={handlePost}
              disabled={!draft.trim() || loading || posting}
              className="flex-[2] gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              {posting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Posting…
                </>
              ) : isJustdial ? (
                <>
                  <ExternalLink size={15} />
                  Copy & open Justdial
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Reply Live
                </>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg =
    sentiment === "positive"
      ? { label: "Positive", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : sentiment === "negative"
        ? { label: "Negative", className: "bg-red-50 text-red-700 border-red-200" }
        : { label: "Neutral", className: "bg-amber-50 text-amber-700 border-amber-200" };
  return <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium", cfg.className)}>{cfg.label}</Badge>;
}
