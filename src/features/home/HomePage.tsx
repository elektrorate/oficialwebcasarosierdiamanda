import { FeaturedSection } from "@/components/home/FeaturedSection";
import { IntroSlider } from "@/components/home/IntroSlider";
import { HeaderHome } from "@/components/layout/HeaderHome";
import { PromoEntry } from "@/components/ui/PromoEntry";
import {
  mapCmsTestimonialsToSlides,
  TestimonialSlider,
} from "@/components/home/testimonial-slider";
import type { GiftCardItem } from "@/data/types";
import { getPublicExperienceItems } from "@/features/experiences/experienceDetailRouting";
import { HomeGiftCardSection } from "@/features/home/HomeGiftCardSection";
import { IdeaPromptSection } from "@/features/shared/contextual-sections/IdeaPromptSection";
import { SitePage } from "@/features/shared/layout/SitePage";
import { getHomePageSettings } from "@/lib/cms/home-page";
import { getPublicHomeContent } from "@/lib/cms/public-content";

function pickHomeItems<T extends { id: string }>(
  items: T[],
  selectedIds: string[],
) {
  const selected = new Set(selectedIds);
  return items
    .filter((item) => selected.has(item.id))
    .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
}

export async function HomePage() {
  const [
    { promoBanner, testimonials: cmsTestimonials },
    experienceItems,
    homePage,
  ] = await Promise.all([
    getPublicHomeContent(),
    getPublicExperienceItems(),
    getHomePageSettings(),
  ]);
  const classes = experienceItems.filter((item) => item.kind === "class");
  const workshops = experienceItems.filter((item) => item.kind === "workshop");
  const giftCards = experienceItems.filter(
    (item): item is GiftCardItem => item.kind === "gift-card",
  );
  const homeClasses = pickHomeItems(classes, homePage.classesFeaturedIds);
  const homeWorkshops = pickHomeItems(workshops, homePage.workshopsFeaturedIds);
  const homeGiftCards = pickHomeItems(giftCards, homePage.giftFeaturedIds);
  const testimonials = mapCmsTestimonialsToSlides(cmsTestimonials);

  return (
    <SitePage
      bodyClass=""
      beforeHeader={
        <PromoEntry
          promo={
            promoBanner
              ? {
                  keyText: promoBanner.key_text || "Plazas limitadas",
                  title: promoBanner.title,
                  text:
                    promoBanner.text ||
                    "Ven a probar el torno, tocar la arcilla y crear una pieza en el taller.",
                  detailText:
                    promoBanner.detail_text ||
                    "No necesitas experiencia previa. Solo ganas de venir al taller y probar algo distinto.",
                  imageUrl:
                    promoBanner.image_url || "/img/1766778567125-t8t5rt.png",
                  buttonText: promoBanner.button_text || "Reservar plaza",
                  href: promoBanner.link_url || "/clases",
                }
              : null
          }
        />
      }
      header={<HeaderHome />}
    >
      <h1 className="sr-only">Casa Rosier, estudio de cerámica en Barcelona</h1>
      <IntroSlider slides={homePage.introSlides} />
      {homeClasses.length ? (
        <FeaturedSection
          id="clases-destacadas"
          title={homePage.classesTitle}
          subtitle={homePage.classesSubtitle}
          items={homeClasses}
          variant="classes"
        />
      ) : null}
      {homeWorkshops.length ? (
        <FeaturedSection
          id="workshops-destacados"
          title={homePage.workshopsTitle}
          subtitle={homePage.workshopsSubtitle}
          items={homeWorkshops}
          variant="workshops"
        />
      ) : null}
      {homeGiftCards.length ? (
        <HomeGiftCardSection
          title={homePage.giftTitle}
          subtitle={homePage.giftSubtitle}
          items={homeGiftCards}
        />
      ) : null}
      <IdeaPromptSection context="home" />
      <TestimonialSlider testimonials={testimonials} variant="home" />
    </SitePage>
  );
}
