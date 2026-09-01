import type { Metadata } from "next";
import type { ExperienceItem, ExperienceKind } from "@/data/types";
import { getOfferingBySlug, getOfferings } from "@/lib/cms/offerings";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { CalendarLabel, ClassOfferingDetails, Offering } from "@/lib/cms/types";
import { DEFAULT_WHATSAPP_NUMBER, getWhatsappNumber } from "@/lib/whatsapp";

type LegacyProgramItem = {
  title?: unknown;
  content?: unknown;
  description?: unknown;
  points?: unknown;
};

type LegacyOfferingDetails = Partial<ClassOfferingDetails> & {
  class?: Partial<ClassOfferingDetails>;
  category?: unknown;
  introHighlight?: unknown;
  videoCardImage?: unknown;
  videoCardLabel?: unknown;
  included?: unknown;
  program?: unknown;
  whatYouWillLearn?: unknown;
  whoCanJoin?: unknown;
  paymentMethods?: unknown;
  additionalInfo?: unknown;
  ctaHref?: unknown;
  ctaConsultHref?: unknown;
  ctaEnrollHref?: unknown;
  ctaConsultLabel?: unknown;
  ctaEnrollLabel?: unknown;
  giftCardTypeLabel?: unknown;
  giftCardTypeOptions?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitParagraphs(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return stringValue(value)
    .split(/\n{2,}|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Keep TipTap markdown structure (blank lines as block separators). */
function markdownLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ""));
  return String(value ?? "").replace(/\r\n/g, "\n").split("\n");
}

function splitList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return stringValue(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function kindFromOffering(type: Offering["type"]): ExperienceKind {
  if (type === "workshop") return "workshop";
  if (type === "gift_card") return "gift-card";
  if (type === "experience") return "private-booking";
  return "class";
}

function formatPrice(value: number | null) {
  return value === null ? "" : `${value} EUR`;
}

function fallbackWhatsappHref(
  details: LegacyOfferingDetails,
  defaultNumber = DEFAULT_WHATSAPP_NUMBER,
) {
  const whatsapp = details.whatsappNumber || details.content?.contactWhatsapp || defaultNumber;
  return `https://wa.me/${whatsapp}`;
}

function ctaConsultHref(
  details: LegacyOfferingDetails,
  defaultNumber = DEFAULT_WHATSAPP_NUMBER,
) {
  if (details.showConsultCta === false) return "";
  return (
    stringValue(details.ctaConsultHref) ||
    stringValue(details.ctaHref) ||
    fallbackWhatsappHref(details, defaultNumber)
  );
}

function ctaEnrollHref(
  details: LegacyOfferingDetails,
  defaultNumber = DEFAULT_WHATSAPP_NUMBER,
) {
  if (details.showEnrollCta === false) return "";
  return (
    stringValue(details.ctaEnrollHref) ||
    stringValue(details.ctaHref) ||
    fallbackWhatsappHref(details, defaultNumber)
  );
}

function ctaConsultLabel(details: LegacyOfferingDetails, type: Offering["type"]) {
  return stringValue(details.ctaConsultLabel) || (type === "gift_card" ? "Comprar" : "Consultar");
}

function ctaEnrollLabel(details: LegacyOfferingDetails, type: Offering["type"]) {
  return stringValue(details.ctaEnrollLabel) || (type === "gift_card" ? "Anadir al carrito" : "Inscribirme");
}

function hasDetailValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasDetailValue);
  }
  return value !== null && value !== undefined;
}

function populatedDetails(value: Partial<ClassOfferingDetails>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => hasDetailValue(entry))
  ) as Partial<ClassOfferingDetails>;
}

function detailsForOffering(offering: Offering): LegacyOfferingDetails {
  const rootDetails = offering.details as LegacyOfferingDetails;

  return {
    ...rootDetails,
    ...(rootDetails.class ? populatedDetails(rootDetails.class) : {}),
  };
}

