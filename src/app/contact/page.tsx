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
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Contact Banner */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Communication & Support
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950">
              Tournament Secretariat
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Official inquiry desk for participating academies, coaches, technical delegations, and media.
            </p>
          </div>
        </section>

        {/* Contact Channels Grid */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Channel 1: Headquarters Email */}
              <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-4 text-center shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Official Email
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct communication with the organizing committee
                  </p>
                </div>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-xs font-bold text-blue-600 hover:underline block pt-2"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </div>

              {/* Channel 2: Telephone Helpline */}
              <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-4 text-center shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Official Helpline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monday to Saturday • 9:00 AM – 6:00 PM IST
                  </p>
                </div>
                <span className="text-xs font-bold text-cyan-600 block pt-2">
                  {SITE_CONFIG.contact.phone}
                </span>
              </div>

              {/* Channel 3: Stadium Venue Location */}
              <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-4 text-center shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Championship Venue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tournament venue & weigh-in center
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-700 block pt-2">
                  {SITE_CONFIG.contact.address}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 bg-white space-y-8 shadow-sm">
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Electronic Inquiry
                </span>
                <h2 className="text-xl sm:text-2xl font-bold uppercase text-slate-900">
                  Send a Message to the Organizing Committee
                </h2>
                <p className="text-xs text-slate-500">
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
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-700">
                      Inquiry Details
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Specify your inquiry regarding entry requirements, rules, or delegation logistics..."
                      className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto uppercase font-bold text-xs tracking-wider px-8 shadow-md shadow-blue-500/20"
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
