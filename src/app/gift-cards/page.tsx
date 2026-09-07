import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export const metadata: Metadata = {
  title: "Gift Cards",
  description:
    "Gift cards de Casa Rosier para regalar experiencias de ceramica en Barcelona.",
  alternates: { canonical: "/gift-cards" },
};

export default async function GiftCardsPage() {
  const config = await getExperienceCollectionConfig("giftCards");
  return <ExperienceCollectionPage config={config} />;
}
