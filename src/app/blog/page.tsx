import type { Metadata } from "next";
import { BlogIndexPage } from "@/features/blog/BlogIndexPage";
import { getBlogPageSettings } from "@/lib/cms/blog-page";
import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import { assetPath } from "@/lib/assets";
import { resolveSeoText } from "@/lib/seo/content";
import { getSettings } from "@/lib/cms/settings";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo/page-metadata";

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getBlogPageSettings();
  const { title, description } = resolveSeoText({
    title: page.seo_title, description: page.seo_description,
    fallbackTitle: "Blog | Casa Rosier Ceramica",
    fallbackDescription: "Articulos, procesos y reflexiones sobre ceramica, talleres, tecnicas y creacion en Casa Rosier Ceramica Barcelona.",
  });
  const settings = await getSettings();
  const image = assetPath(page.seo_image || settings.seo.default_og_image_url || DEFAULT_SOCIAL_IMAGE);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: await canonicalPublicPath("/blog") },
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

export default function BlogPage() {
  return <BlogIndexPage />;
}
