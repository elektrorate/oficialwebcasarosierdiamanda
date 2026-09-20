"use client";

import { memo } from "react";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import { StudioProfileBlock } from "@/features/studio/StudioProfileBlock";
import { assetPath } from "@/lib/assets";
import {
  normalizeRichTextTypography,
  richTextTypographyRevision,
} from "@/lib/cms/rich-text-typography";
import type { TeacherFormFields } from "../types";

export type TeacherFormPreviewProps = Pick<
  TeacherFormFields,
  "name" | "specialty" | "image_id" | "bio" | "bio_typography"
>;

function TeacherFormPreviewComponent({
  name,
  specialty,
  image_id,
  bio,
  bio_typography,
}: TeacherFormPreviewProps) {
  const typography = normalizeRichTextTypography(bio_typography);
  const previewKey = [
    name,
    specialty,
    image_id,
    bio,
    richTextTypographyRevision(typography),
  ].join("|");

  return (
    <SectionCard
      compact
      title="Vista previa"
      description="Así se verá el bloque del especialista en El Estudio."
      className="overflow-hidden"
    >
      <div
        className="overflow-hidden rounded-2xl border border-outline-variant bg-white p-4 sm:p-5"
        aria-label="Vista previa del especialista"
        aria-live="polite"
      >
        <StudioProfileBlock
          key={previewKey}
          name={name.trim() || "Nombre del especialista"}
          role={specialty.trim() || "Especialidad"}
          image={assetPath(image_id || "/img/social-1.jpg")}
          intro={bio.trim() || "La descripción aparecerá aquí."}
          introTypography={typography}
        />
      </div>
    </SectionCard>
  );
}

export const TeacherFormPreview = memo(TeacherFormPreviewComponent);
