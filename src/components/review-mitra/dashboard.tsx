"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, Search, SlidersHorizontal, RefreshCw, Filter, Inbox, TrendingUp,
  Star as StarIcon, AlertTriangle, CheckCircle2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { PlatformIcon, PlatformPill } from "./platform-icon";
import { ReviewCard } from "./review-card";
import { AiReplyDrawer } from "./ai-reply-drawer";
import type { ReviewItem, ReviewsResponse, Tone } from "./types";

type PlatformFilter = "all" | "google" | "facebook" | "justdial";
type SortFilter = "newest" | "lowest" | "unreplied";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

export function Dashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [search, setSearch] = useState("");

  // AI drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewItem | null>(null);

  async function loadReviews(silent = false) {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load reviews");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.reviews];
    if (platform !== "all") list = list.filter((r) => r.platform === platform);
    if (rating !== "all") list = list.filter((r) => r.rating === rating);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reviewerName.toLowerCase().includes(q) ||
          (r.reviewText || "").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "lowest":
        list.sort((a, b) => a.rating - b.rating);
        break;
      case "unreplied":
        list.sort((a, b) => Number(a.isReplied) - Number(b.isReplied));
        break;
      default:
        list.sort((a, b) => new Date(b.reviewTimestamp).getTime() - new Date(a.reviewTimestamp).getTime());
    }
    return list;
  }, [data, platform, rating, sort, search]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, unreplied: 0, avg: 0, negative: 0 };
    const total = data.reviews.length;
    const unreplied = data.reviews.filter((r) => !r.isReplied).length;
    const negative = data.reviews.filter((r) => r.rating <= 2).length;
    const avg = total ? data.reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, unreplied, avg, negative };
  }, [data]);

  function openDrawer(review: ReviewItem) {
    setActiveReview(review);
    setDrawerOpen(true);
  }

  async function handleGenerate(reviewId: string, tone: Tone) {
    const res = await fetch("/api/ai/generate-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, tone }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to generate reply");
    return json as { reply: string; toneUsed: Tone };
  }

  async function handlePost(reviewId: string, replyText: string, tone: Tone) {
    const res = await fetch("/api/reviews/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, replyText, tone, generatedByAi: true }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to post reply");
    // refresh local state
    void loadReviews(true);
    toast({
      title: json.postStatus === "copied_to_clipboard" ? "Copied to clipboard" : "Reply posted live",
      description: json.note,
    });
    return json as { ok: boolean; postStatus: string; note?: string; platform: string };
  }

  async function handleRefresh() {
    await loadReviews(true);
    toast({ title: "Synced", description: "Pulled latest reviews from all platforms." });
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight">
            {data?.business?.name || "Loading…"}
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 capitalize hidden sm:inline-flex">
              {data?.business?.category || "business"}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">Unified inbox · Google + Facebook + Justdial</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-9 gap-1.5">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
          <Button size="sm" className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5 relative">
            <Bell size={14} />
            <span className="hidden sm:inline">Alerts</span>
            {stats.unreplied > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {stats.unreplied}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard label="Total reviews" value={loading ? "—" : String(stats.total)} icon={<Inbox size={15} />} tone="slate" />
        <StatCard
          label="Pending replies"
          value={loading ? "—" : String(stats.unreplied)}
          icon={<AlertTriangle size={15} />}
          tone={stats.unreplied > 0 ? "red" : "slate"}
        />
        <StatCard label="Avg rating" value={loading ? "—" : stats.avg.toFixed(1)} icon={<StarIcon size={15} />} tone="emerald" />
        <StatCard label="Negative (1–2★)" value={loading ? "—" : String(stats.negative)} icon={<TrendingUp size={15} />} tone="amber" />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviewer or review text…"
            className="pl-9 h-10 bg-card"
          />
        </div>

        {/* Platform tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scroll-hide -mx-1 px-1">
          {(["all", "google", "facebook", "justdial"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                platform === p
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              {p === "all" ? "All platforms" : p}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5">
            {([5, 4, 3, 2, 1, "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={cn(
                  "grid h-7 min-w-7 place-items-center rounded-full border px-1.5 text-xs font-medium transition-colors",
                  rating === r
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                {r === "all" ? "All" : `${r}★`}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-muted-foreground" />
            {(["newest", "lowest", "unreplied"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  sort === s
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                {s === "unreplied" ? "Unreplied first" : s === "lowest" ? "Lowest rating" : "Newest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3 pb-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 sm:p-5 gap-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))
        ) : error ? (
          <Card className="p-6 text-center border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadReviews()} className="mt-3">
              Try again
            </Button>
          </Card>
        ) : (!data || data.reviews.length === 0) ? (
          <Card className="p-10 text-center space-y-3 border-dashed border-slate-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 grid place-items-center text-slate-400">
              <Inbox size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Unified Inbox Khali Hai</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Aapke is account par abhi koi review sync nahi hua hai. Google Business Profile ya Facebook Page connect karke live reviews fetch karein.
              </p>
            </div>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
              <Link href="/dashboard/connect">Connect Platform</Link>
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <p className="mt-2 text-sm font-medium">No reviews match your filters</p>
            <p className="text-xs text-muted-foreground">Try clearing the platform or rating filter.</p>
          </Card>
        ) : (
          filtered.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onGenerate={openDrawer}
              isGenerating={drawerOpen && activeReview?.id === r.id}
            />
          ))
        )}
      </div>

      <AiReplyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        review={activeReview}
        businessName={data?.business?.name || "your business"}
        onGenerate={handleGenerate}
        onPost={handlePost}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "slate" | "emerald" | "red" | "amber";
}) {
  const toneClasses = {
    slate: "border-slate-200 text-slate-600 bg-slate-50",
    emerald: "border-emerald-200 text-emerald-700 bg-emerald-50",
    red: "border-red-200 text-red-700 bg-red-50",
    amber: "border-amber-200 text-amber-700 bg-amber-50",
  };
  return (
    <Card className={cn("p-3 sm:p-3.5 flex items-center gap-2.5", toneClasses[tone])}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70">{icon}</span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-current/80 truncate">{label}</p>
      </div>
    </Card>
  );
}
