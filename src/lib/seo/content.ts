export const SEO_RECOMMENDED_TITLE_LENGTH = 70;
export const SEO_RECOMMENDED_DESCRIPTION_LENGTH = 160;

export type SeoContentKind = "blog_post" | "product" | "offering" | "landing_page";
export type SeoFields = {
  id?: string;
  kind?: SeoContentKind;
  title?: string | null;
  description?: string | null;
  fallbackTitle?: string | null;
  fallbackDescription?: string | null;
};
export type SeoPeer = SeoFields & {
  id: string;
  kind: SeoContentKind;
  label: string;
  path: string;
};

export type SeoSiteConfig = { siteName: string; defaultSeoDescription: string };
export type SeoContentSource = {
  id?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  title?: string | null;
  name?: string | null;
  excerpt?: string | null;
  description?: string | null;
  hero_subtitle?: string | null;
  intro_text?: string | null;
};

export function getSeoContentFields(
  kind: SeoContentKind,
  item: SeoContentSource,
  site: SeoSiteConfig = { siteName: "Casa Rosier", defaultSeoDescription: "" },
): SeoFields {
  const contentTitle = (kind === "product" ? item.name : item.title) ?? "";
  return {
    id: item.id,
    kind,
    title: item.seo_title,
    description: item.seo_description,
    fallbackTitle: contentTitle && (kind === "product" || kind === "offering")
      ? `${contentTitle} | ${kind === "product" ? site.siteName : "Casa Rosier"}`
      : contentTitle,
    fallbackDescription: kind === "landing_page"
      ? item.hero_subtitle || item.intro_text
      : kind === "product" ? item.excerpt || item.description || site.defaultSeoDescription : item.excerpt,
  };
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "\u2026", ndash: "\u2013", mdash: "\u2014", copy: "\u00a9",
  reg: "\u00ae", euro: "\u20ac", laquo: "\u00ab", raquo: "\u00bb",
};

export function seoPlainText(value: string | null | undefined): string {
  let decoded = value ?? "";
  // Decode before removing tags, including escaped HTML from rich-text excerpts.
  for (let pass = 0; pass < 3; pass++) {
    const next = decoded.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity: string, name: string) => {
      if (!name.startsWith("#")) return ENTITIES[name.toLowerCase()] ?? entity;
      const point = name.slice(0, 2).toLowerCase() === "#x"
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point)
        : "";
    });
    if (next === decoded) break;
    decoded = next;
  }
  return decoded
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?[a-z][\w:-]*(?:\s+(?:"[^"]*"|'[^']*'|[^'">])*)?\s*\/?>/gi, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s*\[[^\]]+\]:[^\n]*$/gm, " ")
    .replace(/^[ \t]*```[^\n]*\n?/gm, " ")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/^\s*(?:#{1,6}\s+|>+\s*|[-+*]\s+|\d+[.)]\s+)/gm, " ")
    .replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, " ")
    .replace(/(\*\*|__|~~)(\S[\s\S]*?\S|\S)\1/g, "$2")
    .replace(/(^|[\s(])([*_])(\S(?:[^\n]*?\S)?)\2(?=$|[\s).,!?:;])/g, "$1$3")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveSeoText(fields: SeoFields): { title: string; description: string } {
  const title = seoPlainText(fields.title) || seoPlainText(fields.fallbackTitle);
  const explicitDescription = seoPlainText(fields.description);
  if (explicitDescription) return { title, description: explicitDescription };

  const fallback = seoPlainText(fields.fallbackDescription);
  const characters = Array.from(fallback);
  if (characters.length <= SEO_RECOMMENDED_DESCRIPTION_LENGTH) return { title, description: fallback };
  const end = SEO_RECOMMENDED_DESCRIPTION_LENGTH - 3;
  const prefix = characters.slice(0, end).join("");
  const wordEnd = /\s/.test(characters[end]) ? prefix.length : prefix.lastIndexOf(" ");
  // Do not invent a partial word when the fallback is one oversized token.
  const description = wordEnd > 0 ? `${prefix.slice(0, wordEnd).trimEnd()}...` : "";
  return { title, description };
}

export function getSeoWarnings(fields: SeoFields, peers: SeoPeer[] = []): string[] {
  const warnings: string[] = [];
  const effective = resolveSeoText(fields);
  const formatting = /<\/?[a-z][^>]*>|&(?:amp;)?lt;\/?[a-z]|(?:^|\n)\s*(?:#{1,6}\s|>\s|[-+]\s|\d+[.)]\s)|!?\[[^\]]*\]\([^)]*\)|(?:\*\*|__|~~|`)[\s\S]+?(?:\*\*|__|~~|`)|(?:\*|_)[^\s][^\n]*?(?:\*|_)/i;
  for (const [field, label, recommended] of [
    ["title", "Titulo SEO", SEO_RECOMMENDED_TITLE_LENGTH],
    ["description", "Descripcion SEO", SEO_RECOMMENDED_DESCRIPTION_LENGTH],
  ] as const) {
    const raw = fields[field] ?? "";
    if (!seoPlainText(raw)) warnings.push(`${label} propio vacio. Revisa el texto de respaldo antes de publicar.`);
    if (Array.from(seoPlainText(raw)).length > recommended) {
      warnings.push(`${label} supera los ${recommended} caracteres recomendados; no es un limite obligatorio de Google.`);
    }
    if (formatting.test(raw)) warnings.push(`${label} contiene HTML o Markdown. El metadato publico se mostrara como texto plano.`);

    const comparable = effective[field].normalize("NFKC").toLowerCase();
    if (!comparable) continue;
    for (const peer of peers) {
      if (fields.id === peer.id && fields.kind === peer.kind) continue;
      if (resolveSeoText(peer)[field].normalize("NFKC").toLowerCase() === comparable) {
        warnings.push(`${label} coincide con otro contenido publicado: ${peer.path}.`);
      }
    }
  }
  return [...new Set(warnings)];
}

export function validateSeoInput(input: Record<string, unknown>): void {
  for (const field of ["seo_title", "seo_description"] as const) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") throw new Error(`${field}: se esperaba un texto.`);
    if (value.length > 50_000) throw new Error(`${field}: supera el limite de seguridad de 50000 caracteres.`);
  }
}
