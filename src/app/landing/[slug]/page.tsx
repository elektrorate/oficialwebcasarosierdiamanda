import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/features/landing-pages/LandingPageView";
import { getPublishedLandingPageBySlug } from "@/lib/cms/landing-pages";
import { assetPath } from "@/lib/assets";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) return {};
  return {
    title: landing.seo_title || landing.title,
    description: landing.seo_description || landing.hero_subtitle || landing.intro_text,
    openGraph: landing.seo_image ? { images: [assetPath(landing.seo_image)] } : undefined,
  };
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await getPublishedLandingPageBySlug(slug);
  if (!landing) notFound();
  return <LandingPageView landing={landing} />;
}
