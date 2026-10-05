import { collectionMetadata } from "@/lib/seo/collection-metadata";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> {
  return collectionMetadata("giftCards");
}

export default async function GiftCardsPage() {
  const config = await getExperienceCollectionConfig("giftCards");
  return <ExperienceCollectionPage config={config} />;
}
