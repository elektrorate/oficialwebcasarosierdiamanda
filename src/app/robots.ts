import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/cms/settings";
import { getAbsoluteSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 900;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const indexingEnabled = settings.seo.robots_index !== false;

  return {
    rules: indexingEnabled
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin/", "/api/", "/auth/"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: getAbsoluteSiteUrl("/sitemap.xml"),
  };
}
