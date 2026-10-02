import { Star } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/80 via-white to-slate-50">
      {/* Minimal header */}
      <header className="px-4 sm:px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Star size={16} fill="white" strokeWidth={0} />
          </span>
          <span className="font-bold text-lg">
            Review<span className="text-emerald-600">Mitra</span>
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal footer */}
      <footer className="px-4 sm:px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ReviewMitra · Made in Bharat 🇮🇳
      </footer>
    </div>
  );
}
