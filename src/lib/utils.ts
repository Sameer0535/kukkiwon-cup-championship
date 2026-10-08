// ==============================================================================
// UTILITIES
// Class merges, ID generation, date & currency formatters
// ==============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates non-sequential, non-guessable Public Participant IDs
 * Format: KUKKI-[YEAR]-[CHARACTERS], e.g. KUKKI-2026-X8F9Q
 */
export function generatePublicParticipantId(year = "2026"): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `KUKKI-${year}-${randomPart}`;
}

/**
 * Generates unique registration number
 * Format: REG-KC[YY]-[RANDOM], e.g. REG-KC26-9281A
 */
export function generateRegistrationNumber(shortCode = "KC26"): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-${shortCode}-${random}`;
}

/**
 * Generates human-readable athlete registration reference
 * Format: KKC26-ATH-[6-DIGIT-RANDOM], e.g. KKC26-ATH-049812
 */
export function generateAthleteRegNumber(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-ATH-${random}`;
}

/**
 * Generates human-readable coach registration reference
 * Format: KKC26-COA-[6-DIGIT-RANDOM], e.g. KKC26-COA-012938
 */
export function generateCoachRegNumber(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-COA-${random}`;
}

/**
 * Generates human-readable academy code
 * Format: KKC26-ACA-[6-DIGIT-RANDOM], e.g. KKC26-ACA-001042
 */
export function generateAcademyCode(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-ACA-${random}`;
}

/**
 * Calculates current age from a Date or ISO string
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}


/**
 * Formats currency values in INR or USD
 */
