import type { Metadata } from "next";
import { ExperienceCollectionPage } from "@/features/experiences/ExperienceCollectionPage";
import { getExperienceCollectionConfig } from "@/features/experiences/experienceRoutes";

export const metadata: Metadata = {
  title: "Experiencias",
  description:
    "Experiencias privadas de ceramica de Casa Rosier en Barcelona.",
  alternates: { canonical: "/experiencias" },
};

export default async function ExperienciasPage() {
  const config = await getExperienceCollectionConfig("privateBookings");
  return <ExperienceCollectionPage config={config} />;
}
