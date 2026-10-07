// ==============================================================================
// CONTACT PAGE - TOURNAMENT SECRETARIAT (Requirements 5 & 15)
// Official Tournament Inquiries, Venue Location & Communication Channels
// ==============================================================================

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { SITE_CONFIG } from "@/config/site";
import { getPublicChampionshipData } from "@/lib/cms";
import { MapPin, Mail, Phone } from "lucide-react";
import { ContactInquiryForm } from "./contact-form";

export default async function ContactPage() {
  const tournament = await getPublicChampionshipData();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Contact Banner */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              {tournament.contactTagline || "Communication & Support"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950">
              {tournament.contactHeading || "Tournament Secretariat"}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {tournament.contactDescription ||
                "Official inquiry desk for participating academies, coaches, technical delegations, and media."}
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
                  href={`mailto:${tournament.contactEmail || SITE_CONFIG.contact.email}`}
                  className="text-xs font-bold text-blue-600 hover:underline block pt-2"
                >
                  {tournament.contactEmail || SITE_CONFIG.contact.email}
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
                    {tournament.contactPhoneHours || "Monday to Saturday • 9:00 AM – 6:00 PM IST"}
                  </p>
                </div>
                <span className="text-xs font-bold text-cyan-600 block pt-2">
                  {tournament.contactPhone || SITE_CONFIG.contact.phone}
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
                  {tournament.contactAddress || tournament.venue || SITE_CONFIG.contact.address}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <ContactInquiryForm />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
