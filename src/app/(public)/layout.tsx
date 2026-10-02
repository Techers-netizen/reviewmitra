"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Menu, X, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm font-bold">
              <Star size={18} fill="white" strokeWidth={0} />
            </span>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Review<span className="text-emerald-600">Mitra</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-emerald-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Link href="/signup">
                Start Free Trial <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3">
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full text-xs font-semibold justify-center">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold justify-center">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ─── Page Content ───────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm font-bold">
                  <Star size={15} fill="white" strokeWidth={0} />
                </span>
                <span className="font-extrabold text-lg text-white">
                  Review<span className="text-emerald-500">Mitra</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-powered review reply platform for Indian clinics, salons, gyms & restaurants.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck size={14} /> Made with pride in Bharat 🇮🇳
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing Plans</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Live Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact & Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://wa.me/919876543210?text=Hi%20ReviewMitra%20team,%20I%20need%20help"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <MessageCircle size={13} /> WhatsApp Support
                  </a>
                </li>
                <li><Link href="/login" className="hover:text-white transition">Log in</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">7-Day Free Trial</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} ReviewMitra Technologies Pvt. Ltd. All rights reserved.</p>
            <p>Empowering 6+ Crore Indian MSMEs with AI Automation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
