"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Phone, CheckCircle2, Sparkles, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("clinic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = (e: React.FormEvent) => {
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
      setStep("otp");
      setOtp("123456"); // Pre-fill test OTP for demo
    }, 600);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length !== 6) {
      setError("Kripya 6-digit OTP enter karein");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("details");
    }, 500);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !businessName.trim()) {
      setError("Full name aur business name dono zaroori hain");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          password: password || "demo123",
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
        phone,
        otp: "123456",
        mode: "phone",
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
      setError("Account create karne me samasya aayi. Kripya dobara koshish karein.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Start your free trial</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          7 din free. Koi credit card nahi chahiye.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[
          { key: "phone", label: "Phone" },
          { key: "otp", label: "Verify" },
          { key: "details", label: "Details" },
        ].map((s, i) => {
          const steps = ["phone", "otp", "details"];
          const currentIndex = steps.indexOf(step);
          const stepIndex = steps.indexOf(s.key);
          const isDone = stepIndex < currentIndex;
          const isCurrent = s.key === step;

          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${
                isCurrent ? "text-emerald-700" : isDone ? "text-emerald-500" : "text-slate-300"
              }`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                  isCurrent
                    ? "bg-emerald-600 text-white"
                    : isDone
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> : i + 1}
                </span>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-8 h-px ${isDone ? "bg-emerald-300" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>

      <Card className="p-6 shadow-sm border-slate-200">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Aapke phone pe 6-digit OTP aayega verify karne ke liye
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
            >
              {loading ? "Sending OTP..." : "Continue with Phone"}
              <ArrowRight size={16} />
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
              <span>OTP sent to +91 {phone}</span>
              <button
                type="button"
                onClick={() => setStep("phone")}
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
              {loading ? "Verifying..." : "Verify OTP"}
              <ArrowRight size={16} />
            </Button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-slate-700 mb-1.5">
                Your Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Rajesh Sharma"
                className="h-11"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-slate-700 mb-1.5">
                Business Name
              </label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Sharma Dental Clinic"
                className="h-11"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-medium text-slate-700 mb-1.5">
                Business Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="clinic">Clinic / Doctor / Hospital</option>
                <option value="salon">Salon / Spa / Beauty</option>
                <option value="gym">Gym / Fitness Center</option>
                <option value="restaurant">Restaurant / Cafe / Food</option>
                <option value="retail">Retail / Kirana / Shop</option>
                <option value="other">Other Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@sharmadental.com"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold"
            >
              {loading ? "Creating account..." : "Complete Setup & Launch Dashboard"}
              <Sparkles size={16} />
            </Button>
          </form>
        )}
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
