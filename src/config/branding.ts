// ==============================================================================
// BRANDING CONFIGURATION - KUKKIWON NORTH INDIA x KYORIX SPORT TECHNOLOGY
// Collaboration Platform - Standalone Production Branding
// ==============================================================================

export const BRANDING = {
  championshipName: "Kukkiwon Cup Championship",
  edition: "2026",
  tagline: "KUKKIWON INDIA NORTH BRANCH × KYORIX",
  
  // Organization 1: Kukkiwon India North Branch
  kukkiwon: {
    name: "Kukkiwon",
    branch: "India North Branch",
    title: "World Taekwondo Headquarters",
    logoPath: "/branding/kukkiwon-logo.jpg",
    accentColor: "#0066FF", // Royal Blue
    primaryColor: "#0A2540", // Deep Navy
  },

  // Organization 2: Kyorix Sports Technology
  kyorix: {
    name: "Kyorix",
    subtitle: "Sport Technology",
    logoPath: "/branding/kyorix-logo.png",
    accentColor: "#00E5FF", // Vibrant Cyan
    primaryColor: "#0066FF", // Royal Blue
  },

  // Combined Visual Identity
  theme: {
    primaryBackground: "#FFFFFF",
    cardBackground: "#FFFFFF",
    cardBorder: "#E2E8F0",
    goldGradient: "from-blue-600 via-blue-500 to-cyan-500",
    kyorixGradient: "from-blue-600 via-cyan-500 to-sky-400",
    heroGradient: "radial-gradient(ellipse at 50% 0%, rgba(0, 102, 255, 0.08), transparent 70%)",
  },
} as const;

export type BrandingConfig = typeof BRANDING;