function daysInMonth(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 0;
  return new Date(year, month, 0).getDate();
}

function normalizeCalendarLabels(value: unknown): CalendarLabel[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 6)
    .map((entry, index) => {
      const source = entry && typeof entry === "object" ? entry as Partial<CalendarLabel> : {};
      const month = Number(source.month);
      const year = Number(source.year);
      const maxDay = daysInMonth(year, month);
      const days = Array.isArray(source.days)
        ? Array.from(new Set(source.days.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 1 && day <= maxDay))).sort((a, b) => a - b)
        : [];

      return {
        id: stringValue(source.id) || `calendar-label-${index}`,
        month,
        year,
        days,
        active: source.active !== false,
        order: Number.isFinite(Number(source.order)) ? Number(source.order) : index,
        availabilityText: stringValue(source.availabilityText),
      };
    })
    .filter((label) => Number.isInteger(label.month) && label.month >= 1 && label.month <= 12 && Number.isInteger(label.year) && label.year >= 2000 && label.year <= 2100 && label.days.length > 0)
    .sort((a, b) => a.year - b.year || a.month - b.month || a.order - b.order)
    .map((label, order) => ({ ...label, order }));
}
function scheduleForOffering(offering: Offering, details: LegacyOfferingDetails) {
  if (details.showScheduleOnFrontend === false) return [];

  const scheduleDescription = stringValue(details.scheduleDescription);
  if (scheduleDescription) {
    return [{
      day: "Horario",
      slots: scheduleDescription.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    }];
  }

  if (details.scheduleDays?.length) {
    return details.scheduleDays
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => ({
        day: item.title || item.date || "Disponible",
        slots: [item.startTime && item.endTime ? `${item.startTime} a ${item.endTime}` : item.description || "Consultar disponibilidad"].filter(Boolean),
      }));
  }

  return offering.schedule.map((item) => {
    const [day, ...slotParts] = item.split(":");
    const slots = slotParts.join(":").split(",").map((slot) => slot.trim()).filter(Boolean);
    return {
      day: day?.trim() || "Disponible",
      slots: slots.length ? slots : ["Consultar disponibilidad"],
    };
  });
}

function programForDetails(content: Partial<ClassOfferingDetails["content"]>, details: LegacyOfferingDetails) {
  if (content.modules?.length) {
    return content.modules
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        title: item.title,
        content: item.description,
        contentTypography: normalizeRichTextTypography(item.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
      }));
  }

  if (!Array.isArray(details.program)) return [];

  return details.program
    .map((item, index) => {
      const programItem = item as LegacyProgramItem;
      const title = stringValue(programItem.title);
      const contentValue = stringValue(programItem.content) || stringValue(programItem.description);
      return {
        title: title || `Modulo ${index + 1}`,
        content: contentValue,
        contentTypography: normalizeRichTextTypography(DEFAULT_DESCRIPTION_TYPOGRAPHY),
        points: splitList(programItem.points),
      };
    })
    .filter((item) => item.title || item.content || item.points?.length);
}

