import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import { getStudioPageSettings } from "@/lib/cms/studio-page";
import { assetPath } from "@/lib/assets";
import type { Metadata } from "next";
import { StudioPage as StudioScreen } from "@/features/studio/StudioPage";

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStudioPageSettings();
  const title = page.seo_title || "El estudio | Casa Rosier Ceramica";
  const description =
    page.seo_description ||
    "Conoce el estudio de ceramica Casa Rosier en Barcelona: un espacio para aprender, practicar y desarrollar proyectos con arcilla, torno, modelado y esmaltes.";
  const image = page.seo_image ? assetPath(page.seo_image) : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: await canonicalPublicPath("/el-estudio") },
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function StudioPage() {
  return <StudioScreen />;
}
