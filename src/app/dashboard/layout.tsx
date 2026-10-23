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
  Plus,
  HelpCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing & Plans", icon: CreditCard },
  { href: "/dashboard/help", label: "Help & Guide", icon: HelpCircle },
];

interface BusinessProfile {
  id: string;
  businessName: string;
  category?: string;
  city?: string;
  reviewsCount?: number;
  planName?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bizSwitcherOpen, setBizSwitcherOpen] = useState(false);
  const [addBizModalOpen, setAddBizModalOpen] = useState(false);

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessProfile | null>(null);

  // Add New Business Form State
  const [newBizName, setNewBizName] = useState("");
  const [newBizCategory, setNewBizCategory] = useState("clinic");
  const [newBizCity, setNewBizCity] = useState("");
  const [newBizGoogleUrl, setNewBizGoogleUrl] = useState("");
  const [creatingBiz, setCreatingBiz] = useState(false);
  const [bizNotice, setBizNotice] = useState<string | null>(null);

  const userName = session?.user?.name || "Business Owner";
  const userEmail = session?.user?.email || "help.opensoz@gmail.com";

  async function loadBusinesses() {
    try {
      const savedId = typeof window !== "undefined" ? localStorage.getItem("rm_active_business_id") : null;
      const url = savedId ? `/api/businesses?businessId=${encodeURIComponent(savedId)}` : "/api/businesses";
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: BusinessProfile[] = data.businesses || [];
        setBusinesses(list);
        const found =
          list.find((b) => b.id === savedId) ||
          list.find((b) => b.id === data.activeBusinessId) ||
          list[0] ||
          null;
        if (found) {
          setActiveBusiness(found);
          if (typeof window !== "undefined") {
            localStorage.setItem("rm_active_business_id", found.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user businesses:", err);
    }
  }

  useEffect(() => {
    void loadBusinesses();
  }, [session?.user?.email]);

  const handleSwitchBusiness = async (biz: BusinessProfile) => {
    setActiveBusiness(biz);
    setBizSwitcherOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("rm_active_business_id", biz.id);
    }
    try {
      await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", businessId: biz.id }),
      });
      if (updateSession) {
        await updateSession({ businessId: biz.id, businessName: biz.businessName });
      }
      window.dispatchEvent(new CustomEvent("rm-business-switched", { detail: { businessId: biz.id } }));
      window.location.reload();
    } catch (e) {
      console.error("Switch business error:", e);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    setCreatingBiz(true);
    setBizNotice(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          businessName: newBizName.trim(),
          category: newBizCategory,
          city: newBizCity.trim(),
          googleMapsUrl: newBizGoogleUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.business) {
        setNewBizName("");
        setNewBizCity("");
        setNewBizGoogleUrl("");
        setAddBizModalOpen(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("rm_active_business_id", data.business.id);
        }
        await loadBusinesses();
        window.location.reload();
      } else {
        setBizNotice(data.error || "Failed to add new business location.");
      }
    } catch {
      setBizNotice("Network error while adding business location.");
    } finally {
      setCreatingBiz(false);
    }
  };

  const displayBusinessName =
    activeBusiness?.businessName ||
    (session?.user as any)?.businessName ||
    "My Business";

  const formatPlanBadge = (planKey?: string) => {
    switch (planKey) {
      case "test_1":
        return "Live Test (₹1)";
      case "nano_79":
        return "Nano Plan (₹79)";
      case "starter_149":
        return "Starter Plan (₹149)";
      case "growth_249":
        return "Growth Plan (₹249)";
      case "pro_399":
        return "Pro Plan (₹399)";
      default:
        return "Active Plan";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
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

            {/* ─── Multi-Business Switcher (2+ Businesses on Same Email) ─── */}
            <div className="relative pl-2 sm:pl-4 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setBizSwitcherOpen(!bizSwitcherOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-full transition-colors"
              >
                <Building2 size={14} className="text-emerald-600 shrink-0" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">{displayBusinessName}</span>
                {businesses.length > 1 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {businesses.length}
                  </span>
                )}
                <ChevronDown size={13} className="text-slate-500 shrink-0" />
              </button>

              {bizSwitcherOpen && (
                <div className="absolute left-2 sm:left-4 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Your Business Locations ({businesses.length || 1})
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                      Multi-Outlet Ready
                    </Badge>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {businesses.map((biz) => {
                      const isCurrent = biz.id === activeBusiness?.id;
                      return (
                        <button
                          key={biz.id}
                          type="button"
                          onClick={() => handleSwitchBusiness(biz)}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            isCurrent ? "bg-emerald-50/60" : ""
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className={`text-xs truncate ${isCurrent ? "font-bold text-emerald-900" : "font-medium text-slate-800"}`}>
                              {biz.businessName}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">
                              {biz.category || "business"} {biz.city ? `· ${biz.city}` : ""}
                            </p>
                          </div>
                          {isCurrent && <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setBizSwitcherOpen(false);
                        setAddBizModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Plus size={14} />
                      Add 2nd / New Business Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Badge variant="outline" className="hidden md:inline-flex border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
              {formatPlanBadge(activeBusiness?.planName)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Agentic AI Active</span>
            </div>

            <Link
              href="/dashboard/help"
              title="Platform Help & Setup Guide"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
            >
              <HelpCircle size={18} />
            </Link>

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
                  <p className="text-[10px] text-slate-500 max-w-[130px] truncate">{userEmail}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{displayBusinessName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddBizModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 font-semibold hover:bg-emerald-50 text-left"
                  >
                    <Plus size={14} /> Add Business Location
                  </button>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={14} /> Business & WhatsApp Settings
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <CreditCard size={14} /> Plans & Billing
                  </Link>
                  <Link
                    href="/dashboard/help"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <HelpCircle size={14} /> Help & Setup Guide
                  </Link>
                  <a
                    href="mailto:help.opensoz@gmail.com"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Mail size={14} /> help.opensoz@gmail.com
                  </a>
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

      {/* ─── Add New Business Location Modal ────────────────────── */}
      {addBizModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Add Business Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddBizModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Have 2 or more businesses registered under your email? Add each branch or brand here to manage its Google, Facebook, Justdial, and IndiaMART reviews separately.
            </p>

            {bizNotice && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {bizNotice}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business / Shop Name *</label>
                <Input
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Smile Dental Care - Branch 2"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newBizCategory}
                    onChange={(e) => setNewBizCategory(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    <option value="clinic">Clinic / Healthcare</option>
                    <option value="salon">Salon / Spa</option>
                    <option value="restaurant">Restaurant / Cafe</option>
                    <option value="retail">Retail / Showroom</option>
                    <option value="b2b">B2B / IndiaMART Seller</option>
                    <option value="gym">Gym / Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <Input
                    value={newBizCity}
                    onChange={(e) => setNewBizCity(e.target.value)}
                    placeholder="e.g. Surat, Mumbai"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Maps URL or Place ID (Optional)
                </label>
                <Input
                  value={newBizGoogleUrl}
                  onChange={(e) => setNewBizGoogleUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddBizModalOpen(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingBiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold"
                >
                  {creatingBiz ? "Creating..." : "Create Business Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      Direct Push
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Card */}
          <div className="p-3 m-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>{formatPlanBadge(activeBusiness?.planName)}</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              Plans start at ₹79/mo (+18% GST) · Need help? Email{" "}
              <a href="mailto:help.opensoz@gmail.com" className="underline font-semibold">
                help.opensoz@gmail.com
              </a>
            </p>
            <Button
              asChild
              size="sm"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 font-semibold"
            >
              <Link href="/dashboard/billing">Manage Plan & ₹1 Test</Link>
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
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <a
                  href="mailto:help.opensoz@gmail.com"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 font-medium"
                >
                  <Mail size={14} /> help.opensoz@gmail.com
                </a>
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