function cmsOfferingToExperienceItem(
  offering: Offering,
  defaultWhatsappNumber = DEFAULT_WHATSAPP_NUMBER,
): ExperienceItem {
  const details = detailsForOffering(offering);
  const content = { ...details.content };
  const classDetails = (offering.details as LegacyOfferingDetails).class;
  const classContent = classDetails?.content as Partial<ClassOfferingDetails["content"]> | undefined;
  const hasClassLearningContent = Boolean(classContent && Object.prototype.hasOwnProperty.call(classContent, "learningContent"));
  const hasClassParticipationContent = Boolean(classContent && Object.prototype.hasOwnProperty.call(classContent, "participationContent"));
  const hasClassPaymentMethods = Boolean(classContent && (
    Object.prototype.hasOwnProperty.call(classContent, "paymentMethods") ||
    Object.prototype.hasOwnProperty.call(classContent, "paymentMethodsList")
  ));
  const hasClassExtraInfo = Boolean(classContent && Object.prototype.hasOwnProperty.call(classContent, "extraInfo"));
  const galleryImages = (details.galleryImages?.length ? details.galleryImages : offering.gallery.map((image, order) => ({ image, alt: "", order })))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => item.image)
    .filter(Boolean);
  const priceOptions = (details.pricing?.length ? details.pricing : offering.price !== null ? [{ description: "Precio base", price: offering.price, order: 0 }] : [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({ label: item.description || "Precio", price: formatPrice(item.price) }));
  const schedule = scheduleForOffering(offering, details);
  const calendarLabels = normalizeCalendarLabels(details.calendarLabels).filter((label) => label.active);
  const consultHref = ctaConsultHref(details, defaultWhatsappNumber);
  const enrollHref = ctaEnrollHref(details, defaultWhatsappNumber);
  const hero = normalizeHeroSettings(details, {
    heroTitle: details.heroTitle || offering.title,
    heroSubtitle: details.heroSubtitle || stringValue(details.category) || offering.type,
    heroImage: details.heroImage || offering.cover_image_url || "img/hero-bg.jpg",
  });
  const program = programForDetails(content, details);
  const included = details.includedItems?.length ? details.includedItems : splitList(details.included);
  const showIncludedSection = typeof classDetails?.showIncludedSection === "boolean"
    ? classDetails.showIncludedSection
    : false;
  const paymentMethods = splitList(content.paymentMethodsList?.length ? content.paymentMethodsList : hasClassPaymentMethods ? content.paymentMethods : content.paymentMethods || details.paymentMethods);
  const showLearningSection = typeof classContent?.showLearningSection === "boolean"
    ? classContent.showLearningSection
    : splitParagraphs(hasClassLearningContent ? content.learningContent : content.learningContent || details.whatYouWillLearn).length > 0;
  const showParticipationSection = typeof classContent?.showParticipationSection === "boolean"
    ? classContent.showParticipationSection
    : splitParagraphs(hasClassParticipationContent ? content.participationContent : content.participationContent || details.whoCanJoin).length > 0;
  const showPaymentMethodsSection = typeof classContent?.showPaymentMethodsSection === "boolean"
    ? classContent.showPaymentMethodsSection
    : paymentMethods.length > 0;
  const showModulesSection = typeof classContent?.showModulesSection === "boolean"
    ? classContent.showModulesSection
    : typeof classContent?.showCourseContent === "boolean"
      ? classContent.showCourseContent
      : program.length > 0;
  const homeCard = classDetails?.homeCard;
  const defaultHomeImage = offering.cover_image_url || galleryImages[0] || details.heroImage || "img/hero-bg.jpg";
  const defaultHomeEyebrow = details.heroSubtitle || stringValue(details.category) || offering.type;
  const detailQuestion = stringValue(details.detailQuestion) || "Te apasiona la creatividad y deseas explorar el mundo de la ceramica?";

  return {
    id: offering.id,
    kind: kindFromOffering(offering.type),
    slug: offering.slug,
    title: offering.title,
    subtitle: offering.subtitle || offering.title,
    heroSubtitle: hero.heroSubtitle || details.heroSubtitle || offering.subtitle || offering.title,
    category: details.heroSubtitle || stringValue(details.category) || offering.type,
    excerpt: offering.excerpt,
    description: splitParagraphs(offering.description),
    coverImage: defaultHomeImage,
    homeImage: stringValue(homeCard?.image) || defaultHomeImage,
    homeImageAlt: stringValue(homeCard?.imageAlt) || stringValue(homeCard?.title) || offering.title,
    showHomeEyebrow: homeCard?.showEyebrow !== false,
    homeEyebrow: stringValue(homeCard?.eyebrow) || defaultHomeEyebrow,
    homeEyebrowTypography: normalizeRichTextTypography(
      homeCard?.eyebrowTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 14 },
    ),
    homeTitle: stringValue(homeCard?.title) || offering.title,
    homeTitleTypography: normalizeRichTextTypography(
      homeCard?.titleTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 26 },
    ),
    homeTagline: stringValue(homeCard?.tagline) || offering.subtitle || offering.title,
    homeTaglineTypography: normalizeRichTextTypography(
      homeCard?.taglineTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 21 },
    ),
    homeExcerpt: stringValue(homeCard?.excerpt) || stringValue(classDetails?.homeExcerpt) || offering.excerpt,
    homeExcerptTypography: normalizeRichTextTypography(homeCard?.excerptTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
    heroImage: hero.heroImage || offering.cover_image_url || "img/hero-bg.jpg",
    heroImageMobile: hero.heroImageMobile || undefined,
    heroVideoUrl: hero.heroVideoUrl || undefined,
    heroVideoUrlMobile: hero.heroVideoUrlMobile || undefined,
    heroVideoPoster: hero.heroVideoPoster || undefined,
    heroVariant: hero.heroVariant,
    heroMenuTone: hero.heroMenuTone,
    heroMenuColor: hero.heroMenuColor,
    heroMenuScale: hero.heroMenuScale,
    heroLogoPositionX: hero.heroLogoPositionX,
    heroLogoPositionY: hero.heroLogoPositionY,
    heroLogoWidth: hero.heroLogoWidth,
    heroLogoTabletPositionX: hero.heroLogoTabletPositionX,
    heroLogoTabletPositionY: hero.heroLogoTabletPositionY,
    heroLogoTabletWidth: hero.heroLogoTabletWidth,
    heroLogoMobilePositionX: hero.heroLogoMobilePositionX,
    heroLogoMobilePositionY: hero.heroLogoMobilePositionY,
    heroLogoMobileWidth: hero.heroLogoMobileWidth,
    heroMenuPositionY: hero.heroMenuPositionY,
    heroMenuTabletPositionY: hero.heroMenuTabletPositionY,
    heroMenuMobilePositionY: hero.heroMenuMobilePositionY,
    heroTitleImage: details.titleImage,
    heroTitleImageSecondary: details.titleImageSecondary,
    heroPresentationText: hero.heroPresentationText,
    heroPresentationSubtitle: hero.heroPresentationSubtitle,
    heroPresentationTextTypography: hero.heroPresentationTextTypography,
    heroPresentationSubtitleTypography: hero.heroPresentationSubtitleTypography,
    heroPresentationTextColor: hero.heroPresentationTextColor,
    heroPresentationImage: hero.heroPresentationImage,
    heroPresentationCtaEnabled: hero.heroPresentationCtaEnabled,
    heroPresentationCtaLabel: hero.heroPresentationCtaLabel,
    heroPresentationCtaHref: hero.heroPresentationCtaHref,
    heroPresentationCtaNewTab: hero.heroPresentationCtaNewTab,
    heroPresentationCtaBackgroundColor: hero.heroPresentationCtaBackgroundColor,
    heroPresentationCtaTextColor: hero.heroPresentationCtaTextColor,
    titleImageScale: hero.titleImageScale,
    titleImageScaleTablet: hero.titleImageScaleTablet,
    titleImageScaleMobile: hero.titleImageScaleMobile,
    titleImagePositionX: hero.titleImagePositionX,
    titleImagePositionY: hero.titleImagePositionY,
    titleImagePositionXTablet: hero.titleImagePositionXTablet,
    titleImagePositionYTablet: hero.titleImagePositionYTablet,
    titleImagePositionXMobile: hero.titleImagePositionXMobile,
    titleImagePositionYMobile: hero.titleImagePositionYMobile,
    titleImageSecondaryScale: hero.titleImageSecondaryScale,
    titleImageSecondaryScaleTablet: hero.titleImageSecondaryScaleTablet,
    titleImageSecondaryScaleMobile: hero.titleImageSecondaryScaleMobile,
    titleImageSecondaryPositionX: hero.titleImageSecondaryPositionX,
    titleImageSecondaryPositionY: hero.titleImageSecondaryPositionY,
    titleImageSecondaryPositionXTablet: hero.titleImageSecondaryPositionXTablet,
    titleImageSecondaryPositionYTablet: hero.titleImageSecondaryPositionYTablet,
    titleImageSecondaryPositionXMobile: hero.titleImageSecondaryPositionXMobile,
    titleImageSecondaryPositionYMobile: hero.titleImageSecondaryPositionYMobile,
    heroTitlePositionX: hero.heroTitlePositionX,
    heroTitlePositionXTablet: hero.heroTitlePositionXTablet,
    heroTitlePositionXMobile: hero.heroTitlePositionXMobile,
    heroTitlePositionY: hero.heroTitlePositionY,
    heroTitlePositionYTablet: hero.heroTitlePositionYTablet,
    heroTitlePositionYMobile: hero.heroTitlePositionYMobile,
    heroTitleScale: hero.heroTitleScale,
    heroTitleScaleTablet: hero.heroTitleScaleTablet,
    heroTitleScaleMobile: hero.heroTitleScaleMobile,
    presentationTextPositionX: hero.presentationTextPositionX,
    presentationTextPositionY: hero.presentationTextPositionY,
    presentationTextPositionXTablet: hero.presentationTextPositionXTablet,
    presentationTextPositionYTablet: hero.presentationTextPositionYTablet,
    presentationTextPositionXMobile: hero.presentationTextPositionXMobile,
    presentationTextPositionYMobile: hero.presentationTextPositionYMobile,
    presentationTextScale: hero.presentationTextScale,
    presentationTextScaleTablet: hero.presentationTextScaleTablet,
    presentationTextScaleMobile: hero.presentationTextScaleMobile,
    presentationImagePositionX: hero.presentationImagePositionX,
    presentationImagePositionY: hero.presentationImagePositionY,
    presentationImagePositionXTablet: hero.presentationImagePositionXTablet,
    presentationImagePositionYTablet: hero.presentationImagePositionYTablet,
    presentationImagePositionXMobile: hero.presentationImagePositionXMobile,
    presentationImagePositionYMobile: hero.presentationImagePositionYMobile,
    presentationImageScale: hero.presentationImageScale,
    presentationImageScaleTablet: hero.presentationImageScaleTablet,
    presentationImageScaleMobile: hero.presentationImageScaleMobile,
    heroTitle: hero.heroTitle || offering.title,
    listingTitle: offering.title,
    listingSubtitle: details.heroSubtitle || "",
    subtitleTypography: normalizeRichTextTypography(details.subtitleTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    detailQuestion,
    detailQuestionTypography: normalizeRichTextTypography(details.detailQuestionTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    introHighlight: details.highlightDescription || stringValue(details.introHighlight) || offering.excerpt,
    introHighlightTypography: normalizeRichTextTypography(details.highlightDescriptionTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY),
    descriptionTypography: normalizeRichTextTypography(details.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
    galleryImages: galleryImages.length ? galleryImages : [offering.cover_image_url || details.heroImage || "img/hero-bg.jpg"],
    videoCardImage: details.videoPoster || stringValue(details.videoCardImage) || undefined,
    videoCardLabel: details.videoUrl ? "VIDEO" : details.videoPoster || stringValue(details.videoCardImage) ? stringValue(details.videoCardLabel) || "IMAGEN" : "",
    videoUrl: details.videoUrl || undefined,
    giftCardTypeLabel: stringValue(details.giftCardTypeLabel) || undefined,
    giftCardTypeOptions: splitList(details.giftCardTypeOptions),
    priceOptions,
    duration: details.durationText || offering.duration,
    schedule,
    showCalendarLabels: details.showCalendarLabels === true,
    calendarLabelsTitle: stringValue(details.calendarLabelsTitle),
    calendarLabelsDescription: stringValue(details.calendarLabelsDescription),
    calendarLabels,
    included,
    includedTypography: normalizeRichTextTypography(
      details.includedItemsTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 16 },
    ),
    showIncludedSection,
    program,
    showLearningSection,
    showParticipationSection,
    showPaymentMethodsSection,
    showModulesSection,
    programSectionTitle: stringValue(content.modulesSectionTitle) || "Contenido del curso",
    learningSectionTitle: stringValue(content.learningSectionTitle) || "¿Qué aprenderás?",
    whatYouWillLearn: markdownLines(hasClassLearningContent ? content.learningContent : content.learningContent || details.whatYouWillLearn),
    whatYouWillLearnTypography: normalizeRichTextTypography(
      content.learningContentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
    ),
    participationSectionTitle: stringValue(content.participationSectionTitle) || "¿Quién puede participar?",
    whoCanJoin: markdownLines(hasClassParticipationContent ? content.participationContent : content.participationContent || details.whoCanJoin),
    whoCanJoinTypography: normalizeRichTextTypography(
      content.participationContentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
    ),
    paymentMethods,
    additionalInfo: hasClassExtraInfo ? stringValue(content.extraInfo) : stringValue(content.extraInfo) || stringValue(details.additionalInfo),
    additionalInfoTypography: normalizeRichTextTypography(
      content.extraInfoTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
    ),
    showIdeaPromptSection: typeof classDetails?.showIdeaPromptSection === "boolean"
      ? classDetails.showIdeaPromptSection
      : true,
    ctaHref: consultHref,
    ctaConsultHref: consultHref,
    ctaEnrollHref: enrollHref,
    ctaConsultLabel: ctaConsultLabel(details, offering.type),
    ctaEnrollLabel: ctaEnrollLabel(details, offering.type),
    seoTitle: offering.seo_title || `${offering.title} | Casa Rosier`,
    seoDescription: offering.seo_description || offering.excerpt,
    isPublished: offering.status === "published",
    isFeatured: offering.featured,
    order: 0,
  };
}

export async function getPublicExperienceItems() {
  const [offerings, defaultNumber] = await Promise.all([getOfferings(), getWhatsappNumber()]);
  return offerings
    .filter((item) => item.status === "published" && !item.deleted_at)
    .map((item) => cmsOfferingToExperienceItem(item, defaultNumber));
}

async function bySlug(slug: string) {
  const [offering, defaultNumber] = await Promise.all([getOfferingBySlug(slug), getWhatsappNumber()]);
  if (!offering || offering.status !== "published" || offering.deleted_at) return null;
  return cmsOfferingToExperienceItem(offering, defaultNumber);
}

export async function generateExperienceStaticParams(kind: ExperienceKind) {
  const cmsItems = await getPublicExperienceItems();
  return cmsItems.filter((item) => item.kind === kind).map((item) => ({ slug: item.slug }));
}

export async function generateExperienceMetadata(
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const offering = await getOfferingBySlug((await params).slug);
  if (!offering || offering.status !== "published" || offering.deleted_at) return {};

  const item = cmsOfferingToExperienceItem(offering);
  const classDetails = (offering.details as LegacyOfferingDetails).class;
  const ogImage = stringValue(classDetails?.seoImage) || stringValue(offering.cover_image_url);
  const openGraphImages = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title: { absolute: item.seoTitle },
    description: item.seoDescription,
    openGraph: {
      title: item.seoTitle,
      description: item.seoDescription,
      images: openGraphImages,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: item.seoTitle,
      description: item.seoDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function getExperienceRouteItem(
  params: Promise<{ slug: string }>,
  kind: ExperienceKind
) {
  const item = await bySlug((await params).slug);
  return item?.kind === kind ? item : null;
}
