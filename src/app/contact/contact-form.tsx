"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Send } from "lucide-react";

export function ContactInquiryForm() {
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
  );
}
