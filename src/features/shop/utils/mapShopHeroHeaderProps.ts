import type { CmsHeroSettings } from "@/lib/cms/types";

export function mapShopHeroHeaderProps(hero: CmsHeroSettings, siteName = "Casa Rosier") {
  const heroVariant = hero.heroVariant ?? "text";
  const isImageLikeHero = heroVariant === "image" || heroVariant === "presentation";

  return {
    image: hero.heroImage || "/img/social-2.jpg",
    variant: heroVariant,
    hero,
    height: (isImageLikeHero ? "large" : "medium") as "large" | "medium",
    eyebrow: hero.heroSubtitle,
    title: hero.heroTitle || siteName,
    overlayTitle: isImageLikeHero,
  };
}
