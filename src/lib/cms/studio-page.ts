import { promises as fs } from "fs";
import path from "path";
import { createAdminClient } from "../supabase/admin";
import { defaultHeroSettings, normalizeHeroSettings } from "./hero-settings";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  normalizeRichTextTypography,
} from "./rich-text-typography";
import type { StudioPageSettings } from "./types";

const TABLE = "studio_page_settings";
const FILE_PATH = path.join(process.cwd(), "data", "studio-page-settings.json");
const SETTINGS_ID = "studio-page";

export const defaultStudioPageSettings: StudioPageSettings = {
  id: SETTINGS_ID,
  status: "published",
  hero: normalizeHeroSettings({
    ...defaultHeroSettings,
    heroVariant: "presentation",
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    heroPresentationText: "",
  }),
  introHeading: "",
  introContent: "",
  introContentTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
  showIdeaPromptSection: true,
  showFaqSection: false,
  faqGroupId: "",
  seo_title: "",
  seo_description: "",
  seo_image: "",
  updated_at: "",
};

function normalizeStudioPageSettings(input: Partial<StudioPageSettings> | null | undefined): StudioPageSettings {
  const rowInput = input as Partial<StudioPageSettings> & {
    intro_heading?: string;
    intro_content?: string;
    intro_content_typography?: unknown;
    show_idea_prompt_section?: boolean;
    show_faq_section?: boolean;
    faq_group_id?: string | null;
    faq_category?: string;
  } | null | undefined;

  return {
    ...defaultStudioPageSettings,
    ...input,
    id: SETTINGS_ID,
    status: input?.status === "draft" ? "draft" : "published",
    hero: normalizeHeroSettings(input?.hero, {
      heroTitle: "",
      heroSubtitle: "",
      heroImage: "",
    }),
    introHeading: String(
      input?.introHeading ?? rowInput?.intro_heading ?? defaultStudioPageSettings.introHeading,
    ),
    introContent: String(input?.introContent ?? rowInput?.intro_content ?? defaultStudioPageSettings.introContent),
    introContentTypography: normalizeRichTextTypography(
      input?.introContentTypography ?? rowInput?.intro_content_typography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
    ),
    showIdeaPromptSection: (input?.showIdeaPromptSection ?? rowInput?.show_idea_prompt_section) !== false,
    showFaqSection: (input?.showFaqSection ?? rowInput?.show_faq_section) === true,
    faqGroupId: String(input?.faqGroupId ?? rowInput?.faq_group_id ?? ""),
    seo_title: String(input?.seo_title ?? defaultStudioPageSettings.seo_title),
    seo_description: String(input?.seo_description ?? defaultStudioPageSettings.seo_description),
    seo_image: String(input?.seo_image ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

function toRow(settings: StudioPageSettings) {
  return {
    id: settings.id,
    status: settings.status,
    hero: settings.hero,
    intro_heading: settings.introHeading,
    intro_content: settings.introContent,
    intro_content_typography: normalizeRichTextTypography(
      settings.introContentTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY,
    ),
    show_idea_prompt_section: settings.showIdeaPromptSection,
    show_faq_section: settings.showFaqSection,
    faq_group_id: settings.faqGroupId || null,
    seo_title: settings.seo_title,
    seo_description: settings.seo_description,
    seo_image: settings.seo_image,
    updated_at: settings.updated_at,
  };
}

async function readFromFile() {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalizeStudioPageSettings(JSON.parse(raw) as Partial<StudioPageSettings>);
  } catch {
    return defaultStudioPageSettings;
  }
}

async function writeToFile(settings: StudioPageSettings) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export async function getStudioPageSettings() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", SETTINGS_ID).maybeSingle();
    if (error) throw error;
    if (data) return normalizeStudioPageSettings(data as Partial<StudioPageSettings>);
  } catch {
    return readFromFile();
  }

  return readFromFile();
}

export async function updateStudioPageSettings(input: Partial<StudioPageSettings>) {
  const next = normalizeStudioPageSettings({
    ...input,
    updated_at: new Date().toISOString(),
  });

  try {
    const supabase = createAdminClient();
    let { error } = await supabase.from(TABLE).upsert(toRow(next), { onConflict: "id" });
    if (error?.message?.includes("intro_content_typography") || error?.message?.includes("intro_heading")) {
      const {
        intro_content_typography: _typography,
        intro_heading: _heading,
        ...legacyRow
      } = toRow(next) as Record<string, unknown>;
      ({ error } = await supabase.from(TABLE).upsert(legacyRow, { onConflict: "id" }));
    }
    if (error) throw error;
  } catch {
    await writeToFile(next);
  }

  return next;
}
