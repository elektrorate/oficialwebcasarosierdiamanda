"use client";

import { AdminInput } from "@/components/ui/AdminField";
import { AdminRichTextField } from "@/components/ui/AdminRichTextField";
import Switch from "@/components/ui/Switch";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { Offering } from "@/lib/cms/types";
import { DETAIL_PAGE_RICH_TEXT_CONTROLS } from "../constants/rich-text-controls";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { MediaPickerField } from "./MediaPickerField";
import { SectionCard } from "./SectionCard";

const HOME_CARD_SHORT_TEXT_CONTROLS = DETAIL_PAGE_RICH_TEXT_CONTROLS.filter(
  (control) => control !== "ul" && control !== "ol" && control !== "blockquote",
);

type HomeCardEditorSectionProps = {
  offering: Offering;
  form: ClassEditFormState;
};

export function HomeCardEditorSection({ offering, form }: HomeCardEditorSectionProps) {
  const { title, details, uploadingTarget, uploadImage, setPickerTarget, updateHomeCard } = form;
  const supportsExtendedHomeCopy = offering.type === "gift_card";
  const eyebrowTypography = normalizeRichTextTypography(
    details.homeCard.eyebrowTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 14 },
  );
  const titleTypography = normalizeRichTextTypography(
    details.homeCard.titleTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 26 },
  );
  const taglineTypography = normalizeRichTextTypography(
    details.homeCard.taglineTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 21 },
  );
  const excerptTypography = normalizeRichTextTypography(details.homeCard.excerptTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY);

  return (
    <SectionCard
      compact
      title="Contenido de la tarjeta"
      description="Estos campos controlan únicamente la tarjeta destacada de la portada. No cambian el Hero ni la página detallada."
    >
      <div className="class-edit-home-editor-grid">
        <div className="class-edit-home-editor-grid__media space-y-4">
          <MediaPickerField
            label="Imagen de la tarjeta"
            image={details.homeCard.image}
            alt={details.homeCard.imageAlt || details.homeCard.title || title || "Imagen de la tarjeta"}
            emptyMessage="Sin imagen específica. En Home se usará la imagen de portada actual."
            uploadInputId="home-card-upload"
            isUploading={uploadingTarget === "home"}
            onPickFromLibrary={() => setPickerTarget("home")}
            onUpload={(file) => void uploadImage("home", file)}
            onRemove={() => updateHomeCard({ image: "" })}
          />
          <AdminInput
            label="Texto alternativo de la imagen"
            value={details.homeCard.imageAlt}
            placeholder={details.homeCard.title || title || "Descripción breve de la imagen"}
            help="Si queda vacío, se utilizará el título de la tarjeta."
            onChange={(event) => updateHomeCard({ imageAlt: event.target.value })}
          />
        </div>

        <div className="class-edit-home-editor-grid__copy space-y-4">
          {supportsExtendedHomeCopy ? (
            <Switch
              checked={details.homeCard.showEyebrow !== false}
              label="Mostrar etiqueta superior"
              description="Si la desactivas, la tarjeta publicada no mostrará esta etiqueta ni utilizará un texto automático."
              onCheckedChange={(showEyebrow) => updateHomeCard({ showEyebrow })}
            />
          ) : null}
          <div className="class-edit-home-text-fields">
            {supportsExtendedHomeCopy && details.homeCard.showEyebrow !== false ? (
              <AdminRichTextField
                label="Etiqueta superior"
                value={details.homeCard.eyebrow}
                placeholder={details.heroSubtitle || offering.type}
                typography={eyebrowTypography}
                controls={HOME_CARD_SHORT_TEXT_CONTROLS}
                layout="compact"
                minHeight="58px"
                help="Ejemplo: CLASES · INICIACIÓN."
                onChange={(value) => updateHomeCard({ eyebrow: value })}
                onTypographyChange={(next) => updateHomeCard({ eyebrowTypography: next })}
              />
            ) : null}
            <AdminRichTextField
              label="Título para Home"
              value={details.homeCard.title}
              placeholder={title || "Título de la tarjeta"}
              typography={titleTypography}
              controls={HOME_CARD_SHORT_TEXT_CONTROLS}
              layout="compact"
              minHeight="68px"
              help="Puede ser distinto del título del Hero y de la página detallada."
              onChange={(value) => updateHomeCard({ title: value })}
              onTypographyChange={(next) => updateHomeCard({ titleTypography: next })}
            />
            {supportsExtendedHomeCopy ? (
              <AdminRichTextField
                label="Subtítulo para Home"
                value={details.homeCard.tagline}
                placeholder={form.subtitle || title || "Segunda línea de la tarjeta"}
                typography={taglineTypography}
                controls={HOME_CARD_SHORT_TEXT_CONTROLS}
                layout="compact"
                minHeight="64px"
                help="Si queda vacío, usa el título de página."
                onChange={(value) => updateHomeCard({ tagline: value })}
                onTypographyChange={(next) => updateHomeCard({ taglineTypography: next })}
              />
            ) : null}
          </div>

          <AdminRichTextField
            label="Descripción corta para Home"
            labelPlacement="editor"
            value={details.homeCard.excerpt}
            typography={excerptTypography}
            controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
            layout="compact"
            onChange={(value) => updateHomeCard({ excerpt: value })}
            onTypographyChange={(next) => updateHomeCard({ excerptTypography: next })}
            minHeight="120px"
            placeholder={details.highlightDescription || "Resumen breve para la tarjeta de portada."}
            help="Tipografía global en el panel inferior. Usa negrita, cursiva o subrayado para énfasis parcial."
          />
        </div>
      </div>
    </SectionCard>
  );
}
