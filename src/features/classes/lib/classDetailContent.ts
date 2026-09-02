import type { CSSProperties } from "react";
import type { ExperienceItem } from "@/data/types";
import { normalizeRichTextTypography } from "@/lib/cms/rich-text-typography";

/** CMS weight/width/italic only — editorial CSS owns font-size hierarchy. */
export function editorialDetailTypographyStyle(value: unknown): CSSProperties {
  const typography = normalizeRichTextTypography(value);
  return {
    fontWeight: typography.weight,
    fontStretch: `${typography.width}%`,
    fontStyle: typography.italic ? "italic" : "normal",
    fontVariationSettings: `"wdth" ${typography.width}, "wght" ${typography.weight}`,
  };
}

export function includedMarkdownSource(items: string[]) {
  const lines = items.map((item) => item.replace(/\r\n/g, "\n"));
  const joined = lines.join("\n").trim();
  if (!joined) return "";
  if (/^\s*(?:[-*]|\d+\.|#{1,3})\s+/m.test(joined) || /<\/?(?:p|ul|ol|h[1-3])\b/i.test(joined)) {
    return joined;
  }
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

export function hasMeaningfulContent(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : [value ?? ""];
  return values.some((entry) =>
    entry
      .replace(/<br\s*\/?\s*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim().length > 0,
  );
}

export function titleMarkdownToInline(source: string) {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^#{1,3}\s+/, "").replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function hasMeaningfulProgramItem(item: ExperienceItem["program"][number]) {
  return (
    hasMeaningfulContent(item.title) ||
    hasMeaningfulContent(item.content) ||
    (item.points?.some((point) => hasMeaningfulContent(point)) ?? false)
  );
}

export function visibleCalendarLabels(item: ExperienceItem) {
  if (item.showCalendarLabels !== true) return [];
  return (item.calendarLabels ?? [])
    .filter((label) => label.active && label.days.length > 0 && daysInMonth(label.year, label.month) > 0)
    .sort((a, b) => a.year - b.year || a.month - b.month || a.order - b.order);
}

function daysInMonth(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 0;
  return new Date(year, month, 0).getDate();
}

export const CLASS_DETAIL_MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const CLASS_DETAIL_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function calendarMonthCells(year: number, month: number) {
  const count = daysInMonth(year, month);
  if (!count) return [] as Array<number | null>;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
}

export function formatCalendarDays(days: number[]) {
  if (days.length <= 1) return days.join("");
  if (days.length === 2) return `${days[0]} y ${days[1]}`;
  return `${days.slice(0, -1).join(", ")} y ${days[days.length - 1]}`;
}
