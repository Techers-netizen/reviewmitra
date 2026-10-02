"use client";

import { useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Save,
  Check,
  Bell,
  Shield,
  Smartphone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BusinessSettingsPage() {
  const [businessName, setBusinessName] = useState("Smile Dental Care");
  const [category, setCategory] = useState("clinic");
  const [city, setCity] = useState("Mumbai");
  const [phoneSupport, setPhoneSupport] = useState("+91 98765 43210");
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Business Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apne clinic, salon, gym ya restaurant ki profile aur notification settings manage karein.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold h-9 shadow-sm"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved Successfully!" : "Save Changes"}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── Business Information Card ─────────────────────────── */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-emerald-600" />
              Business Profile
            </h3>
            <Badge variant="outline" className="text-[10px] text-slate-600">
              ID: biz_demo123
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bizName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Name
              </label>
              <Input
                id="bizName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-10 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="bizCategory" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="bizCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="clinic">Clinic / Doctor / Healthcare</option>
                <option value="salon">Salon / Spa / Wellness</option>
                <option value="gym">Gym / Fitness Center</option>
                <option value="restaurant">Restaurant / Cafe / Food</option>
                <option value="retail">Retail / Kirana / Store</option>
                <option value="other">Other Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="bizCity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                City / Location
              </label>
              <Input
                id="bizCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 text-xs"
                placeholder="Mumbai, Andheri West"
              />
            </div>

            <div>
              <label htmlFor="phoneSupport" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Support Phone
              </label>
              <Input
                id="phoneSupport"
                value={phoneSupport}
                onChange={(e) => setPhoneSupport(e.target.value)}
                className="h-10 text-xs"
                placeholder="+91 98765 43210"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Negative review ke apology reply me yeh number automatically include hoga.
              </p>
            </div>
          </div>
        </Card>

        {/* ─── Notification Preferences ──────────────────────────── */}
        <Card className="p-5 sm:p-6 border-slate-200 space-y-4">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bell size={16} className="text-emerald-600" />
              WhatsApp & Alert Preferences
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ReviewMitra WhatsApp Business API ke through alerts send karta hai.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Instant Negative Review Alert</p>
                <p className="text-[11px] text-slate-500">
                  1★ ya 2★ review aane par 60 second ke andar WhatsApp pe draft reply ke saath alert bhejein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  whatsappAlerts ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    whatsappAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t pt-3 border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">Daily Morning Digest (9:00 AM)</p>
                <p className="text-[11px] text-slate-500">
                  Kal ke naye reviews, average rating aur AI replied count ka concise WhatsApp summary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDailyDigest(!dailyDigest)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  dailyDigest ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    dailyDigest ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
