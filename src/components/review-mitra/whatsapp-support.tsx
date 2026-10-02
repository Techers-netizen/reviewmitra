"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const SUPPORT_NUMBER = "919876543210"; // demo
const PREFILLED_MESSAGE =
  "Namaste, mujhe ReviewMitra dashboard setup karne me help chahiye.";

export function WhatsAppSupport() {
  const [open, setOpen] = useState(false);
  const href = `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="max-w-[260px] rounded-2xl rounded-br-sm border border-emerald-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                RM
              </span>
              <div className="text-xs">
                <p className="font-semibold">ReviewMitra Support</p>
                <p className="text-muted-foreground">Replies in minutes</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-xs text-foreground/80">
            Need help setting up your Google, Facebook or Justdial sync? Chat directly with the founder on WhatsApp.
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 block rounded-lg bg-emerald-500 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            Chat on WhatsApp →
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp support"
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle size={26} className="fill-white/20" />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
        </span>
      </button>
    </div>
  );
}
