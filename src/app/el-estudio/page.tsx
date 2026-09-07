import type { Metadata } from "next";
import { StudioPage as StudioScreen } from "@/features/studio/StudioPage";

export const revalidate = 900;

export const metadata: Metadata = {
  title: { absolute: "El estudio | Casa Rosier Ceramica" },
  description:
    "Conoce el estudio de ceramica Casa Rosier en Barcelona: un espacio para aprender, practicar y desarrollar proyectos con arcilla, torno, modelado y esmaltes.",
  alternates: { canonical: "/el-estudio" },
};

export default function StudioPage() {
  return <StudioScreen />;
}
