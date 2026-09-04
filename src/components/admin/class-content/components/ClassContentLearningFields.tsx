"use client";

import { memo } from "react";
import { TextAreaField } from "@/components/admin/class-edit/fields";
import Switch from "@/components/ui/Switch";
import type { ClassOfferingContent } from "@/lib/cms/types";
import type { RichTextTypography } from "@/lib/cms/rich-text-typography";
import { ClassContentRichTextField } from "./ClassContentRichTextField";
import { ClassContentTextField } from "./ClassContentTextField";

type SetContentField = <K extends keyof ClassOfferingContent>(
  field: K,
  value: ClassOfferingContent[K],
) => void;

type ClassContentLearningFieldsProps = {
  content: ClassOfferingContent;
  typography: RichTextTypography;
  setField: SetContentField;
};

function ClassContentLearningFieldsComponent({
  content,
  typography,
  setField,
}: ClassContentLearningFieldsProps) {
  return (
    <div className="space-y-5">
      <Switch
        checked={content.showLearningSection}
        label="Mostrar ¿Qué aprenderás? en la página pública"
        description="El texto permanece guardado aunque esta sección esté oculta."
        onCheckedChange={(checked) => setField("showLearningSection", checked)}
      />

      <ClassContentTextField
        label="Título de la sección '¿Qué aprenderás?'"
        value={content.learningSectionTitle}
        placeholder="¿Qué aprenderás?"
        onChange={(event) => setField("learningSectionTitle", event.target.value)}
      />

      <ClassContentRichTextField
        label="¿Qué aprenderás?"
        value={content.learningContent}
        typography={typography}
        minHeight="200px"
        placeholder="Módulo 1. Arcillas y propiedades de la materia cerámica.&#10;Módulo 2. Modelado manual y técnicas constructivas básicas."
        help="Tipografía del bloque en el panel. Negrita/cursiva del toolbar para énfasis parcial."
        onChange={(value) => setField("learningContent", value)}
        onTypographyChange={(learningContentTypography) =>
          setField("learningContentTypography", learningContentTypography)
        }
      />

      <div className="space-y-5 border-t border-outline-variant pt-5">
        <Switch
          checked={content.showPostLearningSection}
          label="Mostrar bloque adicional después de ¿Qué aprenderás?"
          description="El título y la descripción permanecen guardados aunque el bloque esté oculto."
          onCheckedChange={(checked) => setField("showPostLearningSection", checked)}
        />

        <ClassContentTextField
          label="Título del bloque adicional"
          value={content.postLearningTitle}
          placeholder="Escribe el título"
          onChange={(event) => setField("postLearningTitle", event.target.value)}
        />

        <TextAreaField
          label="Descripción del bloque adicional"
          value={content.postLearningDescription}
          placeholder="Escribe la descripción"
          className="min-h-[140px]"
          onChange={(event) => setField("postLearningDescription", event.target.value)}
        />
      </div>
    </div>
  );
}

export const ClassContentLearningFields = memo(ClassContentLearningFieldsComponent);
