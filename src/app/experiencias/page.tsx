import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> { return {
  title: "Experiencias",
  description:
    "Experiencias privadas de ceramica de Casa Rosier en Barcelona.",
  alternates: { canonical: await canonicalPublicPath("/experiencias") },
}; }

export default async function ExperienciasPage() {
  const config = await getExperienceCollectionConfig("privateBookings");
  return <ExperienceCollectionPage config={config} />;
}
