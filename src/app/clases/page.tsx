import { collectionMetadata } from "@/lib/seo/collection-metadata";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> {
  return collectionMetadata("classes");
}

export default async function ClassesPage() {
  const config = await getExperienceCollectionConfig("classes");
  return <ExperienceCollectionPage config={config} />;
}
