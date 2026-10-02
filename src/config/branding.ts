// ==============================================================================
// BRANDING CONFIGURATION - KUKKIWON NORTH INDIA x KYORIX SPORT TECHNOLOGY
// Collaboration Platform - Standalone Production Branding
// ==============================================================================

export const BRANDING = {
  championshipName: "Kukkiwon Cup Championship",
  edition: "2026",
  tagline: "World Taekwondo Headquarters India North Branch x Kyorix Sports Technology",
  
  // Organization 1: Kukkiwon India North Branch
  kukkiwon: {
    name: "Kukkiwon",
    branch: "India North Branch",
    title: "World Taekwondo Headquarters",
    logoPath: "/branding/kukkiwon-logo.jpg",
    accentColor: "#D4AF37", // Kukkiwon Gold
    primaryColor: "#0A2540", // Deep Kukkiwon Navy
  },

  // Organization 2: Kyorix Sports Technology
  kyorix: {
    name: "Kyorix",
    subtitle: "Sport Technology",
    logoPath: "/branding/kyorix-logo.png",
    accentColor: "#00E5FF", // Vibrant Cyan
    primaryColor: "#0F172A", // Slate Dark
  },

  // Combined Visual Identity
  theme: {
    primaryBackground: "#090D16",
    cardBackground: "#111827",
    cardBorder: "#1F2937",
    goldGradient: "from-amber-400 via-amber-500 to-yellow-600",
    kyorixGradient: "from-cyan-400 via-sky-500 to-blue-600",
    heroGradient: "radial-gradient(ellipse at 50% 0%, rgba(14, 165, 233, 0.15), transparent 70%)",
  },
} as const;

export type BrandingConfig = typeof BRANDING;
