// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - OFFICIAL PUBLIC HOMEPAGE
// Presented by Kukkiwon India North Branch x Kyorix Sports Technology
// Modern White & Blue Corporate Sports Federation Architecture
// ==============================================================================

import {
  getPublicChampionshipData,
  getPublicChampionshipPackage,
  getPublicImportantDates,
} from "@/lib/cms";
import { LiveHomePage } from "@/components/public/live-homepage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const pkg = await getPublicChampionshipPackage("kukkiwon-cup-2026");
  const tournament = await getPublicChampionshipData("kukkiwon-cup-2026");
  const champId = pkg?.championship.id || "champ-kukkiwon-2026";
  const dynamicDates = await getPublicImportantDates(champId);

  return (
    <LiveHomePage
      initialTournament={tournament}
      initialPackage={pkg}
      dynamicDates={dynamicDates}
    />
  );
}
