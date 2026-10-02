"use client";

import {
  BarChart3,
  TrendingUp,
  Star,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ratingBreakdown = [
  { star: 5, count: 10, pct: "62.5%", color: "bg-emerald-500" },
  { star: 4, count: 3, pct: "18.8%", color: "bg-emerald-400" },
  { star: 3, count: 1, pct: "6.2%", color: "bg-amber-400" },
  { star: 2, count: 1, pct: "6.2%", color: "bg-orange-400" },
  { star: 1, count: 1, pct: "6.2%", color: "bg-red-500" },
];

const sentimentBreakdown = [
  { label: "Positive", pct: "81%", count: 13, color: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  { label: "Neutral", pct: "7%", count: 1, color: "bg-amber-400", text: "text-amber-700 bg-amber-50" },
  { label: "Negative", pct: "12%", count: 2, color: "bg-red-500", text: "text-red-700 bg-red-50" },
];

const monthlyTrend = [
  { month: "May", reviews: 8, avg: "4.1" },
  { month: "Jun", reviews: 11, avg: "4.2" },
  { month: "Jul", reviews: 14, avg: "4.2" },
  { month: "Aug", reviews: 12, avg: "4.3" },
  { month: "Sep", reviews: 15, avg: "4.4" },
  { month: "Oct", reviews: 16, avg: "4.3" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Reviews & Reputation Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track rating trends, sentiment breakdown aur AI response efficiency.
          </p>
        </div>

        <Badge variant="outline" className="border-slate-300 text-slate-700 py-1 px-3 text-xs w-fit">
          Last 30 Days
        </Badge>
      </div>

      {/* ─── Top Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border-slate-200">
          <span className="text-xs text-slate-500">Overall Rating</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">4.3</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp size={13} className="mr-0.5" /> +0.2★
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Industry avg: 3.9★</p>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <span className="text-xs text-slate-500">Avg Reply Time</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">8 min</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <Zap size={12} className="mr-0.5" /> 98% faster
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Industry avg: 48 hours</p>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <span className="text-xs text-slate-500">AI Reply Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">75%</span>
            <span className="text-xs text-emerald-600 font-semibold">12/16 replied</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">4 pending attention</p>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <span className="text-xs text-slate-500">Customer Sentiment</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">81%</span>
            <span className="text-xs text-slate-500 font-medium">Positive</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">13 positive reviews</p>
        </Card>
      </div>

      {/* ─── Rating Distribution & Sentiment ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Breakdown */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Star Rating Distribution</h3>
            <span className="text-xs text-slate-500">16 total reviews</span>
          </div>

          <div className="space-y-2.5">
            {ratingBreakdown.map((r) => (
              <div key={r.star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-semibold text-slate-700 flex items-center gap-0.5 shrink-0">
                  {r.star} <Star size={11} className="text-amber-500 fill-amber-500" />
                </span>

                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full transition-all duration-500`}
                    style={{ width: r.pct }}
                  />
                </div>

                <span className="w-12 text-right text-slate-500 text-[11px] shrink-0">
                  {r.count} ({r.pct})
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Sentiment Breakdown</h3>
            <span className="text-xs text-slate-500">Auto-classified by AI</span>
          </div>

          <div className="space-y-4">
            {sentimentBreakdown.map((s) => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${s.text}`}>
                    {s.label}
                  </span>
                  <span className="font-bold text-slate-800">
                    {s.count} reviews ({s.pct})
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-500`}
                    style={{ width: s.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Monthly Trends ─────────────────────────────────────── */}
      <Card className="p-5 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Monthly Volume & Rating Trend</h3>
            <p className="text-[11px] text-slate-500">Last 6 months review inflow</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            +100% review reply growth
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 pt-4">
          {monthlyTrend.map((m) => (
            <div key={m.month} className="flex flex-col items-center">
              <div className="text-xs font-bold text-slate-800">{m.reviews}</div>
              <div className="w-full bg-slate-100 rounded-t-md h-24 mt-2 relative flex items-end justify-center">
                <div
                  className="w-4/5 bg-emerald-600 rounded-t-md transition-all duration-500"
                  style={{ height: `${(m.reviews / 20) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-600">{m.month}</div>
              <div className="text-[10px] text-amber-600 font-bold">{m.avg}★</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
