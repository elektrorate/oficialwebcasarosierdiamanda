import type { Metadata } from "next";
import localFont from "next/font/local";
import { Baskervville, Inter, Manrope, Roboto_Flex } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { getSettings } from "@/lib/cms/settings";
import "./tailwind.css";
import "./legacy/base.css";
import "./legacy/home.css";
import "./legacy/classes.css";
import "./legacy/shop.css";
import "../features/shop/components/catalog/shop-catalog.css";
import "../features/shop/components/item-detail/shop-item-detail.css";
import "../features/classes/components/class-detail/class-detail.css";
import "./legacy/blog.css";
import "../features/blog/components/index/blog-index.css";
import "../features/blog/components/post/blog-post-editorial.css";
import "./legacy/cart.css";
import "./legacy/studio.css";
import "./legacy/promo-entry.css";
import "./legacy/footer.css";
import "./globals.css";
import "./responsive-tuning.css";
import "./public-header-desktop.css";
import "./admin-offerings-table.css";
import "../components/home/gift-carousel.css";
import "../components/home/social-gallery-home.css";
import "../components/layout/scroll-nav/home-scroll-sticky-nav.css";

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
      path: "../../public/fonts/Nunito-VariableFont_wght.ttf",
      style: "normal"
    },
    {
      path: "../../public/fonts/Nunito-Italic-VariableFont_wght.ttf",
      style: "italic"
    }
  ],
  variable: "--font-nunito",
  display: "swap"
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casarosierceramica.com";

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.site.site_name || "Casa Rosier";
  const title = settings.seo.default_seo_title || siteName;
  const description = settings.seo.default_seo_description || "Studio de ceramica en Barcelona";
  const ogImage = settings.seo.default_og_image_url?.trim();
  const images = ogImage ? [ogImage] : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    robots: {
      index: settings.seo.robots_index,
      follow: settings.seo.robots_follow,
    },
    openGraph: {
      title,
      description,
      siteName,
      locale: "es_ES",
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
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${baskervville.variable} ${inter.variable} ${manrope.variable} ${robotoFlex.variable} ${nunito.variable}`}
      >
        {children}
        <SiteChrome whatsappFloat={<WhatsAppFloat />} />
      </body>
    </html>
  );
}
