import type { CSSProperties } from "react";

export interface RichTextTypography {
  italic: boolean;
  weight: number;
  width: number;
  fontSize: number;
  lineHeight?: number;
}

export const DEFAULT_RICH_TEXT_TYPOGRAPHY: RichTextTypography = {
  italic: false,
  weight: 400,
  width: 100,
  fontSize: 28,
  lineHeight: 1.38,
};

export const RICH_TEXT_FONT_SIZE_MIN = 12;
export const RICH_TEXT_FONT_SIZE_MAX = 72;

export function normalizeRichTextTypography(value: unknown): RichTextTypography {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<RichTextTypography>
    : {};

  const fontSize = Number(source.fontSize);
  const weight = Number(source.weight);
  const width = Number(source.width);
  const lineHeight = Number(source.lineHeight);

  return {
    italic: Boolean(source.italic),
    weight: Number.isFinite(weight) ? Math.min(900, Math.max(100, weight)) : DEFAULT_RICH_TEXT_TYPOGRAPHY.weight,
    width: Number.isFinite(width) ? Math.min(125, Math.max(75, width)) : DEFAULT_RICH_TEXT_TYPOGRAPHY.width,
    fontSize: Number.isFinite(fontSize)
      ? Math.min(RICH_TEXT_FONT_SIZE_MAX, Math.max(RICH_TEXT_FONT_SIZE_MIN, fontSize))
      : DEFAULT_RICH_TEXT_TYPOGRAPHY.fontSize,
    lineHeight: Number.isFinite(lineHeight)
      ? Math.min(2, Math.max(0.8, lineHeight))
      : DEFAULT_RICH_TEXT_TYPOGRAPHY.lineHeight,
  };
}

/** CSS custom properties only. Numeric values must be strings — React appends `px` to bare numbers. */
export function richTextTypographyCssVars(typography: RichTextTypography): CSSProperties {
  return {
    "--tiptap-preview-font-size": `${typography.fontSize}px`,
    "--tiptap-preview-font-weight": String(typography.weight),
    "--tiptap-preview-font-stretch": `${typography.width}%`,
    "--tiptap-preview-font-width": String(typography.width),
    "--tiptap-preview-font-style": typography.italic ? "italic" : "normal",
    "--tiptap-preview-line-height": String(typography.lineHeight ?? 1.38),
    "--content-card-excerpt-font-size": `${typography.fontSize}px`,
    "--content-card-excerpt-font-weight": String(typography.weight),
    "--content-card-excerpt-font-stretch": `${typography.width}%`,
    "--content-card-excerpt-font-width": String(typography.width),
    "--content-card-excerpt-font-style": typography.italic ? "italic" : "normal",
  } as CSSProperties;
}

export function richTextTypographyFontStyle(typography: RichTextTypography): CSSProperties {
  return {
    fontSize: `${typography.fontSize}px`,
    fontWeight: typography.weight,
    fontStretch: `${typography.width}%`,
    fontStyle: typography.italic ? "italic" : "normal",
    fontVariationSettings: `"wdth" ${typography.width}, "wght" ${typography.weight}`,
  };
}

export function richTextTypographyStyle(typography: RichTextTypography): CSSProperties {
  return {
    ...richTextTypographyCssVars(typography),
    ...richTextTypographyFontStyle(typography),
  } as CSSProperties;
}

export function richTextTypographyRevision(typography: RichTextTypography | undefined | null): string {
  if (!typography) return "";
  return [typography.fontSize, typography.weight, typography.width, typography.lineHeight ?? 1.38, typography.italic ? 1 : 0].join(":");
}

export type DetailTextTypographyScope =
  | "subtitle"
  | "detailQuestion"
  | "highlight"
  | "description";

const DETAIL_TEXT_CSS_PREFIX: Record<DetailTextTypographyScope, string> = {
  subtitle: "class-detail-subtitle",
  detailQuestion: "class-detail-question",
  highlight: "class-detail-highlight",
  description: "class-detail-copy",
};

export function detailTextTypographyStyle(
  typography: RichTextTypography,
  scope: DetailTextTypographyScope,
): CSSProperties {
  const prefix = DETAIL_TEXT_CSS_PREFIX[scope];
  return {
    [`--${prefix}-font-size`]: `${typography.fontSize}px`,
    [`--${prefix}-font-weight`]: String(typography.weight),
    [`--${prefix}-font-stretch`]: `${typography.width}%`,
    [`--${prefix}-font-width`]: String(typography.width),
    [`--${prefix}-font-style`]: typography.italic ? "italic" : "normal",
    ...richTextTypographyStyle(typography),
  } as CSSProperties;
}

export const DEFAULT_DESCRIPTION_TYPOGRAPHY: RichTextTypography = {
  ...DEFAULT_RICH_TEXT_TYPOGRAPHY,
  fontSize: 18,
};
