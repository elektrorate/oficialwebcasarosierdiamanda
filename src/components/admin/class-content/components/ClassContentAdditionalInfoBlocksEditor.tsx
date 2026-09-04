"use client";

import { memo } from "react";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import type { ClassContentEditor } from "../hooks/useClassContentEditor";
import { ClassContentRichTextField } from "./ClassContentRichTextField";
import { ClassContentFieldLabel, ClassContentTextField } from "./ClassContentTextField";

type Props = Pick<
  ClassContentEditor,
  | "content"
  | "addExtraInfoBlock"
  | "updateExtraInfoBlock"
  | "moveExtraInfoBlock"
  | "removeExtraInfoBlock"
  | "resolveModuleTypography"
>;

function ClassContentAdditionalInfoBlocksEditorComponent({
  content,
  addExtraInfoBlock,
  updateExtraInfoBlock,
  moveExtraInfoBlock,
  removeExtraInfoBlock,
  resolveModuleTypography,
}: Props) {
  const blocks = content.extraInfoBlocks ?? [];

  return (
    <div className="space-y-4 rounded-xl border border-outline-variant p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ClassContentFieldLabel>Bloques adicionales</ClassContentFieldLabel>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Se mostrarán bajo Información adicional con el mismo estilo de tarjeta.
          </p>
        </div>
        <Button type="button" variant="outlined" size="sm" onClick={addExtraInfoBlock}>
          + Añadir bloque
        </Button>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center text-body-sm text-on-surface-variant">
          Todavía no hay bloques adicionales.
        </p>
      ) : (
        blocks.map((block, index) => (
          <div key={block.id} className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">
                Bloque {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Subir bloque ${index + 1}`}
                  disabled={index === 0}
                  onClick={() => moveExtraInfoBlock(index, index - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                </button>
                <button
                  type="button"
                  aria-label={`Bajar bloque ${index + 1}`}
                  disabled={index === blocks.length - 1}
                  onClick={() => moveExtraInfoBlock(index, index + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar bloque ${index + 1}`}
                  onClick={() => removeExtraInfoBlock(index)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error transition-colors hover:bg-error-container"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>

            <Switch
              checked={block.enabled}
              label="Mostrar este bloque en la página pública"
              description="El contenido permanece guardado cuando el bloque está oculto."
              onCheckedChange={(enabled) => updateExtraInfoBlock(index, { enabled })}
            />

            <ClassContentTextField
              label="Título del bloque"
              value={block.title}
              placeholder="Información adicional"
              onChange={(event) => updateExtraInfoBlock(index, { title: event.target.value })}
            />

            <ClassContentRichTextField
              label="Contenido del bloque"
              value={block.content}
              typography={resolveModuleTypography(block.contentTypography)}
              placeholder="Añade el contenido de este bloque..."
              minHeight="150px"
              onChange={(value) => updateExtraInfoBlock(index, { content: value })}
              onTypographyChange={(contentTypography) => updateExtraInfoBlock(index, { contentTypography })}
            />
          </div>
        ))
      )}
    </div>
  );
}

export const ClassContentAdditionalInfoBlocksEditor = memo(
  ClassContentAdditionalInfoBlocksEditorComponent,
);
