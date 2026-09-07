import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export const metadata: Metadata = {
  title: "Workshops de ceramica",
  description: "Workshops de ceramica de Casa Rosier en Barcelona.",
  alternates: { canonical: "/workshops" },
};

export default async function WorkshopsPage() {
  const config = await getExperienceCollectionConfig("workshops");
  return <ExperienceCollectionPage config={config} />;
}
