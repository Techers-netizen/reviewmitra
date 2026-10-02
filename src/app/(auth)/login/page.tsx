"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Kripya valid 10-digit mobile number enter karein");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setOtp("123456"); // Pre-fill test OTP for frictionless experience
    }, 600);
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length !== 6) {
      setError("Kripya 6-digit OTP enter karein");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        phone,
        otp,
        mode: "phone",
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
      setError("Login failed. Kripya credentials check karein.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Log in to your ReviewMitra dashboard
        </p>
      </div>

      <Card className="p-6 shadow-sm border-slate-200">
        {/* Method toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setMethod("phone");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
              method === "phone"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Phone size={13} /> Phone + OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("email");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
              method === "email"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail size={13} /> Email + Password
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {method === "phone" ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="pl-12 h-11"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
                <ArrowRight size={16} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                <span>OTP sent to +91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-emerald-700 underline font-medium hover:text-emerald-900"
                >
                  Change
                </button>
              </div>

              <div>
                <label htmlFor="otp" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Enter 6-digit OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-11 text-center tracking-widest text-lg font-mono"
                  required
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Demo code: <span className="font-semibold text-emerald-700">123456</span>
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
              >
                {loading ? "Verifying..." : "Verify & Log in"}
                <ArrowRight size={16} />
              </Button>
            </form>
          )
        ) : (
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
                placeholder="you@business.com"
                className="h-11"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
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
              disabled={loading}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
            >
              {loading ? "Logging in..." : "Log in"}
              <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-5 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Start free trial
        </Link>
      </p>
    </div>
  );
}
