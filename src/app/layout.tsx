import type { Metadata } from "next";
import localFont from "next/font/local";
import { Baskervville, Inter, Manrope, Roboto_Flex } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteTimeZoneProvider } from "@/components/layout/SiteTimeZoneProvider";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSettings } from "@/lib/cms/settings";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { assetPath } from "@/lib/assets";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo/page-metadata";
import { resolveRobotsMetadata } from "@/lib/seo/site-robots";
import { resolveSeoText } from "@/lib/seo/content";
import { siteHtmlLang, siteOpenGraphLocale } from "@/lib/seo/site-language";
import "./tailwind.css";
import "./legacy/base.css";
import "./legacy/cart.css";
import "./legacy/promo-entry.css";
import "./legacy/footer.css";
import "./globals.css";
import "./responsive-tuning.css";
import "./public-header-desktop.css";
import "@/components/layout/scroll-nav/home-scroll-sticky-nav.css";

const baskervville = Baskervville({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-baskervville",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap"
});

const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  // Required for CmsRichTextField / TypographyPanel "Width" (font-variation-settings: "wdth").
  axes: ["wdth"],
  variable: "--font-roboto-flex",
  display: "swap"
});

const nunito = localFont({
  src: [
    {
      path: "../../public/fonts/Nunito-VariableFont_wght.woff2",
      style: "normal"
    },
    {
      path: "../../public/fonts/Nunito-Italic-VariableFont_wght.woff2",
      style: "italic"
    }
  ],
  variable: "--font-nunito",
  preload: false,
  display: "swap"
});

export const revalidate = 900;

const FALLBACK_SITE_DESCRIPTION = "Studio de ceramica en Barcelona";
const FALLBACK_FAVICON = "/img/logo-header.png";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.site.site_name || "Casa Rosier";
  const { title, description } = resolveSeoText({
    title: settings.seo.default_seo_title,
    description: settings.seo.default_seo_description,
    fallbackTitle: siteName,
    fallbackDescription: settings.site.site_description || FALLBACK_SITE_DESCRIPTION,
  });
  const ogImage = assetPath(settings.seo.default_og_image_url?.trim() || DEFAULT_SOCIAL_IMAGE);
  const images = ogImage ? [ogImage] : undefined;

  // `robots_index` y `robots_follow` son independientes: cada uno añade solo su
  // directiva. Un SEO de página concreta puede sobrescribir este objeto entero
  // (Next.js no fusiona `robots` entre layouts padre e hijo).
  const robots = resolveRobotsMetadata(settings.seo);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    icons: {
      icon: settings.site.favicon_url?.trim() || FALLBACK_FAVICON,
      ...(settings.site.logo_url?.trim() ? { shortcut: settings.site.logo_url.trim() } : {}),
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      title,
      description,
      siteName,
      locale: siteOpenGraphLocale(settings.site.default_language),
      type: "website",
      ...(images ? { images } : {}),
    },
    ...(images
      ? {
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images,
          },
        }
      : {}),
  };
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const siteName = settings.site.site_name || "Casa Rosier";

  return (
    <html lang={siteHtmlLang(settings.site.default_language)} data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${baskervville.variable} ${inter.variable} ${manrope.variable} ${robotoFlex.variable} ${nunito.variable}`}
      >
        <JsonLd
          data={organizationJsonLd(siteName, {
            description:
              resolveSeoText({ description: settings.seo.default_seo_description, fallbackDescription: settings.site.site_description }).description,
            logoUrl: settings.site.logo_url?.trim(),
          })}
        />
        <SiteTimeZoneProvider timeZone={settings.site.timezone}>
          {children}
        </SiteTimeZoneProvider>
        <SiteChrome whatsappFloat={<WhatsAppFloat />} />
      </body>
    </html>
  );
}
