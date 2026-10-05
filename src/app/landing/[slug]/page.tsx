import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/features/landing-pages/LandingPageView";
import { getPublishedLandingPageBySlug } from "@/lib/cms/landing-pages";
import { getSettings } from "@/lib/cms/settings";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getSeoContentFields, resolveSeoText } from "@/lib/seo/content";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) return {};
  const { title, description } = resolveSeoText(getSeoContentFields("landing_page", landing));
  const settings = await getSettings();
  return pageMetadata({
    title,
    description,
    canonical: `/landing/${landing.slug}`,
    image: landing.seo_image,
    defaultImage: settings.seo.default_og_image_url,
    siteName: settings.site.site_name,
    language: settings.site.default_language,
  });
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) notFound();
  return <LandingPageView landing={landing} />;
}
