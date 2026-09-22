"use client";

import { useMemo } from "react";
import { AdminInput } from "@/components/ui/AdminField";
import { AdminRichTextField } from "@/components/ui/AdminRichTextField";
import ColorPickerField from "@/components/admin/ColorPickerField";
import MediaSelectField from "@/components/admin/MediaSelectField";
import { DETAIL_PAGE_RICH_TEXT_CONTROLS } from "@/components/admin/class-edit/constants/rich-text-controls";
import { defaultClassDetails } from "@/components/admin/class-edit/constants";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { CmsHeroSettings } from "@/lib/cms/types";
import { presentationHeroDisplayValues } from "../heroEditorModel";
import type { SharedHeroEditorState } from "../types";
import { heroPreviewContentRevision } from "../utils";

type HeroContentFieldsProps = {
  details: CmsHeroSettings;
  titleFallback: string;
  subtitleFallback?: string;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
};

function HeroBackgroundFields({ details, onChange }: Pick<HeroContentFieldsProps, "details" | "onChange">) {
  return (
    <div className="class-edit-hero-media-grid">
      <MediaSelectField
        label="Imagen de fondo"
        value={details.heroImage}
        onChange={(heroImage) => onChange({ heroImage })}
        className="cms-shared-hero-image-fields__background"
        previewClassName="cms-shared-hero-media-preview"
      />
      <MediaSelectField
        label="Imagen de fondo para móvil (opcional)"
        value={details.heroImageMobile}
        onChange={(heroImageMobile) => onChange({ heroImageMobile })}
        className="cms-shared-hero-image-fields__background-mobile"
        previewClassName="cms-shared-hero-media-preview"
      />
    </div>
  );
}

function HeroImageVariantFields({ details, onChange }: Pick<HeroContentFieldsProps, "details" | "onChange">) {
  return (
    <div className="class-edit-hero-content-stack">
      <HeroBackgroundFields details={details} onChange={onChange} />
      <div className="class-edit-field-grid class-edit-field-grid--meta">
        <AdminInput
          label="URL del video de fondo"
          value={details.heroVideoUrl}
          placeholder="https://.../hero.mp4"
          help="Opcional. Si lo rellenas, este video sustituye a la imagen de fondo en el hero con imagen."
          onChange={(event) => onChange({ heroVideoUrl: event.target.value })}
        />
        <AdminInput
          label="URL del video para movil (opcional)"
          value={details.heroVideoUrlMobile}
          placeholder="https://.../hero-mobile.mp4"
          help="Admite Vimeo o una URL directa .mp4/.webm. En móvil, usa preferiblemente un archivo vertical o cuadrado."
          onChange={(event) => onChange({ heroVideoUrlMobile: event.target.value })}
        />
      </div>
      <MediaSelectField
        label="Poster del video (opcional)"
        value={details.heroVideoPoster}
        onChange={(heroVideoPoster) => onChange({ heroVideoPoster })}
        previewClassName="cms-shared-hero-media-preview"
      />
      <div className="class-edit-hero-overlay-grid">
        <p className="class-edit-hero-overlay-grid__head">
          <strong>Imágenes superpuestas</strong>
          <span>La imagen 1 se muestra detrás y la imagen 2 se coloca delante para formar la composición visual.</span>
        </p>
        <MediaSelectField
          label="Imagen superpuesta 1"
          value={details.titleImage}
          onChange={(titleImage) => onChange({ titleImage })}
          previewClassName="cms-shared-hero-title-preview"
        />
        <MediaSelectField
          label="Imagen superpuesta 2"
          value={details.titleImageSecondary}
          onChange={(titleImageSecondary) => onChange({ titleImageSecondary })}
          previewClassName="cms-shared-hero-title-preview"
        />
      </div>
    </div>
  );
}

