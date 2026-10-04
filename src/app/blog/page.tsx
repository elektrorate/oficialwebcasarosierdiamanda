import type { Metadata } from "next";
import { BlogIndexPage } from "@/features/blog/BlogIndexPage";
import { getBlogPageSettings } from "@/lib/cms/blog-page";
import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import { assetPath } from "@/lib/assets";

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getBlogPageSettings();
  const title = page.seo_title || "Blog | Casa Rosier Ceramica";
  const description =
    page.seo_description ||
    "Articulos, procesos y reflexiones sobre ceramica, talleres, tecnicas y creacion en Casa Rosier Ceramica Barcelona.";
  const image = page.seo_image ? assetPath(page.seo_image) : undefined;

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
