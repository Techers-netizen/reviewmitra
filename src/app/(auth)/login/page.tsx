"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
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
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Unverified Email Resend State
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fallbackVerifyUrl, setFallbackVerifyUrl] = useState<string | null>(null);

  // Google-registered user trying to use Email+Password state
  const [googleAccountPrompt, setGoogleAccountPrompt] = useState(false);
  const [linkingPassword, setLinkingPassword] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verified") === "true") {
        setSuccessBanner("Your email address has been verified! You can now log in to your dashboard.");
      }
      const errParam = params.get("error");
      if (errParam) {
        setError(errParam);
      }
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Email + Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);
    setNeedsVerification(false);
    setGoogleAccountPrompt(false);

    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      // Check Firebase email verification status if account exists in Firebase Auth
      let firebaseVerified = false;
      try {
        const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await fbCred.user.reload();
        firebaseVerified = fbCred.user.emailVerified;
      } catch {
        // Continue to NextAuth DB check (handles Google-first accounts or DB-only accounts)
      }

      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        mode: "email",
        firebaseVerified: firebaseVerified ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("GOOGLE_ACCOUNT_NO_PASSWORD")) {
          setGoogleAccountPrompt(true);
          setError(
            "This email was originally registered with Google Sign-In. You can sign in with Google above, or click the button below to link this password to your account."
          );
        } else if (res.error.includes("EMAIL_NOT_VERIFIED")) {
          setNeedsVerification(true);
          setError(
            "Your email address is not verified yet. Please check your email inbox for the verification link or click 'Resend Verification Email' below."
          );
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("Login failed. Please check your credentials and try again.");
      setLoading(false);
    }
  };

  // Resend Verification Email (Firebase + Backend Token Link)
  const handleResendVerification = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    setResendingEmail(true);
    setError(null);
    try {
      // 1. Trigger Firebase verification email if possible
      if (password) {
        try {
          const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (!fbCred.user.emailVerified) {
            await sendEmailVerification(fbCred.user);
          }
        } catch {
          // Ignore Firebase client error and rely on backend verification token
        }
      }

      // 2. Request fresh verification token from backend API
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.verificationUrl) {
          setFallbackVerifyUrl(data.verificationUrl);
        }
        setSuccessBanner(
          data.message || "Verification email resent! Please check your inbox and spam folder."
        );
        setResendCooldown(60);
      } else {
        setError(data.error || "Could not resend verification email. Please try again.");
      }
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  // Link Password to an existing Google-registered account after verifying ownership via Google Popup
  const handleLinkPasswordToGoogleAccount = async () => {
    if (!email.trim() || !password || password.length < 6) {
      setError("Please enter a password of at least 6 characters first.");
      return;
    }
    setLinkingPassword(true);
    setError(null);
    try {
      // Verify Google account ownership via popup
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error("Please select the same Google account that matches the email entered.");
      }

      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        mode: "email",
        setPasswordForGoogle: "true",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLinkingPassword(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Could not verify Google account to link password.");
      setLinkingPassword(false);
    }
  };

  // Google 1-Tap Login via Firebase (Facebook Login removed)
  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessBanner(null);
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
      console.error("Google auth error:", err);
      setError(err?.message || "Google sign-in was cancelled or failed. Please try again.");
      setOauthLoading(false);
    }
  };

  // Send Password Reset Email via Firebase
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSent(true);
      setForgotLoading(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err?.message || "Could not send password reset email. Please verify your email address.");
      setForgotLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Log in to your ReviewMitra business dashboard
        </p>
      </div>

      <Card className="p-6 shadow-sm border-slate-200">
        {/* Success notice */}
        {successBanner && (
          <div className="mb-4 flex items-start gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <span>{successBanner}</span>
              {fallbackVerifyUrl && (
                <div>
                  <a
                    href={fallbackVerifyUrl}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Click here to verify email instantly →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-4 flex flex-col gap-2.5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>

            {/* Action Box 1: Unverified Email -> Resend Verification Email */}
            {needsVerification && (
              <div className="pt-2 border-t border-red-200/70 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={resendingEmail || resendCooldown > 0}
                  className="h-8 text-xs bg-white border-red-300 text-red-700 hover:bg-red-100 gap-1.5 font-semibold"
                >
                  <RefreshCw size={12} className={resendingEmail ? "animate-spin" : ""} />
                  {resendingEmail
                    ? "Sending Verification Email..."
                    : resendCooldown > 0
                    ? `Resend Available in ${resendCooldown}s`
                    : "Resend Verification Email"}
                </Button>
              </div>
            )}

            {/* Action Box 2: Google Account trying to use Password -> Link Password */}
            {googleAccountPrompt && (
              <div className="pt-2 border-t border-red-200/70 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLinkPasswordToGoogleAccount}
                  disabled={linkingPassword}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                >
                  <ShieldCheck size={13} />
                  {linkingPassword
                    ? "Verifying with Google..."
                    : "Verify with Google & Enable This Password"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Google 1-Tap Login (Facebook Removed) ────────────────────── */}
        <div className="space-y-2.5 mb-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
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
            {oauthLoading ? "Connecting with Google..." : "Continue with Google"}
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

        {/* ─── Email + Password Form ──────────────────────────────────── */}
        {!showForgot ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@myclinic.com"
                className="h-11"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotEmail(email);
                    setError(null);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Forgot or set password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10"
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

            <Button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
            >
              {loading ? "Signing in..." : "Log in"}
              <ArrowRight size={16} />
            </Button>
          </form>
        ) : (
          /* ─── Forgot Password Mode ─────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound size={14} className="text-emerald-600" /> Reset Password
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotSent(false);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Back to login
              </button>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Password Reset Link Sent!
                </div>
                <p>
                  We have sent a password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered email address and we will send you an instant password reset link.
                </p>
                <div>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="h-11"
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-10 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  {forgotLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </div>
        )}
      </Card>

      <p className="mt-5 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Start 7-day free trial
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
