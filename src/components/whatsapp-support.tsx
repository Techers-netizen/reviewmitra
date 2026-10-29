"use client";

import { useState } from "react";
import { Mail, X, HelpCircle } from "lucide-react";
import Link from "next/link";

const SUPPORT_EMAIL = "help.opensoz@gmail.com";

export function WhatsAppSupport() {
  const [open, setOpen] = useState(false);
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "ReviewMitra Support Request"
  )}&body=${encodeURIComponent(
    "Hello OpenSoz Support Team,\n\nI need help configuring my ReviewMitra account:\n"
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="max-w-[280px] rounded-2xl rounded-br-sm border border-emerald-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                RM
              </span>
              <div className="text-xs">
                <p className="font-bold text-slate-900">ReviewMitra Support</p>
                <p className="text-slate-500">{SUPPORT_EMAIL}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
            Need help connecting your Google Maps, Facebook, Justdial, or IndiaMART profiles? Email our support team or view the step-by-step setup guide.
          </p>
          <div className="mt-3 space-y-1.5">
            <a
              href={mailtoHref}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Mail size={13} />
              Email {SUPPORT_EMAIL}
            </a>
            <Link
              href="/dashboard/help"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle size={13} />
              Open Full Help & Setup Guide
            </Link>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open ReviewMitra Support"
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Mail size={24} />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
        </span>
      </button>
    </div>
  );
}
