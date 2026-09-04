"use client";

import { AdminInput } from "@/components/ui/AdminField";
import { AdminRichTextField } from "@/components/ui/AdminRichTextField";
import { ClassContentLearningFields } from "@/components/admin/class-content/components/ClassContentLearningFields";
import { resolveContentTypography } from "@/components/admin/class-content/typography";
import type { ClassOfferingContent } from "@/lib/cms/types";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { useBasicInfoFields } from "../hooks/useBasicInfoFields";
import { useBasicInfoTypography } from "../hooks/useBasicInfoTypography";
import { DETAIL_PAGE_RICH_TEXT_CONTROLS } from "../constants/rich-text-controls";
import { SectionCard } from "./SectionCard";

type BasicInfoSectionProps = {
  form: ClassEditFormState;
};

export function BasicInfoSection({ form }: BasicInfoSectionProps) {
  const { title, slug, subtitle, description, details, errors, handleContentChange } = form;
  const typography = useBasicInfoTypography(details);
  const {
    handleSlugBlur,
    handleTitleChange,
    handleSlugChange,
    handleSubtitleChange,
    handleDescriptionChange,
    updateMenuTitle,
    updateDetails,
  } = useBasicInfoFields(form);

  const setContentField = <K extends keyof ClassOfferingContent>(
    field: K,
    value: ClassOfferingContent[K],
  ) => {
    handleContentChange({ ...details.content, [field]: value });
  };

  return (
    <SectionCard compact>
      <div className="class-edit-field-grid class-edit-field-grid--identity">
        <AdminInput
          label="Título del menú"
          required
          value={details.menuTitle}
          error={errors.menuTitle}
          validationKey="menuTitle"
          help="Nombre visible de esta página dentro del menú público."
          onChange={(event) => updateMenuTitle(event.target.value)}
        />
        <AdminInput
          label="Slug"
          required
          value={slug}
          error={errors.slug}
          validationKey="slug"
          help="Si el slug ya existe, se agregará automáticamente un número al final."
          onChange={(event) => handleSlugChange(event.target.value)}
        />
        <AdminInput
          label="Etiqueta interna"
          required
          value={title}
          error={errors.title}
          validationKey="title"
          help="Nombre administrativo de la página."
          onChange={(event) => handleTitleChange(event.target.value)}
          onBlur={handleSlugBlur}
        />
      </div>

      <div className="class-edit-rich-text-stack">
        <AdminRichTextField
          label="Título de página"
          labelPlacement="editor"
          value={subtitle}
          typography={typography.subtitle}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          layout="compact"
          onChange={handleSubtitleChange}
          onTypographyChange={(next) => updateDetails({ subtitleTypography: next })}
          minHeight="100px"
          help="Tipografía global en el panel inferior. Usa negrita, cursiva o subrayado para énfasis parcial."
        />
        <AdminRichTextField
          label="Pregunta / frase introductoria"
          labelPlacement="editor"
          value={details.detailQuestion}
          typography={typography.detailQuestion}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          layout="compact"
          onChange={(value) => updateDetails({ detailQuestion: value })}
          onTypographyChange={(next) => updateDetails({ detailQuestionTypography: next })}
          minHeight="100px"
        />
        <AdminRichTextField
          label="Texto remarcado (café)"
          labelPlacement="editor"
          value={details.highlightDescription}
          typography={typography.highlight}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          layout="compact"
          onChange={(value) => updateDetails({ highlightDescription: value })}
          onTypographyChange={(next) => updateDetails({ highlightDescriptionTypography: next })}
          minHeight="110px"
        />
        <AdminRichTextField
          label="Texto normal / descripción"
          labelPlacement="editor"
          value={description}
          typography={typography.description}
          controls={DETAIL_PAGE_RICH_TEXT_CONTROLS}
          layout="compact"
          onChange={handleDescriptionChange}
          onTypographyChange={(next) => updateDetails({ descriptionTypography: next })}
          minHeight="130px"
        />
        <div className="border-t border-outline-variant pt-5">
          <ClassContentLearningFields
            content={details.content}
            typography={resolveContentTypography(details.content.learningContentTypography)}
            setField={setContentField}
          />
        </div>
      </div>

      <div className="class-edit-field-grid class-edit-field-grid--meta">
        <AdminInput
          label="WhatsApp"
          value={details.whatsappNumber}
          error={errors.whatsappNumber}
          validationKey="whatsappNumber"
          help="Formato internacional sin espacios. Ej: 34633788860"
          onChange={(event) => updateDetails({ whatsappNumber: event.target.value })}
        />
      </div>
    </SectionCard>
  );
}
