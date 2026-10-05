import { getSettings } from "../cms/settings";
import { canonicalPublicPath } from "../cms/public-section-routes";
import { pageMetadata } from "./page-metadata";

// Dedicated collection configuration; independent of the generic CMS pages module.
const collections = {
  classes: {
    path: "/clases",
    title: "Cursos de cerámica en Barcelona",
    description: "Descubre nuestros cursos de cerámica en Barcelona: formación, técnicas y práctica con arcilla para desarrollar tus proyectos en Casa Rosier.",
  },
  workshops: {
    path: "/workshops",
    title: "Workshops de cerámica y esmaltes",
    description: "Explora los workshops de especialización de Casa Rosier: técnicas cerámicas y formulación de esmaltes, con propuestas en Barcelona y online.",
  },
  experiences: {
    path: "/experiencias",
    title: "Experiencias de cerámica en Barcelona",
    description: "Disfruta de la cerámica en Casa Rosier: modelado, torno, clases regulares y experiencias para compartir en pareja, con amigos o con tu equipo.",
  },
  giftCards: {
    path: "/gift-cards",
    title: "Tarjetas regalo de cerámica en Barcelona",
    description: "Regala una experiencia de cerámica en Barcelona con las tarjetas regalo de Casa Rosier: tiempo para crear, descubrir el barro y disfrutar del taller.",
  },
} as const;

export async function collectionMetadata(key: keyof typeof collections) {
  const config = collections[key];
  const [settings, canonical] = await Promise.all([getSettings(), canonicalPublicPath(config.path)]);
  return pageMetadata({
    title: `${config.title} | ${settings.site.site_name}`,
    description: config.description,
    canonical,
    defaultImage: settings.seo.default_og_image_url,
    siteName: settings.site.site_name,
    language: settings.site.default_language,
  });
}
