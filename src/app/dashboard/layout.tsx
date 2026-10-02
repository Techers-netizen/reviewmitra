"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Link2,
  Bot,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  Bell,
  Star,
  ChevronDown,
  Building2,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reviews", label: "Unified Inbox", icon: MessageSquare, badge: "3" },
  { href: "/dashboard/connect", label: "Connect Platforms", icon: Link2 },
  { href: "/dashboard/auto-reply", label: "AI Auto-Reply", icon: Bot, isNew: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const businessName = (session?.user as any)?.businessName || "My Clinic / Business";
  const userName = session?.user?.name || "Business Owner";
  const userPhone = (session?.user as any)?.phone || "9876543210";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm font-bold">
                <Star size={18} fill="white" strokeWidth={0} />
              </span>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden sm:inline">
                Review<span className="text-emerald-600">Mitra</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                <Building2 size={13} className="text-emerald-600" />
                {businessName}
              </span>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                Starter Plan
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick sync status pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-sync active</span>
            </div>

            {/* Notification button */}
            <button
              title="Notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-600" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-tight text-slate-900">{userName}</p>
                  <p className="text-[10px] text-slate-500">+91 {userPhone}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{businessName}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={14} /> Business Settings
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <CreditCard size={14} /> Subscription & Billing
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Body (Sidebar + Content) ───────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 shrink-0">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={17} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-amber-100 text-amber-800 tracking-wide">
                      AI Auto
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Card */}
          <div className="p-3 m-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Starter Plan</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              100 AI Replies/mo · WhatsApp Alerts active
            </p>
            <Button
              asChild
              size="sm"
              className="mt-2.5 w-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 font-semibold"
            >
              <Link href="/dashboard/billing">Upgrade to Growth</Link>
            </Button>
          </div>
        </aside>

        {/* Mobile slide-over drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 max-w-[80%] h-full bg-white p-4 shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="font-bold text-slate-900">ReviewMitra Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ─── Mobile Bottom Nav Bar ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={18} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span className="mt-0.5">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
