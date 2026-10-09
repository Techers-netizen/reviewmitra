import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy | ReviewMitra by OpenSoz",
  description: "Privacy policy detailing how ReviewMitra and OpenSoz protect user data, encrypt OAuth credentials, and maintain customer privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <Link href="/" className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-2">
            <Lock size={16} /> Data Security & Trust
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last Updated: October 2026 · An OpenSoz Product (opensoz.com)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Overview & Commitment
            </h2>
            <p>
              OpenSoz (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates ReviewMitra at{" "}
              <span className="font-semibold text-slate-900">reviewmitra.opensoz.com</span>. We respect your privacy and are committed to protecting the personally identifiable information of our business customers and their reviewers. We do <span className="font-semibold text-slate-900">not</span> sell, rent, or trade customer data to any third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold text-slate-900">Account Credentials:</span> Name, email address, business category, and contact details collected during registration or via Google Single Sign-On (SSO).
              </li>
              <li>
                <span className="font-semibold text-slate-900">OAuth Access Tokens:</span> Read and reply permissions granted by you to connect Google Business Profiles or Facebook Pages.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Public Review Data:</span> Customer reviews, star ratings, reviewer names, and public timestamps retrieved via authorized APIs for aggregation and display.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Billing Information:</span> Processed securely via Dodo Payments. We do not store raw credit card numbers or banking secrets on our servers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Bank-Grade Security & AES-256 Encryption
            </h2>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <ShieldCheck size={18} /> Hardware-grade cryptographic storage
              </div>
              <p className="text-xs leading-relaxed">
                All external platform tokens (Google OAuth access and refresh tokens, Meta access keys) are encrypted before writing to our database using <span className="font-semibold">AES-256-GCM authenticated encryption</span> with unique initialization vectors (IV). Decryption keys are stored in secure environment secrets separate from the database layer.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. How We Use Collected Data
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide the core unified inbox and sync customer reviews across your connected profiles.</li>
              <li>To generate draft AI replies using secure LLM models with strict prompt encapsulation.</li>
              <li>To provide customer review QR code landing pages for your physical business location.</li>
              <li>To dispatch automated WhatsApp or email summary alerts configured by you.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Data Retention and Account Deletion
            </h2>
            <p>
              You maintain full ownership of your business data. You can disconnect platform integrations at any time via your dashboard, which immediately revokes and purges active tokens. If you delete your ReviewMitra account, all associated business records and review caches are permanently deleted from our primary databases within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              6. Contact our Privacy Office
            </h2>
            <p>
              If you have any questions or data requests under applicable privacy frameworks, please reach out to us directly:
            </p>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 font-mono text-xs space-y-1">
              <p>Email: privacy@opensoz.com</p>
              <p>Organization: OpenSoz Technologies (https://opensoz.com)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