export function formatCurrency(amount: number | string, currency = "INR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0.00`;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats dates into human-readable tournament dates
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "TBD";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "TBD";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Official World Taekwondo & IOC 3-Letter Country Code and Flag Resolver
 * Standardizes 2-letter ISO codes, full country names, and common variants into
 * official 3-letter World Taekwondo (WT) / Olympic (IOC) designations.
 */
export interface WorldTaekwondoCountry {
  code: string; // 3-letter IOC/WT code (e.g. IND, KOR, USA, BAN, SRI, MAS)
  name: string; // Official English country name
  flag: string; // Flag emoji
  iso2: string; // 2-letter ISO country code for flag image (e.g. in, kr, us, bd)
  flagUrl: string; // Flag CDN image url
}

const WT_CODE_TO_ISO2: Record<string, string> = {
  IND: "in",
  KOR: "kr",
  USA: "us",
  GBR: "gb",
  NEP: "np",
  BHU: "bt",
  BAN: "bd",
  SRI: "lk",
  UAE: "ae",
  SGP: "sg",
  MAS: "my",
  THA: "th",
  VIE: "vn",
  JPN: "jp",
  AUS: "au",
  CAN: "ca",
  GER: "de",
  FRA: "fr",
  ITA: "it",
  ESP: "es",
  TUR: "tr",
  IRI: "ir",
  UZB: "uz",
  CHN: "cn",
  TPE: "tw",
  PAK: "pk",
  AFG: "af",
};


const WT_COUNTRY_MAP: Record<string, { code: string; name: string; flag: string }> = {
  // India
  IN: { code: "IND", name: "India", flag: "🇮🇳" },
  IND: { code: "IND", name: "India", flag: "🇮🇳" },
  INDIA: { code: "IND", name: "India", flag: "🇮🇳" },
  INDIAN: { code: "IND", name: "India", flag: "🇮🇳" },

  // South Korea
  KR: { code: "KOR", name: "South Korea", flag: "🇰🇷" },
  KOR: { code: "KOR", name: "South Korea", flag: "🇰🇷" },
  KOREA: { code: "KOR", name: "South Korea", flag: "🇰🇷" },
  "SOUTH KOREA": { code: "KOR", name: "South Korea", flag: "🇰🇷" },
  "REPUBLIC OF KOREA": { code: "KOR", name: "South Korea", flag: "🇰🇷" },

  // United States
  US: { code: "USA", name: "United States", flag: "🇺🇸" },
  USA: { code: "USA", name: "United States", flag: "🇺🇸" },
  "UNITED STATES": { code: "USA", name: "United States", flag: "🇺🇸" },
  "UNITED STATES OF AMERICA": { code: "USA", name: "United States", flag: "🇺🇸" },
  AMERICA: { code: "USA", name: "United States", flag: "🇺🇸" },

  // Great Britain / United Kingdom
  GB: { code: "GBR", name: "Great Britain", flag: "🇬🇧" },
  UK: { code: "GBR", name: "Great Britain", flag: "🇬🇧" },
  GBR: { code: "GBR", name: "Great Britain", flag: "🇬🇧" },
  "UNITED KINGDOM": { code: "GBR", name: "Great Britain", flag: "🇬🇧" },
  "GREAT BRITAIN": { code: "GBR", name: "Great Britain", flag: "🇬🇧" },
  BRITISH: { code: "GBR", name: "Great Britain", flag: "🇬🇧" },

  // Nepal
  NP: { code: "NEP", name: "Nepal", flag: "🇳🇵" },
  NEP: { code: "NEP", name: "Nepal", flag: "🇳🇵" },
  NEPAL: { code: "NEP", name: "Nepal", flag: "🇳🇵" },
  NEPALESE: { code: "NEP", name: "Nepal", flag: "🇳🇵" },

  // Bhutan
  BT: { code: "BHU", name: "Bhutan", flag: "🇧🇹" },
  BHU: { code: "BHU", name: "Bhutan", flag: "🇧🇹" },
  BHUTAN: { code: "BHU", name: "Bhutan", flag: "🇧🇹" },
  BHUTANESE: { code: "BHU", name: "Bhutan", flag: "🇧🇹" },

  // Bangladesh (WT / IOC standard: BAN)
  BD: { code: "BAN", name: "Bangladesh", flag: "🇧🇩" },
  BAN: { code: "BAN", name: "Bangladesh", flag: "🇧🇩" },
  BGD: { code: "BAN", name: "Bangladesh", flag: "🇧🇩" },
  BANGLADESH: { code: "BAN", name: "Bangladesh", flag: "🇧🇩" },
  BANGLADESHI: { code: "BAN", name: "Bangladesh", flag: "🇧🇩" },

  // Sri Lanka (WT / IOC standard: SRI)
  LK: { code: "SRI", name: "Sri Lanka", flag: "🇱🇰" },
  SRI: { code: "SRI", name: "Sri Lanka", flag: "🇱🇰" },
  LKA: { code: "SRI", name: "Sri Lanka", flag: "🇱🇰" },
  "SRI LANKA": { code: "SRI", name: "Sri Lanka", flag: "🇱🇰" },
  "SRI LANKAN": { code: "SRI", name: "Sri Lanka", flag: "🇱🇰" },

  // UAE
  AE: { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },
  ARE: { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },
  UAE: { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },
  "UNITED ARAB EMIRATES": { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },
  EMIRATES: { code: "UAE", name: "United Arab Emirates", flag: "🇦🇪" },

  // Singapore
  SG: { code: "SGP", name: "Singapore", flag: "🇸🇬" },
  SGP: { code: "SGP", name: "Singapore", flag: "🇸🇬" },
  SIN: { code: "SGP", name: "Singapore", flag: "🇸🇬" },
  SINGAPORE: { code: "SGP", name: "Singapore", flag: "🇸🇬" },

  // Malaysia (WT / IOC standard: MAS)
  MY: { code: "MAS", name: "Malaysia", flag: "🇲🇾" },
  MAS: { code: "MAS", name: "Malaysia", flag: "🇲🇾" },
  MYS: { code: "MAS", name: "Malaysia", flag: "🇲🇾" },
  MALAYSIA: { code: "MAS", name: "Malaysia", flag: "🇲🇾" },

  // Thailand
  TH: { code: "THA", name: "Thailand", flag: "🇹🇭" },
  THA: { code: "THA", name: "Thailand", flag: "🇹🇭" },
  THAILAND: { code: "THA", name: "Thailand", flag: "🇹🇭" },

  // Vietnam
  VN: { code: "VIE", name: "Vietnam", flag: "🇻🇳" },
  VIE: { code: "VIE", name: "Vietnam", flag: "🇻🇳" },
  VNM: { code: "VIE", name: "Vietnam", flag: "🇻🇳" },
  VIETNAM: { code: "VIE", name: "Vietnam", flag: "🇻🇳" },

  // Japan
  JP: { code: "JPN", name: "Japan", flag: "🇯🇵" },
  JPN: { code: "JPN", name: "Japan", flag: "🇯🇵" },
  JAPAN: { code: "JPN", name: "Japan", flag: "🇯🇵" },

  // Australia
  AU: { code: "AUS", name: "Australia", flag: "🇦🇺" },
  AUS: { code: "AUS", name: "Australia", flag: "🇦🇺" },
  AUSTRALIA: { code: "AUS", name: "Australia", flag: "🇦🇺" },

  // Canada
  CA: { code: "CAN", name: "Canada", flag: "🇨🇦" },
  CAN: { code: "CAN", name: "Canada", flag: "🇨🇦" },
  CANADA: { code: "CAN", name: "Canada", flag: "🇨🇦" },

  // Germany
  DE: { code: "GER", name: "Germany", flag: "🇩🇪" },
  GER: { code: "GER", name: "Germany", flag: "🇩🇪" },
  DEU: { code: "GER", name: "Germany", flag: "🇩🇪" },
  GERMANY: { code: "GER", name: "Germany", flag: "🇩🇪" },

  // France
  FR: { code: "FRA", name: "France", flag: "🇫🇷" },
  FRA: { code: "FRA", name: "France", flag: "🇫🇷" },
  FRANCE: { code: "FRA", name: "France", flag: "🇫🇷" },

  // Italy
  IT: { code: "ITA", name: "Italy", flag: "🇮🇹" },
  ITA: { code: "ITA", name: "Italy", flag: "🇮🇹" },
  ITALY: { code: "ITA", name: "Italy", flag: "🇮🇹" },

  // Spain
  ES: { code: "ESP", name: "Spain", flag: "🇪🇸" },
  ESP: { code: "ESP", name: "Spain", flag: "🇪🇸" },
  SPAIN: { code: "ESP", name: "Spain", flag: "🇪🇸" },

  // Philippines
  PH: { code: "PHI", name: "Philippines", flag: "🇵🇭" },
  PHI: { code: "PHI", name: "Philippines", flag: "🇵🇭" },
  PHILIPPINES: { code: "PHI", name: "Philippines", flag: "🇵🇭" },

  // Chinese Taipei
  TW: { code: "TPE", name: "Chinese Taipei", flag: "🇹🇼" },
  TPE: { code: "TPE", name: "Chinese Taipei", flag: "🇹🇼" },
  TAIWAN: { code: "TPE", name: "Chinese Taipei", flag: "🇹🇼" },

  // Iran
  IR: { code: "IRI", name: "Iran", flag: "🇮🇷" },
  IRI: { code: "IRI", name: "Iran", flag: "🇮🇷" },
  IRAN: { code: "IRI", name: "Iran", flag: "🇮🇷" },

  // Kazakhstan
  KZ: { code: "KAZ", name: "Kazakhstan", flag: "🇰🇿" },
  KAZ: { code: "KAZ", name: "Kazakhstan", flag: "🇰🇿" },
  KAZAKHSTAN: { code: "KAZ", name: "Kazakhstan", flag: "🇰🇿" },

  // Uzbekistan
  UZ: { code: "UZB", name: "Uzbekistan", flag: "UZB" },
  UZB: { code: "UZB", name: "Uzbekistan", flag: "🇺🇿" },
  UZBEKISTAN: { code: "UZB", name: "Uzbekistan", flag: "🇺🇿" },

  // Mexico
  MX: { code: "MEX", name: "Mexico", flag: "🇲🇽" },
  MEX: { code: "MEX", name: "Mexico", flag: "🇲🇽" },
  MEXICO: { code: "MEX", name: "Mexico", flag: "🇲🇽" },

  // Brazil
  BR: { code: "BRA", name: "Brazil", flag: "🇧🇷" },
  BRA: { code: "BRA", name: "Brazil", flag: "🇧🇷" },
  BRAZIL: { code: "BRA", name: "Brazil", flag: "🇧🇷" },

  // Egypt
  EG: { code: "EGY", name: "Egypt", flag: "🇪🇬" },
  EGY: { code: "EGY", name: "Egypt", flag: "🇪🇬" },
  EGYPT: { code: "EGY", name: "Egypt", flag: "🇪🇬" },

  // Turkey
  TR: { code: "TUR", name: "Turkey", flag: "🇹🇷" },
  TUR: { code: "TUR", name: "Turkey", flag: "🇹🇷" },
  TURKEY: { code: "TUR", name: "Turkey", flag: "🇹🇷" },
  TÜRKIYE: { code: "TUR", name: "Turkey", flag: "🇹🇷" },

  // Jordan
  JO: { code: "JOR", name: "Jordan", flag: "🇯🇴" },
  JOR: { code: "JOR", name: "Jordan", flag: "🇯🇴" },
  JORDAN: { code: "JOR", name: "Jordan", flag: "🇯🇴" },

  // China
  CN: { code: "CHN", name: "China", flag: "🇨🇳" },
  CHN: { code: "CHN", name: "China", flag: "🇨🇳" },
  CHINA: { code: "CHN", name: "China", flag: "🇨🇳" },

  // Indonesia
  ID: { code: "INA", name: "Indonesia", flag: "🇮🇩" },
  INA: { code: "INA", name: "Indonesia", flag: "🇮🇩" },
  INDONESIA: { code: "INA", name: "Indonesia", flag: "🇮🇩" },

  // Pakistan
  PK: { code: "PAK", name: "Pakistan", flag: "🇵🇰" },
  PAK: { code: "PAK", name: "Pakistan", flag: "🇵🇰" },
  PAKISTAN: { code: "PAK", name: "Pakistan", flag: "🇵🇰" },

  // Afghanistan
  AF: { code: "AFG", name: "Afghanistan", flag: "🇦🇫" },
  AFG: { code: "AFG", name: "Afghanistan", flag: "🇦🇫" },
  AFGHANISTAN: { code: "AFG", name: "Afghanistan", flag: "🇦🇫" },
};

export function toWorldTaekwondoCountryCode(val?: string | null): WorldTaekwondoCountry {
  if (!val || !val.trim()) {
    return {
      code: "IND",
      name: "India",
      flag: "🇮🇳",
      iso2: "in",
      flagUrl: "https://flagcdn.com/w40/in.png",
    };
  }
  const clean = val.trim().toUpperCase();
  let matched: { code: string; name: string; flag: string } | null = null;

  if (WT_COUNTRY_MAP[clean]) {
    matched = WT_COUNTRY_MAP[clean];
  } else if (clean.length === 3) {
    matched = { code: clean, name: val.trim(), flag: "🌐" };
  } else {
    for (const [key, item] of Object.entries(WT_COUNTRY_MAP)) {
      if (key.length >= 3 && (clean.includes(key) || key.includes(clean))) {
        matched = item;
        break;
      }
    }
  }

  if (!matched) {
    matched = { code: clean.slice(0, 3).padEnd(3, "X"), name: val.trim(), flag: "🌐" };
  }

  const iso2 = WT_CODE_TO_ISO2[matched.code] || matched.code.slice(0, 2).toLowerCase();
  return {
    ...matched,
    iso2,
    flagUrl: `https://flagcdn.com/w40/${iso2}.png`,
  };
}
