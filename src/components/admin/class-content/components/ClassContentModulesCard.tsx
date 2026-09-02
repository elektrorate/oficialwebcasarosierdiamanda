"use client";

import { memo } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import type { ClassContentEditor } from "../hooks/useClassContentEditor";
import { ClassContentFieldLabel, ClassContentTextField } from "./ClassContentTextField";
import { ClassContentModuleEditor } from "./ClassContentModuleEditor";

type ClassContentModulesCardProps = Pick<
  ClassContentEditor,
  | "content"
  | "setField"
  | "addModule"
  | "updateModule"
  | "duplicateModule"
  | "removeModule"
  | "resolveModuleTypography"
>;

function ClassContentModulesCardComponent({
  content,
  setField,
  addModule,
  updateModule,
  duplicateModule,
  removeModule,
  resolveModuleTypography,
}: ClassContentModulesCardProps) {
  return (
    <Card padding="lg" className="space-y-5 rounded-2xl">
      <h2 className="text-headline-sm text-on-surface">Módulos del Curso</h2>

      <Switch
        checked={content.showModulesSection}
        label="Mostrar Módulos del Curso en la página pública"
        description="Los módulos permanecen guardados y editables aunque la sección esté oculta."
        onCheckedChange={(checked) => setField("showModulesSection", checked)}
      />

      <ClassContentTextField
        label="Título de la sección 'Contenido del curso'"
        value={content.modulesSectionTitle}
        placeholder="programa del curso"
        onChange={(event) => setField("modulesSectionTitle", event.target.value)}
      />

      <ClassContentTextField
        label="Título del acordeón de módulos"
        value={content.modulesAccordionTitle || ""}
        placeholder="programa del curso"
        onChange={(event) => setField("modulesAccordionTitle", event.target.value)}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ClassContentFieldLabel>Módulos</ClassContentFieldLabel>
          <Button type="button" variant="outlined" size="sm" onClick={addModule}>
            + Añadir módulo
          </Button>
        </div>

        {content.modules.length === 0 ? (
          <div className="flex min-h-50 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary-container bg-secondary-container/10 px-6 py-12 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-sm">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
            </span>
            <h3 className="text-title-md font-bold text-on-surface">No hay módulos creados todavía.</h3>
            <Button
              type="button"
              variant="outlined"
              className="mt-4 border-secondary-container text-secondary"
              onClick={addModule}
            >
              + Añadir módulo
            </Button>
          </div>
        ) : (
          content.modules.map((mod, index) => (
            <ClassContentModuleEditor
              key={mod.id}
              module={mod}
              index={index}
              updateModule={updateModule}
              duplicateModule={duplicateModule}
              removeModule={removeModule}
              resolveModuleTypography={resolveModuleTypography}
            />
          ))
        )}
      </div>
    </Card>
  );
}

export const ClassContentModulesCard = memo(ClassContentModulesCardComponent);
