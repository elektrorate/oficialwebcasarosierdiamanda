import { promises as fs } from "fs";
import path from "path";
import { createAdminClient } from "../supabase/admin";
import { defaultHeroSettings, normalizeHeroSettings } from "./hero-settings";
import type { BlogPageSettings } from "./types";

const TABLE = "blog_page_settings";
const FILE_PATH = path.join(process.cwd(), "data", "blog-page-settings.json");
const SETTINGS_ID = "blog-page";

const DEFAULT_INTRO = {
  heading: "Bitácora cerámica",
  kicker: "Casa Rosier",
  text: "Un espacio para compartir procesos, técnicas, reflexiones y pequeñas historias alrededor de la cerámica contemporánea, el taller y la creación con las manos.",
};

export const defaultBlogPageSettings: BlogPageSettings = {
  id: SETTINGS_ID,
  status: "published",
  hero: normalizeHeroSettings({
    ...defaultHeroSettings,
    heroVariant: "text",
    heroTitle: "Bitacora ceramica",
    heroSubtitle: "Casa Rosier",
    heroImage: "/img/hero-bg.jpg",
    heroPresentationText:
      "# Bitacora ceramica\n\nProcesos, tecnicas y reflexiones alrededor de la ceramica contemporanea.",
  }),
  introHeading: DEFAULT_INTRO.heading,
  introKicker: DEFAULT_INTRO.kicker,
  introText: DEFAULT_INTRO.text,
  showIdeaPromptSection: true,
  showFaqSection: false,
  faqGroupId: "",
  seo_title: "Blog | Casa Rosier Ceramica",
  seo_description:
    "Articulos, procesos y reflexiones sobre ceramica, talleres, tecnicas y creacion en Casa Rosier Ceramica Barcelona.",
  seo_image: "",
  updated_at: "",
};

function normalizeBlogPageSettings(
  input: Partial<BlogPageSettings> | null | undefined
): BlogPageSettings {
  const rowInput = input as
    | (Partial<BlogPageSettings> & {
        show_idea_prompt_section?: boolean;
        show_faq_section?: boolean;
        faq_group_id?: string | null;
        faq_category?: string;
        intro_heading?: string;
        intro_kicker?: string;
        intro_text?: string;
      })
    | null
    | undefined;

  return {
    ...defaultBlogPageSettings,
    ...input,
    id: SETTINGS_ID,
    status: input?.status === "draft" ? "draft" : "published",
    hero: normalizeHeroSettings(input?.hero, {
      heroTitle: "Bitacora ceramica",
      heroSubtitle: "Casa Rosier",
      heroImage: "/img/hero-bg.jpg",
    }),
    introHeading: String(
      input?.introHeading ??
        rowInput?.intro_heading ??
        defaultBlogPageSettings.introHeading
    ),
    introKicker: String(
      input?.introKicker ??
        rowInput?.intro_kicker ??
        defaultBlogPageSettings.introKicker
    ),
    introText: String(
      input?.introText ?? rowInput?.intro_text ?? defaultBlogPageSettings.introText
    ),
    showIdeaPromptSection:
      (input?.showIdeaPromptSection ?? rowInput?.show_idea_prompt_section) !== false,
    showFaqSection: (input?.showFaqSection ?? rowInput?.show_faq_section) === true,
    faqGroupId: String(input?.faqGroupId ?? rowInput?.faq_group_id ?? ""),
    seo_title: String(input?.seo_title ?? defaultBlogPageSettings.seo_title),
    seo_description: String(
      input?.seo_description ?? defaultBlogPageSettings.seo_description
    ),
    seo_image: String(input?.seo_image ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

function toRow(settings: BlogPageSettings) {
  return {
    id: settings.id,
    status: settings.status,
    hero: settings.hero,
    intro_heading: settings.introHeading,
    intro_kicker: settings.introKicker,
    intro_text: settings.introText,
    show_idea_prompt_section: settings.showIdeaPromptSection,
    show_faq_section: settings.showFaqSection,
    faq_group_id: settings.faqGroupId || null,
    seo_title: settings.seo_title,
    seo_description: settings.seo_description,
    seo_image: settings.seo_image,
    updated_at: settings.updated_at,
  };
}

function toRowWithoutIntro(settings: BlogPageSettings) {
  const { intro_heading: _h, intro_kicker: _k, intro_text: _t, ...row } = toRow(settings);
  return row;
}

async function readFromFile() {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalizeBlogPageSettings(JSON.parse(raw) as Partial<BlogPageSettings>);
  } catch {
    return defaultBlogPageSettings;
  }
}

async function writeToFile(settings: BlogPageSettings) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export async function getBlogPageSettings() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();
    if (error) throw error;
    if (data) return normalizeBlogPageSettings(data as Partial<BlogPageSettings>);
  } catch {
    return readFromFile();
  }

  return readFromFile();
}

export async function updateBlogPageSettings(input: Partial<BlogPageSettings>) {
  const existing = await getBlogPageSettings();
  const mergedHero = input.hero
    ? normalizeHeroSettings(input.hero, existing.hero)
    : existing.hero;
  const next = normalizeBlogPageSettings({
    ...existing,
    ...input,
    hero: mergedHero,
    introHeading: input.introHeading ?? mergedHero.heroTitle ?? existing.introHeading,
    introKicker: input.introKicker ?? mergedHero.heroSubtitle ?? existing.introKicker,
    updated_at: new Date().toISOString(),
  });

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from(TABLE).upsert(toRow(next), { onConflict: "id" });
    if (error?.message?.includes("intro_heading") || error?.message?.includes("intro_kicker") || error?.message?.includes("intro_text")) {
      const { error: fallbackError } = await supabase
        .from(TABLE)
        .upsert(toRowWithoutIntro(next), { onConflict: "id" });
      if (fallbackError) throw fallbackError;
    } else if (error) {
      throw error;
    }
  } catch {
    await writeToFile(next);
  }

  return next;
}
