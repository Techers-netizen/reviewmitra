"use client";

import { useState, useEffect } from "react";
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
  QrCode,
  HelpCircle,
  PlusCircle,
  Check,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
  badge?: string;
  isNew?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reviews", label: "Unified Inbox", icon: MessageSquare },
  { href: "/dashboard/connect", label: "Connect Platforms", icon: Link2 },
  { href: "/dashboard/qr-booster", label: "QR Booster", icon: QrCode, isNew: true },
  { href: "/dashboard/auto-reply", label: "AI Auto-Reply", icon: Bot },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/guide", label: "Help & Guide", icon: HelpCircle, isNew: true },
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

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeBiz, setActiveBiz] = useState<any>(null);
  const [bizSwitcherOpen, setBizSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const defaultBizName = (session?.user as any)?.businessName || "National Medical";
  const businessName = activeBiz?.name || defaultBizName;
  const userName = session?.user?.name || "Business Owner";
  const userPhone = (session?.user as any)?.phone || "9876543210";

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const res = await fetch("/api/business");
        if (res.ok) {
          const data = await res.json();
          if (data.businesses && data.businesses.length > 0) {
            setBusinesses(data.businesses);
            const active = data.businesses.find((b: any) => b.isActive) || data.businesses[0];
            setActiveBiz(active);
          }
        }
      } catch (e) {
        console.error("Failed to load businesses:", e);
      }
    }
    loadBusinesses();
  }, []);

  const handleSwitchBusiness = async (bizId: string) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/business/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to switch business:", e);
    } finally {
      setSwitching(false);
      setBizSwitcherOpen(false);
    }
  };

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

            {/* Multi-Business Switcher Dropdown */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
              <div className="relative">
                <button
                  onClick={() => setBizSwitcherOpen(!bizSwitcherOpen)}
                  className="flex items-center gap-2 font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors text-xs border border-slate-200 shadow-2xs"
                >
                  <Building2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="font-bold max-w-[150px] truncate">
                    {activeBiz?.name || defaultBizName}
                  </span>
                  <ChevronDown size={12} className="text-slate-500 shrink-0" />
                </button>

                {bizSwitcherOpen && (
                  <div
                    className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Store / Clinic
                      </p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                        Multi-Store
                      </span>
                    </div>

                    <div className="py-1 max-h-60 overflow-y-auto">
                      {(businesses.length > 0
                        ? businesses
                        : [
                            { id: "1", name: "National Medical", category: "clinic", isActive: true },
                            { id: "2", name: "New Lucky Restaurant", category: "restaurant", isActive: false },
                          ]
                      ).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => handleSwitchBusiness(b.id)}
                          disabled={switching}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs ${
                            b.isActive
                              ? "bg-emerald-50/70 font-semibold text-emerald-950"
                              : "text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Store
                              size={14}
                              className={b.isActive ? "text-emerald-600" : "text-slate-400"}
                            />
                            <div className="truncate">
                              <p className="font-semibold truncate">{b.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">
                                {b.category || "MSME Store"}
                              </p>
                            </div>
                          </div>
                          {b.isActive && <Check size={14} className="text-emerald-600 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </div>

                    <div className="px-2 pt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const name = prompt(
                            "Naye business ka naam enter karein (e.g. New Lucky Restaurant ya National Medical):"
                          );
                          if (name?.trim()) {
                            fetch("/api/business", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ businessName: name.trim() }),
                            }).then(() => window.location.reload());
                          }
                        }}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold"
                      >
                        <PlusCircle size={13} /> + Add Another Business
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
              >
                Growth Plan (2 Stores)
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

              {/* Mobile Business Selector */}
              <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  Active Store / Clinic
                </p>
                <div className="space-y-1">
                  {(businesses.length > 0
                    ? businesses
                    : [
                        { id: "1", name: "National Medical", category: "clinic", isActive: true },
                        { id: "2", name: "New Lucky Restaurant", category: "restaurant", isActive: false },
                      ]
                  ).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSwitchBusiness(b.id)}
                      disabled={switching}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        b.isActive
                          ? "bg-emerald-600 text-white font-bold shadow-2xs"
                          : "text-slate-700 hover:bg-slate-200 font-medium"
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {b.isActive && <Check size={14} className="shrink-0" />}
                    </button>
                  ))}
                </div>
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
