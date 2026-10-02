"use client";

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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Total Reviews", value: "16", change: "+4 this week", up: true, icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  { label: "Average Rating", value: "4.3", change: "+0.2 from last mo", up: true, icon: Star, color: "text-amber-600 bg-amber-50" },
  { label: "Reply Rate", value: "75%", change: "12 of 16 replied", up: true, icon: Zap, color: "text-emerald-600 bg-emerald-50" },
  { label: "Needs Reply", value: "4", change: "1 negative review", up: false, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
];

const platforms = [
  { name: "Google Business Profile", status: "connected", reviews: 10, lastSync: "5 min ago", color: "border-blue-200 bg-blue-50/50" },
  { name: "Facebook Page", status: "connected", reviews: 4, lastSync: "15 min ago", color: "border-indigo-200 bg-indigo-50/50" },
  { name: "Justdial Listing", status: "not_connected", reviews: 0, lastSync: "Not set up", color: "border-orange-200 bg-orange-50/50" },
];

const recentActivity = [
  {
    type: "reply_posted",
    reviewer: "Priya Sharma",
    platform: "Google",
    rating: 5,
    action: "AI Auto-replied in Friendly Hinglish",
    time: "10 min ago",
  },
  {
    type: "new_review",
    reviewer: "Amit Verma",
    platform: "Facebook",
    rating: 2,
    action: "Negative review draft ready for approval",
    urgent: true,
    time: "25 min ago",
  },
  {
    type: "reply_posted",
    reviewer: "Dr. Sandeep Patel",
    platform: "Google",
    rating: 5,
    action: "AI replied in Professional tone",
    time: "1 hour ago",
  },
  {
    type: "new_review",
    reviewer: "Kavita Rao",
    platform: "Google",
    rating: 4,
    action: "Pending reply in Unified Inbox",
    time: "2 hours ago",
  },
];

export default function DashboardOverviewPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Top Welcome & Urgent Alert ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Business Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time review pulse across Google, Facebook aur Justdial.
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

      {/* Urgent Negative Review Attention Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              1 Negative Review ko aapke attention ki zaroorat hai
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Amit Verma ne Facebook pe 2★ diya: &quot;Appointment time pe doctor available nahi the...&quot; AI ne empathetic draft tayyar kar diya hai.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0 font-semibold">
          <Link href="/dashboard/reviews">Draft Review & Reply</Link>
        </Button>
      </div>

      {/* ─── Metric Cards Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 sm:p-5 hover:shadow-md transition-shadow border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{s.label}</span>
                <span className={`p-2 rounded-xl ${s.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
                <p className={`mt-1 text-[11px] font-medium ${s.up ? "text-emerald-700" : "text-amber-700"}`}>
                  {s.change}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Platform Sync Status & AI Summary ─────────────────── */}
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
            {platforms.map((p) => (
              <div key={p.name} className={`p-3 rounded-xl border ${p.color} flex items-center justify-between`}>
                <div>
                  <p className="text-xs font-bold text-slate-800">{p.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {p.status === "connected" ? `${p.reviews} reviews synced · ${p.lastSync}` : "Sync setup pending"}
                  </p>
                </div>
                {p.status === "connected" ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Active
                  </span>
                ) : (
                  <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-semibold">
                    <Link href="/dashboard/connect">Connect</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full text-xs h-9 font-semibold gap-1.5 border-dashed">
              <Link href="/dashboard/connect">
                <ExternalLink size={13} /> Add More Locations / Outlets
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
            <Button asChild variant="ghost" size="sm" className="text-xs text-emerald-700 font-semibold gap-1">
              <Link href="/dashboard/reviews">
                View all reviews <ChevronRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.map((act, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl font-bold text-xs shrink-0 ${
                    act.urgent ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {act.rating}★
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{act.reviewer}</p>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200">
                        {act.platform}
                      </Badge>
                    </div>
                    <p className={`text-xs mt-0.5 ${act.urgent ? "text-amber-800 font-medium" : "text-slate-600"}`}>
                      {act.action}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>

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
