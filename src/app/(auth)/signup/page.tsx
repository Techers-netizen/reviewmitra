"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Sparkles, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email + Password Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !businessName.trim()) {
      setError("Full name aur business name dono zaroori hain");
      return;
    }
    if (!email.trim() || !password) {
      setError("Email aur password dono zaroori hain");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          businessName,
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signinRes = await signIn("credentials", {
        email,
        password,
        mode: "email",
        redirect: false,
      });

      if (signinRes?.error) {
        setError(signinRes.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("Registration failed. Kripya dobara try karein.");
      setLoading(false);
    }
  };

  // Google 1-Tap Signup
  const handleGoogleSignup = async () => {
    setError(null);
    setOauthLoading("google");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Google account se email verify nahi hua");
      }

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
      console.error("Google signup error:", err);
      setError(err?.message || "Google signup fail hua");
      setOauthLoading(null);
    }
  };

  // Facebook 1-Tap Signup
  const handleFacebookSignup = async () => {
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
      console.error("Facebook signup error:", err);
      setError(err?.message || "Facebook signup fail hua");
      setOauthLoading(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <Sparkles size={13} /> 7-Day Free Trial · No Credit Card Required
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Start your free trial</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Setup AI auto-replies for your local business in 60 seconds
        </p>
      </div>

      <Card className="p-6 shadow-sm border-slate-200">
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
            onClick={handleGoogleSignup}
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
            {oauthLoading === "google" ? "Creating Account..." : "Sign up with Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleFacebookSignup}
            disabled={oauthLoading !== null || loading}
            className="w-full h-11 border-slate-200 hover:bg-slate-50 gap-3 font-semibold text-slate-700 text-sm"
          >
            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {oauthLoading === "facebook" ? "Creating Account..." : "Sign up with Facebook"}
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
              <option value="service">Auto / Repair / Local Services</option>
              <option value="other">Other Business</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Email Address
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
              Phone Number <span className="text-slate-400 font-normal">(Optional, for review alerts)</span>
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
            disabled={loading || oauthLoading !== null}
            className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
          >
            {loading ? "Setting up account..." : "Create Account & Start Trial"}
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
    </div>
  );
}
