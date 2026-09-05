"use client";

import { memo } from "react";
import { TextAreaField } from "@/components/admin/class-edit/fields";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import type { ClassOfferingContent } from "@/lib/cms/types";
import type { RichTextTypography } from "@/lib/cms/rich-text-typography";
import { createPostLearningBlockId } from "../defaultContent";
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
  const postLearningBlocks = content.postLearningBlocks ?? [];

  const addPostLearningBlock = () => {
    setField("postLearningBlocks", [
      ...postLearningBlocks,
      {
        id: createPostLearningBlockId(),
        title: "",
        description: "",
        enabled: true,
        order: postLearningBlocks.length,
      },
    ]);
  };

  const updatePostLearningBlock = (
    index: number,
    patch: Partial<ClassOfferingContent["postLearningBlocks"][number]>,
  ) => {
    setField(
      "postLearningBlocks",
      postLearningBlocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block,
      ),
    );
  };

  const movePostLearningBlock = (from: number, to: number) => {
    if (to < 0 || to >= postLearningBlocks.length || from === to) return;
    const blocks = [...postLearningBlocks];
    const [moved] = blocks.splice(from, 1);
    blocks.splice(to, 0, moved);
    setField("postLearningBlocks", blocks.map((block, order) => ({ ...block, order })));
  };

  const removePostLearningBlock = (index: number) => {
    if (!window.confirm("¿Eliminar este bloque adicional?")) return;
    setField(
      "postLearningBlocks",
      postLearningBlocks
        .filter((_, blockIndex) => blockIndex !== index)
        .map((block, order) => ({ ...block, order })),
    );
  };

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

        <div className="space-y-4 border-t border-outline-variant pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-label-lg font-semibold text-on-surface">Más bloques adicionales</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Se publicarán después del bloque anterior con el mismo diseño.
              </p>
            </div>
            <Button type="button" variant="outlined" size="sm" onClick={addPostLearningBlock}>
              + Añadir bloque
            </Button>
          </div>

          {postLearningBlocks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center text-body-sm text-on-surface-variant">
              Todavía no hay más bloques adicionales.
            </p>
          ) : (
            postLearningBlocks.map((block, index) => (
              <div
                key={block.id}
                className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">
                    Bloque adicional {index + 2}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Subir bloque adicional ${index + 2}`}
                      disabled={index === 0}
                      onClick={() => movePostLearningBlock(index, index - 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Bajar bloque adicional ${index + 2}`}
                      disabled={index === postLearningBlocks.length - 1}
                      onClick={() => movePostLearningBlock(index, index + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar bloque adicional ${index + 2}`}
                      onClick={() => removePostLearningBlock(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error transition-colors hover:bg-error-container"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </div>

                <Switch
                  checked={block.enabled}
                  label="Mostrar este bloque en la página pública"
                  description="El título y la descripción permanecen guardados cuando está oculto."
                  onCheckedChange={(enabled) => updatePostLearningBlock(index, { enabled })}
                />

                <ClassContentTextField
                  label="Título del bloque adicional"
                  value={block.title}
                  placeholder="Escribe el título"
                  onChange={(event) => updatePostLearningBlock(index, { title: event.target.value })}
                />

                <TextAreaField
                  label="Descripción del bloque adicional"
                  value={block.description}
                  placeholder="Escribe la descripción"
                  className="min-h-[140px]"
                  onChange={(event) => updatePostLearningBlock(index, { description: event.target.value })}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export const ClassContentLearningFields = memo(ClassContentLearningFieldsComponent);
