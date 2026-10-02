// ==============================================================================
// SITE CONFIGURATION
// ==============================================================================

export const SITE_CONFIG = {
  name: "Kukkiwon Cup Championship",
  shortName: "Kukkiwon Cup",
  description: "Official registration and credential platform for the Kukkiwon Cup Championship, presented by Kukkiwon North India and Kyorix Sports Technology.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/branding/kukkiwon-logo.jpg",
  links: {
    kukkiwonOfficial: "http://www.kukkiwon.or.kr",
    supportEmail: "info@kukkiwoncup.org",
  },
  contact: {
    email: "contact@kukkiwoncup.org",
    phone: "+91 98765 43210",
    address: "Kukkiwon India North Branch, New Delhi, India",
  },
  defaults: {
    currency: "INR",
    country: "India",
    termsVersion: "v1.0",
  },
} as const;
