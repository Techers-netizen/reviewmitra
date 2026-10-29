"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("clinic");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification step state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Email + Password Registration with Mandatory Email Verification
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !businessName.trim()) {
      setError("Please enter both your full name and business name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please enter a valid email address and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // 1. Register user in Neon PostgreSQL (emailVerified = false initially)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          businessName: businessName.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-up failed. Please check your details and try again.");
        setLoading(false);
        return;
      }

      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }

      // 2. Also create user in Firebase Auth & trigger official verification email
      try {
        const fbCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(fbCred.user);
      } catch (fbErr: any) {
        // If user already exists in Firebase Auth, try signing in and sending verification
        try {
          const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (!fbCred.user.emailVerified) {
            await sendEmailVerification(fbCred.user);
          }
        } catch {
          // Fallback verification link is still available via backend token
        }
      }

      // Show mandatory email verification step before activating dashboard
      setVerificationStep(true);
      setResendCooldown(60);
      setLoading(false);
    } catch (err: any) {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  // Resend Verification Email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setResendMessage(null);

    try {
      try {
        const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!fbCred.user.emailVerified) {
          await sendEmailVerification(fbCred.user);
        }
      } catch {
        // Continue with backend token resend
      }

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.verificationUrl) setVerificationUrl(data.verificationUrl);
        setResendMessage("A fresh verification email has been sent! Please check your inbox and spam folder.");
        setResendCooldown(60);
      } else {
        setError(data.error || "Could not resend verification email.");
      }
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Verify & Activate Service
  const handleConfirmVerifiedAndSignIn = async () => {
    setCheckingVerification(true);
    setError(null);
    try {
      let isFbVerified = false;
      try {
        const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await fbCred.user.reload();
        isFbVerified = fbCred.user.emailVerified;
      } catch {
        // Check DB verification status
      }

      if (isFbVerified) {
        await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm_verified", email: email.trim() }),
        });
      }

      const signinRes = await signIn("credentials", {
        email: email.trim(),
        password,
        mode: "email",
        firebaseVerified: isFbVerified ? "true" : "false",
        redirect: false,
      });

      if (signinRes?.error) {
        setError(
          "Your email is not verified yet. Please click the link sent to your email inbox (or use the instant verification link below) before continuing."
        );
        setCheckingVerification(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Could not verify your status. Please try again.");
      setCheckingVerification(false);
    }
  };

  // Google 1-Tap Signup (Facebook Removed)
  const handleGoogleSignup = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Could not retrieve a verified email address from your Google account.");
      }

      const res = await signIn("credentials", {
        mode: "firebase",
        email: user.email,
        name: user.displayName || "Business Owner",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setOauthLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError(err?.message || "Google sign-up was cancelled or failed. Please try again.");
      setOauthLoading(false);
    }
  };

  if (verificationStep) {
    return (
      <div>
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Mail size={13} /> Step 2 of 2 · Email Verification Required
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Verify your email address</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            We sent a verification link to <strong>{email}</strong> to activate your ReviewMitra service.
          </p>
        </div>

        <Card className="p-6 shadow-sm border-slate-200 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={15} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="flex items-start gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{resendMessage}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-900">Why is email verification required?</p>
            <p>
              To protect your business profile and activate automated AI replies, please click the verification link sent to your email inbox.
            </p>
            {verificationUrl && (
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] text-slate-500 mb-1">
                  Didn&apos;t receive the email due to spam filters? Use your direct verification link:
                </p>
                <a
                  href={verificationUrl}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-800"
                >
                  Verify {email} instantly & activate account →
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-1">
            <Button
              type="button"
              onClick={handleConfirmVerifiedAndSignIn}
              disabled={checkingVerification}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 font-semibold"
            >
              <CheckCircle2 size={16} />
              {checkingVerification ? "Checking Verification Status..." : "I Have Verified My Email — Continue"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleResendVerification}
              disabled={resending || resendCooldown > 0}
              className="w-full h-10 text-xs font-semibold gap-2"
            >
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
              {resending
                ? "Resending Verification Email..."
                : resendCooldown > 0
                ? `Resend Verification Email (${resendCooldown}s)`
                : "Resend Verification Email"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <Sparkles size={13} /> 7-Day Free Trial · Plans from ₹79/mo (+GST)
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Start your free trial</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Set up AI auto-replies for your business in 60 seconds
        </p>
      </div>

      <Card className="p-6 shadow-sm border-slate-200">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Google 1-Tap Signup (Facebook Removed) ──────────────────── */}
        <div className="space-y-2.5 mb-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignup}
            disabled={oauthLoading || loading}
            className="w-full h-11 border-slate-200 hover:bg-slate-50 gap-3 font-semibold text-slate-700 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {oauthLoading ? "Creating Account..." : "Sign up with Google"}
          </Button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            <span className="bg-white px-3">Or with Email & Password</span>
          </div>
        </div>

        {/* ─── Email Registration Form ──────────────────────────────── */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-slate-700 mb-1.5">
                Your Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Rajesh Mehta"
                className="h-10"
                required
              />
            </div>
            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-slate-700 mb-1.5">
                Business / Shop Name
              </label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Smile Dental Clinic"
                className="h-10"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-xs font-medium text-slate-700 mb-1.5">
              Business Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="clinic">Clinic / Doctor / Healthcare</option>
              <option value="salon">Salon / Spa / Beauty</option>
              <option value="restaurant">Restaurant / Cafe / Bakery</option>
              <option value="gym">Gym / Fitness Studio</option>
              <option value="retail">Retail Shop / Showroom</option>
              <option value="b2b">B2B / IndiaMART Manufacturer & Wholesale</option>
              <option value="service">Auto / Repair / Local Services</option>
              <option value="other">Other Business</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Email Address <span className="text-slate-400 font-normal">(Verification required)</span>
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@smiledental.com"
              className="h-10"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1.5">
              Set Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-10 pr-10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-slate-500 mb-1.5">
              WhatsApp Number <span className="text-slate-400 font-normal">(Optional, for instant review reports)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">+91</span>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="pl-12 h-10"
                maxLength={10}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
          >
            {loading ? "Creating account & sending verification..." : "Create Account & Verify Email"}
            <ArrowRight size={16} />
          </Button>

          <p className="text-[11px] text-slate-400 text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        Need help? Email us at{" "}
        <a href="mailto:help.opensoz@gmail.com" className="text-emerald-600 hover:underline font-medium">
          help.opensoz@gmail.com
        </a>
      </p>
    </div>
  );
}
