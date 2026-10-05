import { collectionMetadata } from "@/lib/seo/collection-metadata";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> {
  return collectionMetadata("workshops");
}

export default async function WorkshopsPage() {
  const config = await getExperienceCollectionConfig("workshops");
  return <ExperienceCollectionPage config={config} />;
}
