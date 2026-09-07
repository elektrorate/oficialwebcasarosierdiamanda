import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/cms/blog";
import { getLandingPages } from "@/lib/cms/landing-pages";
import { getOfferings, isPubliclyVisibleOffering } from "@/lib/cms/offerings";
import { getProducts } from "@/lib/cms/products";
import { getAbsoluteSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 900;

const STATIC_ROUTES = [
  "/",
  "/clases",
  "/workshops",
  "/experiencias",
  "/gift-cards",
  "/el-estudio",
  "/blog",
  "/shop",
  "/politica-privacidad",
] as const;

function offeringPath(type: string, slug: string) {
  if (type === "workshop") return `/workshops/${slug}`;
  if (type === "experience") return `/experiencias/${slug}`;
  if (type === "gift_card") return `/gift-cards/${slug}`;
  return `/clases/${slug}`;
}

function validLastModified(value: string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [offerings, blogPosts, products, landingPages] = await Promise.all([
    getOfferings(),
    getBlogPosts(),
    getProducts(),
    getLandingPages(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((pathname) => ({
    url: getAbsoluteSiteUrl(pathname),
    changeFrequency: pathname === "/" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : 0.7,
  }));

  for (const offering of offerings.filter((item) => isPubliclyVisibleOffering(item))) {
    entries.push({
      url: getAbsoluteSiteUrl(offeringPath(offering.type, offering.slug)),
      lastModified: validLastModified(offering.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const post of blogPosts.filter((item) => item.status === "published" && !item.deleted_at)) {
    entries.push({
      url: getAbsoluteSiteUrl(`/blog/${post.slug}`),
      lastModified: validLastModified(post.updated_at || post.published_at),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const product of products.filter((item) => item.status === "published" && !item.deleted_at)) {
    entries.push({
      url: getAbsoluteSiteUrl(`/shop/${product.slug}`),
      lastModified: validLastModified(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const landingPage of landingPages.filter((item) => item.status === "published" && !item.deleted_at)) {
    entries.push({
      url: getAbsoluteSiteUrl(`/landing/${landingPage.slug}`),
      lastModified: validLastModified(landingPage.updated_at),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
