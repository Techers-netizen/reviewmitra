import type { Metadata } from "next";
import { Dashboard } from "@/components/review-mitra/dashboard";

export const metadata: Metadata = {
  title: "Unified Review Inbox — ReviewMitra",
  description: "View, filter and reply to all reviews from Google, Facebook, and Justdial in one place.",
};

export default function UnifiedInboxPage() {
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Unified Review Inbox
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Google, Facebook aur Justdial ke reviews ek jagah. AI se 1-click reply karein.
        </p>
      </div>

      <Dashboard />
    </div>
  );
}
