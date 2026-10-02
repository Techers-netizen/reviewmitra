import type { Metadata } from "next";
import { Star, Heart, Sparkles, ArrowRight, MessageCircle, Globe, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — ReviewMitra",
  description: "ReviewMitra is built in India, for India. Our mission: help every local business owner manage reviews and grow their reputation effortlessly.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Heart size={12} className="mr-1.5 fill-emerald-600" />
            Made in Bharat 🇮🇳
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Bharat ke local businesses ko{" "}
            <span className="text-emerald-600">digital success</span> dena
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            ReviewMitra ek mission ke saath bana hai: har clinic owner, salon owner, gym owner, restaurant owner ko modern review management tools dena — jo affordable ho aur samajhne me easy.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Hamara Mission",
                desc: "India me 6+ crore MSMEs hain. Inme se zyada tar ke paas na tech team hai, na marketing budget. ReviewMitra unke liye hai — simple, affordable, powerful.",
              },
              {
                icon: Globe,
                title: "India-First Approach",
                desc: "Hinglish replies, ₹499 pricing, WhatsApp support, UPI payments — sab kuch Indian business owner ke workflow ke hisaab se design kiya gaya hai.",
              },
              {
                icon: Users,
                title: "Founder-Led Support",
                desc: "Koi ticket system nahi, koi automated chatbot nahi. Aap directly founder se WhatsApp pe baat kar sakte hain. Personally har query handle hoti hai.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-6">
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

      {/* Why we built this */}
      <section className="py-16 border-t bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">
            Kyun banaya ReviewMitra?
          </h2>
          <Card className="p-6 sm:p-8">
            <p className="text-sm text-slate-700 leading-relaxed">
              &ldquo;Maine apne dentist friend ko dekha — roz subah Google aur Justdial check karte the. Ek ek review ka reply likhte the. Negative review aata tha to pura mood kharab. Unhone bola — &apos;yaar koi tool hai jo mere liye reply likh de?&apos;
            </p>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              Maine Birdeye aur Podium dekha — $299/month! Indian MSME ke liye ye afford karna impossible hai. Tab socha — kyun na India ke liye ek affordable, Hinglish-native, simple tool banayein?
            </p>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              ReviewMitra yehi hai — Indian business owners ke liye, Indian prices pe, Indian languages me.&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                F
              </span>
              <div>
                <p className="font-semibold text-sm text-slate-900">Founder</p>
                <p className="text-xs text-slate-500">ReviewMitra</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Try karo — 7 din free.</h2>
          <p className="mt-2 text-sm text-slate-600">Koi commitment nahi. Cancel anytime.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-md" asChild>
              <Link href="/signup">Start free trial <ArrowRight size={16} /></Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> Chat with founder
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
