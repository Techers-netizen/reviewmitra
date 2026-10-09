"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  auth,
  googleProvider,
  facebookProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Email + Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email aur password dono zaroori hain");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        mode: "email",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("Login failed. Kripya dobara try karein.");
      setLoading(false);
    }
  };

  // Google 1-Tap Login via Firebase
  const handleGoogleLogin = async () => {
    setError(null);
    setOauthLoading("google");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Google account se email verify nahi hua");
      }

      // Sync session with NextAuth + Neon DB
      const res = await signIn("credentials", {
        mode: "firebase",
        email: user.email,
        name: user.displayName || "Google User",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setOauthLoading(null);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError(err?.message || "Google login cancel ho gaya ya fail hua");
      setOauthLoading(null);
    }
  };

  // Facebook Login via Firebase
  const handleFacebookLogin = async () => {
    setError(null);
    setOauthLoading("facebook");
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      const userEmail = user.email || `${user.uid}@facebook.opensoz.com`;

      const res = await signIn("credentials", {
        mode: "firebase",
        email: userEmail,
        name: user.displayName || "Facebook User",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setOauthLoading(null);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Facebook auth error:", err);
      setError(err?.message || "Facebook login fail hua");
      setOauthLoading(null);
    }
  };

  // Send Password Reset Email via Firebase
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail) {
      setError("Kripya apna registered email enter karein");
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
      setForgotLoading(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err?.message || "Password reset email send nahi ho saka");
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
        {/* Error notice */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Social 1-Tap Logins ────────────────────────────────────── */}
        <div className="space-y-2.5 mb-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={oauthLoading !== null || loading}
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
            {oauthLoading === "google" ? "Connecting Google..." : "Continue with Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleFacebookLogin}
            disabled={oauthLoading !== null || loading}
            className="w-full h-11 border-slate-200 hover:bg-slate-50 gap-3 font-semibold text-slate-700 text-sm"
          >
            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {oauthLoading === "facebook" ? "Connecting Facebook..." : "Continue with Facebook"}
          </Button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            <span className="bg-white px-3">Or with Email</span>
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
                  Forgot password?
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
              disabled={loading || oauthLoading !== null}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
            >
              {loading ? "Logging in..." : "Log in"}
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
                  Reset Link Sent!
                </div>
                <p>
                  Google mail infrastructure se password reset link <strong>{forgotEmail}</strong> par bhej diya gaya hai. Kripya apna inbox check karein.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Apna registered email address enter karein. Hum aapko instant password reset link bhejenge.
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
    </div>
  );
}
