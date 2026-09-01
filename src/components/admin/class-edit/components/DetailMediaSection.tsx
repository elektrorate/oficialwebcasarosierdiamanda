"use client";

import { memo } from "react";
import Switch from "@/components/ui/Switch";
import { AdminInput } from "@/components/ui/AdminField";
import { AdminRichTextField } from "@/components/ui/AdminRichTextField";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
} from "@/lib/cms/rich-text-typography";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { useDetailMediaHandlers } from "../hooks/useDetailMediaHandlers";
import { DETAIL_PAGE_RICH_TEXT_CONTROLS } from "../constants/rich-text-controls";
import { defaultClassDetails } from "../constants";
import { MediaPickerField } from "./MediaPickerField";
import { SectionCard } from "./SectionCard";

type DetailMediaSectionProps = {
  form: ClassEditFormState;
};

function DetailMediaSectionComponent({ form }: DetailMediaSectionProps) {
  const media = useDetailMediaHandlers(form);
  const includedTypography = normalizeRichTextTypography(
    form.details.includedItemsTypography
      ?? defaultClassDetails.includedItemsTypography
      ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 16 },
  );

  return (
    <SectionCard compact>
      <div className="class-edit-media-layout">
        <div className="class-edit-media-layout__copy class-edit-rich-text-stack">
          <AdminInput
            label="Título de la sección"
            value={form.details.includedSectionTitle}
            placeholder="Incluye"
            onChange={(event) => form.updateDetails({ includedSectionTitle: event.target.value })}
          />
          <AdminRichTextField
            label="Contenido de la sección"
            labelPlacement="editor"
            layout="compact"
            value={media.includedItemsText}
            typography={includedTypography}
            controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
            minHeight="160px"
            placeholder="Un elemento por línea. Usa negrita, cursiva, listas y enlaces."
            help="La tipografía del bloque se aplica a toda la lista. Negrita/cursiva del toolbar sirven para énfasis parcial."
            onChange={media.updateIncludedItems}
            onTypographyChange={(includedItemsTypography) => form.updateDetails({ includedItemsTypography })}
          />
          <Switch
            checked={media.showIncludedSection}
            label={`Mostrar ${form.details.includedSectionTitle.trim() || "Incluye"} en la página pública`}
            description="Activa o desactiva únicamente esta sección en el frontend público."
            onCheckedChange={media.setShowIncludedSection}
          />
        </div>

        <div className="class-edit-media-layout__video">
          <AdminInput
            label="URL / Fuente del video"
            value={media.videoUrl}
            placeholder="https://..."
            onChange={(event) => media.setVideoUrl(event.target.value)}
          />
          <MediaPickerField
            label="Poster del video"
            image={media.videoPoster}
            alt="Poster de video"
            emptyMessage="Sin poster. Se mostrará el reproductor sin imagen de portada."
            uploadInputId="videoPoster-upload"
            isUploading={media.uploadingTarget === "videoPoster"}
            uploadLabel={media.videoPoster ? "Sustituir" : "Subir imagen"}
            libraryLabel={media.videoPoster ? "Abrir biblioteca" : "Seleccionar imagen"}
            onPickFromLibrary={media.openVideoPosterLibrary}
            onUpload={media.uploadVideoPoster}
            onRemove={media.clearVideoPoster}
          />
        </div>
      </div>
    </SectionCard>
  );
}

export const DetailMediaSection = memo(DetailMediaSectionComponent);
