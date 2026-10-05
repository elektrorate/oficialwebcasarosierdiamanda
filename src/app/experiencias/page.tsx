import { collectionMetadata } from "@/lib/seo/collection-metadata";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> {
  return collectionMetadata("experiences");
}

export default async function ExperienciasPage() {
  const config = await getExperienceCollectionConfig("privateBookings");
  return <ExperienceCollectionPage config={config} />;
}