function HeroPresentationVariantFields({
  details,
  titleFallback,
  subtitleFallback,
  onChange,
}: Pick<HeroContentFieldsProps, "details" | "titleFallback" | "subtitleFallback" | "onChange">) {
  const displayRevision = heroPreviewContentRevision(details, titleFallback, subtitleFallback);
  const display = useMemo(
    () => presentationHeroDisplayValues(details, titleFallback, subtitleFallback),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- displayRevision tracks presentation copy inputs
    [displayRevision],
  );
  const presentationTextTypography = normalizeRichTextTypography(
    details.heroPresentationTextTypography ?? defaultClassDetails.heroPresentationTextTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY,
  );
  const presentationSubtitleTypography = normalizeRichTextTypography(
    details.heroPresentationSubtitleTypography ?? defaultClassDetails.heroPresentationSubtitleTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 22 },
  );

  // Prefer persisted field values so markdown marks (`**bold**`) stay the controlled source of truth.
  // Fall back to derived display copy only when the stored field is still empty.
  const presentationTextValue = details.heroPresentationText.trim()
    ? details.heroPresentationText
    : display.heroPresentationText;
  const presentationSubtitleValue = details.heroPresentationSubtitle.trim()
    ? details.heroPresentationSubtitle
    : display.heroPresentationSubtitle;

  return (
    <div className="class-edit-hero-presentation-grid">
      <div className="class-edit-hero-presentation-grid__copy class-edit-rich-text-stack">
        <AdminRichTextField
          label="Texto de presentación"
          labelPlacement="editor"
          layout="compact"
          value={presentationTextValue}
          typography={presentationTextTypography}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          minHeight="160px"
          onChange={(heroPresentationText) => onChange({ heroPresentationText })}
          onTypographyChange={(heroPresentationTextTypography) => onChange({ heroPresentationTextTypography })}
        />
        <AdminRichTextField
          label="Texto sub-título"
          labelPlacement="editor"
          layout="compact"
          value={presentationSubtitleValue}
          typography={presentationSubtitleTypography}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          minHeight="120px"
          onChange={(heroPresentationSubtitle) => onChange({ heroPresentationSubtitle })}
          onTypographyChange={(heroPresentationSubtitleTypography) => onChange({ heroPresentationSubtitleTypography })}
        />
      </div>
      <aside className="class-edit-hero-presentation-grid__side space-y-4">
        <MediaSelectField
          label="Imagen lateral"
          value={display.heroPresentationImage}
          onChange={(heroPresentationImage) => onChange({ heroPresentationImage })}
          previewClassName="cms-shared-hero-side-preview"
        />
        <div className="class-edit-hero-cta-stack">
          <ColorPickerField
            label="Color del texto"
            value={details.heroPresentationTextColor || "#FFFFFF"}
            onChange={(heroPresentationTextColor) => onChange({ heroPresentationTextColor })}
          />
          <AdminInput
            label="Texto del CTA"
            value={details.heroPresentationCtaLabel}
            placeholder="Descubrir"
            onChange={(event) => onChange({ heroPresentationCtaLabel: event.target.value })}
          />
          <AdminInput
            label="Enlace del CTA"
            value={details.heroPresentationCtaHref}
            placeholder="/clases o https://..."
            onChange={(event) => onChange({ heroPresentationCtaHref: event.target.value })}
          />
          <div className="class-edit-field-grid class-edit-field-grid--meta">
            <ColorPickerField
              label="Fondo del CTA"
              value={details.heroPresentationCtaBackgroundColor || "#FFFFFF"}
              onChange={(heroPresentationCtaBackgroundColor) => onChange({ heroPresentationCtaBackgroundColor })}
            />
            <ColorPickerField
              label="Texto del CTA"
              value={details.heroPresentationCtaTextColor || "#3f3933"}
              onChange={(heroPresentationCtaTextColor) => onChange({ heroPresentationCtaTextColor })}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={details.heroPresentationCtaEnabled}
                onChange={(event) => onChange({ heroPresentationCtaEnabled: event.target.checked })}
              />
              <span>Mostrar CTA</span>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={details.heroPresentationCtaNewTab}
                onChange={(event) => onChange({ heroPresentationCtaNewTab: event.target.checked })}
              />
              <span>Abrir en nueva pestaña</span>
            </label>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function HeroContentFields({
  details,
  titleFallback,
  subtitleFallback,
  editor,
  onChange,
}: HeroContentFieldsProps) {
  return (
    <div className="class-edit-hero-content-stack">
      {editor.isTextHero ? (
        <div className="class-edit-field-grid class-edit-field-grid--meta">
          <AdminInput
            label="Título del hero tipográfico"
            value={details.heroTitle}
            placeholder={titleFallback}
            onChange={(event) => onChange({ heroTitle: event.target.value })}
          />
          <AdminInput
            label="Subtítulo del hero tipográfico"
            value={details.heroSubtitle}
            placeholder={subtitleFallback}
            onChange={(event) => onChange({ heroSubtitle: event.target.value })}
          />
        </div>
      ) : null}
      {editor.isPresentationHero ? <HeroBackgroundFields details={details} onChange={onChange} /> : null}
      {editor.isImageHero ? <HeroImageVariantFields details={details} onChange={onChange} /> : null}
      {editor.isPresentationHero ? (
        <HeroPresentationVariantFields
          details={details}
          titleFallback={titleFallback}
          subtitleFallback={subtitleFallback}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}
