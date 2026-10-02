// ==============================================================================
// NATIONALITIES & ISO COUNTRY CONFIGURATION
// Structured country data for flag display and ID cards (Requirement 10)
// ==============================================================================

export interface NationalityItem {
  name: string;
  isoCode: string;   // ISO 3166-1 alpha-3
  isoAlpha2: string; // ISO 3166-1 alpha-2
  flag: string;      // Emoji or identifier
}

export const INITIAL_NATIONALITIES: NationalityItem[] = [
  { name: "India", isoCode: "IND", isoAlpha2: "IN", flag: "🇮🇳" },
  { name: "South Korea", isoCode: "KOR", isoAlpha2: "KR", flag: "🇰🇷" },
  { name: "Nepal", isoCode: "NEP", isoAlpha2: "NP", flag: "🇳🇵" },
  { name: "Bhutan", isoCode: "BHU", isoAlpha2: "BT", flag: "🇧🇹" },
  { name: "Sri Lanka", isoCode: "SRI", isoAlpha2: "LK", flag: "🇱🇰" },
  { name: "Bangladesh", isoCode: "BAN", isoAlpha2: "BD", flag: "🇧🇩" },
  { name: "United States", isoCode: "USA", isoAlpha2: "US", flag: "🇺🇸" },
  { name: "United Kingdom", isoCode: "GBR", isoAlpha2: "GB", flag: "🇬🇧" },
  { name: "Australia", isoCode: "AUS", isoAlpha2: "AU", flag: "🇦🇺" },
  { name: "Japan", isoCode: "JPN", isoAlpha2: "JP", flag: "🇯🇵" },
  { name: "Thailand", isoCode: "THA", isoAlpha2: "TH", flag: "🇹🇭" },
  { name: "Malaysia", isoCode: "MAS", isoAlpha2: "MY", flag: "🇲🇾" },
  { name: "Iran", isoCode: "IRI", isoAlpha2: "IR", flag: "🇮🇷" },
  { name: "United Arab Emirates", isoCode: "UAE", isoAlpha2: "AE", flag: "🇦🇪" },
  { name: "Canada", isoCode: "CAN", isoAlpha2: "CA", flag: "🇨🇦" },
  { name: "Germany", isoCode: "GER", isoAlpha2: "DE", flag: "🇩🇪" },
  { name: "France", isoCode: "FRA", isoAlpha2: "FR", flag: "🇫🇷" },
  { name: "Uzbekistan", isoCode: "UZB", isoAlpha2: "UZ", flag: "🇺🇿" },
  { name: "Chinese Taipei", isoCode: "TPE", isoAlpha2: "TW", flag: "🇹🇼" },
  { name: "Philippines", isoCode: "PHI", isoAlpha2: "PH", flag: "🇵🇭" },
];

export function getNationalityByCode(code: string): NationalityItem | undefined {
  return INITIAL_NATIONALITIES.find(
    (n) => n.isoCode.toUpperCase() === code.toUpperCase() || n.isoAlpha2.toUpperCase() === code.toUpperCase()
  );
}
