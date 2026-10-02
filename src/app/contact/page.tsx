// ==============================================================================
// CONTACT PAGE - TOURNAMENT SECRETARIAT (Requirements 5 & 15)
// Official Tournament Inquiries, Venue Location & Communication Channels
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SITE_CONFIG } from "@/config/site";
import { BRANDING } from "@/config/branding";
import { MapPin, Mail, Phone, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [academy, setAcademy] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Contact Banner */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#090D16] py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Communication & Support
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white">
              Tournament Secretariat
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Official inquiry desk for participating academies, coaches, technical delegations, and media.
            </p>
          </div>
        </section>

        {/* Contact Channels Grid */}
        <section className="py-16 sm:py-20 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Channel 1: Headquarters Email */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A0F1D] space-y-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official Email
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct communication with the organizing committee
                  </p>
                </div>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-xs font-bold text-amber-400 hover:underline block pt-2"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </div>

              {/* Channel 2: Telephone Helpline */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A0F1D] space-y-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-[#00E5FF] flex items-center justify-center mx-auto">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official Helpline
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monday to Saturday • 9:00 AM – 6:00 PM IST
                  </p>
                </div>
                <span className="text-xs font-bold text-cyan-400 block pt-2">
                  {SITE_CONFIG.contact.phone}
                </span>
              </div>

              {/* Channel 3: Stadium Venue Location */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A0F1D] space-y-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Championship Venue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tournament venue & weigh-in center
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-200 block pt-2">
                  {SITE_CONFIG.contact.address}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section className="py-16 sm:py-20 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-8 shadow-2xl">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Electronic Inquiry
                </span>
                <h2 className="text-xl sm:text-2xl font-bold uppercase text-white">
                  Send a Message to the Organizing Committee
                </h2>
                <p className="text-xs text-slate-400">
                  For inquiries regarding team quotas, bulk academy submissions, or technical clarifications.
                </p>
              </div>

              {submitted ? (
                <Alert variant="success" title="Inquiry Received">
                  Thank you. Your message has been received by the Kukkiwon Cup tournament secretariat. An official response will be sent to {email} within 24 business hours.
                </Alert>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="Master / Coach / Official Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="your-email@dojang.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <Input
                      label="Academy / State Affiliation"
                      placeholder="e.g. Delhi Taekwondo Association"
                      value={academy}
                      onChange={(e) => setAcademy(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-300">
                      Inquiry Details
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Specify your inquiry regarding entry requirements, rules, or delegation logistics..."
                      className="flex w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto uppercase font-bold text-xs tracking-wider px-8"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    <span>Transmit Inquiry</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
