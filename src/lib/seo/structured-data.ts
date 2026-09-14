import type { BlogPost, ExperienceItem, ShopItem } from "@/data/types";
import { getAbsoluteSiteUrl } from "./site-url";

function breadcrumbJsonLd(sectionName: string, sectionPath: string, pageName: string, pagePath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: getAbsoluteSiteUrl("/") },
      { "@type": "ListItem", position: 2, name: sectionName, item: getAbsoluteSiteUrl(sectionPath) },
      { "@type": "ListItem", position: 3, name: pageName, item: getAbsoluteSiteUrl(pagePath) },
    ],
  };
}

export function organizationJsonLd(siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: getAbsoluteSiteUrl("/"),
  };
}

export function blogPostJsonLd(post: BlogPost) {
  const pathname = `/blog/${post.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seoDescription,
      datePublished: post.publishedAt,
      author: { "@type": "Organization", name: post.author || "Casa Rosier" },
      mainEntityOfPage: getAbsoluteSiteUrl(pathname),
    },
    breadcrumbJsonLd("Bitácora", "/blog", post.title, pathname),
  ];
}

export function productJsonLd(item: ShopItem) {
  const pathname = `/shop/${item.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.name,
      description: item.seoDescription,
      url: getAbsoluteSiteUrl(pathname),
      ...(item.priceAmount !== null
        ? {
            offers: {
              "@type": "Offer",
              price: item.priceAmount,
              priceCurrency: "EUR",
              availability:
                item.availability === "Agotado"
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
              url: getAbsoluteSiteUrl(pathname),
            },
          }
        : {}),
    },
    breadcrumbJsonLd("Shop", "/shop", item.name, pathname),
  ];
}

export function offeringJsonLd(item: ExperienceItem) {
  const pathname =
    item.kind === "workshop"
      ? `/workshops/${item.slug}`
      : item.kind === "gift-card"
        ? `/gift-cards/${item.slug}`
        : item.kind === "private-booking"
          ? `/experiencias/${item.slug}`
          : `/clases/${item.slug}`;

  const section =
    item.kind === "workshop"
      ? { name: "Workshops", path: "/workshops" }
      : item.kind === "gift-card"
        ? { name: "Gift Cards", path: "/gift-cards" }
        : item.kind === "private-booking"
          ? { name: "Experiencias", path: "/experiencias" }
          : { name: "Clases", path: "/clases" };

  return [
    {
      "@context": "https://schema.org",
      "@type": item.kind === "class" || item.kind === "workshop" ? "Course" : "Service",
      name: item.title,
      description: item.seoDescription,
      url: getAbsoluteSiteUrl(pathname),
      provider: {
        "@type": "Organization",
        name: "Casa Rosier",
        url: getAbsoluteSiteUrl("/"),
      },
    },
    breadcrumbJsonLd(section.name, section.path, item.title, pathname),
  ];
}
