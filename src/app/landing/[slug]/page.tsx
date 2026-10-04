import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/features/landing-pages/LandingPageView";
import { getPublishedLandingPageBySlug } from "@/lib/cms/landing-pages";
import { assetPath } from "@/lib/assets";
import { getSeoContentFields, resolveSeoText } from "@/lib/seo/content";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) return {};
  const { title, description } = resolveSeoText(getSeoContentFields("landing_page", landing));
  return {
    title,
    description,
    alternates: { canonical: `/landing/${landing.slug}` },
    openGraph: landing.seo_image ? { images: [assetPath(landing.seo_image)] } : undefined,
  };
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) notFound();
  return <LandingPageView landing={landing} />;
}
