"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  Zap,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const reviews = data?.reviews || [];
  const connections = data?.connections || [];
  const totalReviews = reviews.length;
  const unreplied = reviews.filter((r: any) => !r.isReplied).length;
  const negativeReviews = reviews.filter((r: any) => r.rating <= 2);
  const repliedCount = reviews.filter((r: any) => r.isReplied).length;
  const avgRating = totalReviews
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";
  const replyRate = totalReviews ? Math.round((repliedCount / totalReviews) * 100) : 0;

  const googleConn = connections.find((c: any) => c.platform === "google");
  const fbConn = connections.find((c: any) => c.platform === "facebook");
  const indiamartConn = connections.find((c: any) => c.platform === "indiamart");

  const hasAnyConnection = connections.some((c: any) => c.status === "connected");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Top Welcome & Quick Actions ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Business Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time review pulse across Google, Facebook, IndiaMART aur Justdial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm text-xs font-semibold">
            <Link href="/dashboard/reviews">
              <MessageSquare size={14} /> Open Unified Inbox
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-xs font-semibold">
            <Link href="/dashboard/auto-reply">
              <Bot size={14} className="text-emerald-600 mr-1.5" /> Auto-Reply
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Urgent Alert OR Welcome Setup Banner ───────────────── */}
      {negativeReviews.length > 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {negativeReviews.length} Negative Review ko aapke attention ki zaroorat hai
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {negativeReviews[0].reviewerName} ne {negativeReviews[0].rating}★ diya: &quot;{negativeReviews[0].reviewText?.slice(0, 80)}...&quot;
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0 font-semibold">
            <Link href="/dashboard/reviews">Draft Review & Reply</Link>
          </Button>
        </div>
      ) : !hasAnyConnection ? (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Welcome to ReviewMitra! Connect your business profiles
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Google Business Profile ya Facebook Page connect karein taaki aapke real reviews dashboard me automatically sync ho sakein.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0 font-semibold gap-1.5">
            <Link href="/dashboard/connect">
              <PlusCircle size={14} /> Connect Platform
            </Link>
          </Button>
        </div>
      ) : null}

      {/* ─── Metric Cards Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Reviews</span>
            <span className="p-2 rounded-xl text-blue-600 bg-blue-50">
              <MessageSquare size={16} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : totalReviews}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {totalReviews === 0 ? "No reviews yet" : "Synced from profiles"}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Rating</span>
            <span className="p-2 rounded-xl text-amber-600 bg-amber-50">
              <Star size={16} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : avgRating}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {totalReviews === 0 ? "Awaiting reviews" : "Live star average"}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reply Rate</span>
            <span className="p-2 rounded-xl text-emerald-600 bg-emerald-50">
              <Zap size={16} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : `${replyRate}%`}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {repliedCount} of {totalReviews} replied
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Needs Reply</span>
            <span className="p-2 rounded-xl text-red-600 bg-red-50">
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : unreplied}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {negativeReviews.length} negative
            </p>
          </div>
        </Card>
      </div>

      {/* ─── Platform Sync Status & AI Feed ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Connected Platforms */}
        <Card className="p-5 border-slate-200 lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Connected Platforms</h3>
            <Link href="/dashboard/connect" className="text-xs text-emerald-600 font-semibold hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {/* Google */}
            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Google Business Profile</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {googleConn?.status === "connected" ? "Connected & Active" : "Not connected"}
                </p>
              </div>
              {googleConn?.status === "connected" ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-semibold">
                  <Link href="/dashboard/connect">Connect</Link>
                </Button>
              )}
            </div>

            {/* Facebook */}
            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Facebook Page</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {fbConn?.status === "connected" ? "Connected & Active" : "Not connected"}
                </p>
              </div>
              {fbConn?.status === "connected" ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-semibold">
                  <Link href="/dashboard/connect">Connect</Link>
                </Button>
              )}
            </div>

            {/* IndiaMART */}
            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">IndiaMART B2B</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {indiamartConn?.status === "connected" ? "Connected & Active" : "Not connected"}
                </p>
              </div>
              {indiamartConn?.status === "connected" ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-semibold">
                  <Link href="/dashboard/connect">Connect</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full text-xs h-9 font-semibold gap-1.5 border-dashed">
              <Link href="/dashboard/connect">
                <ExternalLink size={13} /> Manage All Connectors
              </Link>
            </Button>
          </div>
        </Card>

        {/* Right: Recent Review Activity Feed */}
        <Card className="p-5 border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Live Review & AI Feed</h3>
              <p className="text-[11px] text-slate-500">Real-time status updates of reviews and AI actions</p>
            </div>
            {totalReviews > 0 && (
              <Button asChild variant="ghost" size="sm" className="text-xs text-emerald-700 font-semibold gap-1">
                <Link href="/dashboard/reviews">
                  View all reviews <ChevronRight size={14} />
                </Link>
              </Button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 grid place-items-center text-slate-400">
                <MessageSquare size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Abhi koi review sync nahi hua hai</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Jaise hi aap Google Business ya Facebook connect karenge, aapke live reviews automatically yahan dikhne lagenge aur AI reply draft tayyar karega.
              </p>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5">
                <Link href="/dashboard/connect">
                  <PlusCircle size={13} /> Connect Google / Facebook
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.slice(0, 5).map((r: any) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-xl font-bold text-xs shrink-0 ${
                      r.rating <= 2 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {r.rating}★
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{r.reviewerName}</p>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200">
                          {r.platform}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {r.reviewText || "No text provided"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {r.isReplied ? "Replied" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <Sparkles size={15} className="text-emerald-600" />
              <span>AI Reply Engine is configured to <strong>Friendly Hinglish</strong> tone</span>
            </div>
            <Link href="/dashboard/auto-reply" className="text-xs font-bold text-emerald-700 hover:underline shrink-0">
              Customize
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
