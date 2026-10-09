import type { Metadata } from "next";
import { Heart, ArrowRight, MessageCircle, Globe, Users, Target, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — ReviewMitra by OpenSoz",
  description: "ReviewMitra is an AI reputation management platform built by OpenSoz for independent clinics, salons, gyms, and local businesses.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Code2 size={12} className="mr-1.5" />
            Built by OpenSoz · opensoz.com
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Empowering Local Businesses with{" "}
            <span className="text-emerald-600">Smart AI Reputation</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            ReviewMitra was engineered to give clinic owners, salon founders, and neighborhood merchants enterprise-grade review automation without the enterprise price tag.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Our Mission",
                desc: "Millions of local business owners work tirelessly serving customers yet lack dedicated marketing teams. We build lightweight, intuitive software that handles customer feedback automatically.",
              },
              {
                icon: Globe,
                title: "Multilingual Intelligence",
                desc: "Real customers speak and review in diverse languages. Our engine understands English, Hindi, Hinglish, Gujarati, Marathi, and regional nuances to generate authentic owner responses.",
              },
              {
                icon: Users,
                title: "Built by OpenSoz",
                desc: "Developed independently under OpenSoz. No corporate bureaucracy, no forced upsells — just clean, dependable, and high-performance software built for everyday founders.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-6 border-slate-200">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 border-t bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">
            Why We Built ReviewMitra
          </h2>
          <Card className="p-6 sm:p-8 border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">
              &ldquo;I observed independent doctors and shop owners spending nearly an hour every night checking Google Maps, Facebook, and local directories — trying to craft polite replies while juggling patient appointments. A single poorly worded reply to negative feedback could ruin days of hard work.
            </p>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              When I investigated existing solutions like Birdeye and Podium, they charged between $100 and $300 per month — a prohibitive cost for neighborhood businesses. I realized local owners deserved a purpose-built, affordable tool tailored to their actual daily workflow.
            </p>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              That vision became ReviewMitra: modern review aggregation, culturally tuned AI replies, and in-store QR code boosters, priced fairly starting at ₹399/month.&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                OS
              </span>
              <div>
                <p className="font-semibold text-sm text-slate-900">Developer & Founder</p>
                <p className="text-xs text-slate-500">OpenSoz Technologies (<a href="https://opensoz.com" target="_blank" rel="noreferrer" className="underline hover:text-emerald-600">opensoz.com</a>)</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to Put Your Reviews on Autopilot?
          </h2>
          <p className="mt-3 text-slate-600 max-w-md mx-auto text-sm">
            Try ReviewMitra free for 7 days. Connect your Google and Facebook accounts in under 2 minutes.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/signup">
                Start 7-Day Free Trial <ArrowRight size={16} className="ml-1.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Founder</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
