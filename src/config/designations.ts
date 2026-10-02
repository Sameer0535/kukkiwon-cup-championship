// ==============================================================================
// INITIAL DESIGNATIONS CONFIGURATION
// Configurable designation model as required by Section 9
// ==============================================================================

export interface DesignationItem {
  code: string;
  label: string;
  description: string;
  requiresKukkiwonId: boolean;
  requiresDocuments: boolean;
  displayOrder: number;
}

export const INITIAL_DESIGNATIONS: DesignationItem[] = [
  {
    code: "ATHLETE",
    label: "Athlete",
    description: "Competing participant across kyorugi, poomsae, or demonstration divisions",
    requiresKukkiwonId: false,
    requiresDocuments: true,
    displayOrder: 1,
  },
  {
    code: "COACH",
    label: "Coach",
    description: "Accredited academy or state team coach",
    requiresKukkiwonId: true,
    requiresDocuments: true,
    displayOrder: 2,
  },
  {
    code: "TECHNICAL_OFFICIAL",
    label: "Technical Official",
    description: "Technical committee member overseeing scoring, rules, and rings",
    requiresKukkiwonId: true,
    requiresDocuments: true,
    displayOrder: 3,
  },
  {
    code: "REFEREE",
    label: "Referee",
    description: "Licensed ring referee or corner judge",
    requiresKukkiwonId: true,
    requiresDocuments: true,
    displayOrder: 4,
  },
  {
    code: "JURY",
    label: "Jury",
    description: "Appeals jury member and supervisory official",
    requiresKukkiwonId: true,
    requiresDocuments: true,
    displayOrder: 5,
  },
  {
    code: "DOCTOR",
    label: "Doctor",
    description: "Certified sports medicine doctor or tournament physician",
    requiresKukkiwonId: false,
    requiresDocuments: true,
    displayOrder: 6,
  },
  {
    code: "MEDICAL_STAFF",
    label: "Medical Staff",
    description: "Paramedic, physiotherapist, or emergency response crew",
    requiresKukkiwonId: false,
    requiresDocuments: true,
    displayOrder: 7,
  },
  {
    code: "TEAM_MANAGER",
    label: "Team Manager",
    description: "Official team manager representing a participating dojang or state",
    requiresKukkiwonId: false,
    requiresDocuments: false,
    displayOrder: 8,
  },
  {
    code: "OFFICIAL",
    label: "Official",
    description: "Kukkiwon North India and Organizing Committee official",
    requiresKukkiwonId: false,
    requiresDocuments: false,
    displayOrder: 9,
  },
  {
    code: "OTHER",
    label: "Other",
    description: "Accredited media, security, or tournament guest",
    requiresKukkiwonId: false,
    requiresDocuments: false,
    displayOrder: 10,
  },
];

export function getDesignationByCode(code: string): DesignationItem | undefined {
  return INITIAL_DESIGNATIONS.find((d) => d.code.toUpperCase() === code.toUpperCase());
}
