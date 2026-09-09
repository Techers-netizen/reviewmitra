"use client";

import { useState } from "react";
import { Clock, Sparkles, CheckCircle2, MessageSquare, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { PlatformIcon } from "./platform-icon";
import type { ReviewItem } from "./types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ReviewCard({
  review,
  onGenerate,
  isGenerating,
}: {
  review: ReviewItem;
  onGenerate: (review: ReviewItem) => void;
  isGenerating?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const text = review.reviewText || "";
  const isLong = text.length > 180;
  const displayText = expanded || !isLong ? text : text.slice(0, 180) + "…";

  const sentimentBadge =
    review.sentiment === "positive"
      ? { label: "Positive", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : review.sentiment === "negative"
        ? { label: "Negative", className: "bg-red-50 text-red-700 border-red-200" }
        : { label: "Neutral", className: "bg-amber-50 text-amber-700 border-amber-200" };

  return (
    <Card
      className={cn(
        "p-4 sm:p-5 gap-3 transition-all hover:shadow-md",
        review.isReplied ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-slate-200"
      )}
    >
      <div className="flex items-start gap-3">
        <PlatformIcon platform={review.platform} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-sm">{review.reviewerName}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock size={11} />
              {timeAgo(review.reviewTimestamp)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} />
            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium", sentimentBadge.className)}>
              {sentimentBadge.label}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {displayText}
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center"
          >
            {expanded ? "less" : "read more"}
            <ChevronDown size={11} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </p>

      {review.isReplied && review.lastReply && (
        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-1">
            <CheckCircle2 size={12} /> You replied · {review.lastReply.tone || "ai"} tone
          </div>
          <p className="text-xs text-emerald-900/80 line-clamp-2">{review.lastReply.text}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!review.isReplied ? (
          <>
            <Button
              size="sm"
              onClick={() => onGenerate(review)}
              disabled={isGenerating}
              className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium shadow-sm"
            >
              <Sparkles size={13} className={isGenerating ? "animate-pulse" : ""} />
              {isGenerating ? "Generating…" : "AI Reply"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <MessageSquare size={13} />
              Custom
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground ml-auto">
              Mark done
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(review)}
            disabled={isGenerating}
            className="h-8 gap-1.5 text-xs"
          >
            <Sparkles size={13} className={isGenerating ? "animate-pulse" : ""} />
            {isGenerating ? "Regenerating…" : "Edit reply"}
          </Button>
        )}
      </div>
    </Card>
  );
}
