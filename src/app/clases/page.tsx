import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export async function generateMetadata(): Promise<Metadata> { return {
  title: "Cursos y talleres de ceramica",
  description:
    "Listado de clases y workshops de Casa Rosier Ceramica en Barcelona.",
  alternates: { canonical: await canonicalPublicPath("/clases") },
}; }

export default async function ClassesPage() {
  const config = await getExperienceCollectionConfig("classes");
  return <ExperienceCollectionPage config={config} />;
}
