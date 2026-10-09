import { Mail, Phone, MapPin, ArrowRight, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = {
  title: "Contact Us — ReviewMitra",
  description: "Get in touch with ReviewMitra. Direct email support at help.opensoz@gmail.com or request a demo call.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Mail size={12} className="mr-1.5" />
            Email Support
          </Badge>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Baat karo — hum sunenge
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Koi sawal hai? Demo chahiye? Ya help chahiye? Hum email pe jald se jald direct reply karte hain.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Contact methods */}
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900">Reach out to us</h2>

              <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow border-emerald-200 bg-emerald-50/30">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <Mail size={20} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Email Support (Fastest)</p>
                  <p className="text-sm text-slate-600 mt-1">Direct support and assistance for all ReviewMitra users.</p>
                  <Button size="sm" className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5" asChild>
                    <a href="mailto:help.opensoz@gmail.com">
                      <Mail size={13} /> help.opensoz@gmail.com
                    </a>
                  </Button>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Mail size={20} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Business & Partnerships</p>
                  <p className="text-sm text-slate-600 mt-1">For custom integrations, bulk MSME onboarding, or publisher inquiries.</p>
                  <a href="mailto:help.opensoz@gmail.com" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
                    help.opensoz@gmail.com
                  </a>
                </div>
              </Card>

              <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Book a Demo Walkthrough</p>
                  <p className="text-sm text-slate-600 mt-1">15-minute personal walkthrough of ReviewMitra dashboard and AI engine.</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" asChild>
                    <a href="mailto:help.opensoz@gmail.com?subject=ReviewMitra%20Demo%20Request">
                      <Mail size={13} /> Request Demo via Email
                    </a>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Contact form */}
            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-5">Send us a message</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Your Name
                  </label>
                  <Input id="contact-name" type="text" placeholder="Dr. Mehta" className="h-11" required />
                </div>
                <div>
                  <label htmlFor="contact-business" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Business Name
                  </label>
                  <Input id="contact-business" type="text" placeholder="Smile Dental Care" className="h-11" />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">+91</span>
                    <Input id="contact-phone" type="tel" placeholder="98765 43210" className="pl-12 h-11" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Mujhe ReviewMitra ke baare me jaanana hai..."
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 gap-2 shadow-sm font-semibold">
                  Send message
                  <ArrowRight size={16} />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
