import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> { return {
  title: "Gift Cards",
  description:
    "Gift cards de Casa Rosier para regalar experiencias de ceramica en Barcelona.",
  alternates: { canonical: await canonicalPublicPath("/gift-cards") },
}; }

export default async function GiftCardsPage() {
  const config = await getExperienceCollectionConfig("giftCards");
  return <ExperienceCollectionPage config={config} />;
}
