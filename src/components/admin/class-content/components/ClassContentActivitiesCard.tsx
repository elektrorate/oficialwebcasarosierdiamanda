"use client";

import { memo } from "react";
import type { TextareaHTMLAttributes } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import type { ClassContentEditor } from "../hooks/useClassContentEditor";
import { ClassContentFieldLabel, ClassContentTextField } from "./ClassContentTextField";

function ClassContentTextAreaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <ClassContentFieldLabel>{label}</ClassContentFieldLabel>
      <textarea
        {...props}
        className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary-container"
      />
    </div>
  );
}

type ClassContentActivitiesCardProps = Pick<
  ClassContentEditor,
  | "content"
  | "updateActivitiesSection"
  | "addActivity"
  | "updateActivity"
  | "moveActivity"
  | "removeActivity"
>;

function ClassContentActivitiesCardComponent({
  content,
  updateActivitiesSection,
  addActivity,
  updateActivity,
  moveActivity,
  removeActivity,
}: ClassContentActivitiesCardProps) {
  const { activitiesSection } = content;

  return (
    <Card padding="lg" className="space-y-5 rounded-2xl">
      <h2 className="text-headline-sm text-on-surface">Actividades</h2>

      <Switch
        checked={activitiesSection.enabled}
        label="Mostrar sección de actividades en la página pública"
        description="Al activarla, se muestra entre los módulos y el bloque final de la ficha."
        onCheckedChange={(enabled) => updateActivitiesSection({ enabled })}
      />

      <ClassContentTextField
        label="Título de la sección"
        value={activitiesSection.title}
        placeholder="Actividades"
        onChange={(event) => updateActivitiesSection({ title: event.target.value })}
      />

      <ClassContentTextAreaField
        label="Descripción"
        value={activitiesSection.content}
        placeholder="Describe las actividades complementarias de esta oferta."
        className="min-h-[120px]"
        onChange={(event) => updateActivitiesSection({ content: event.target.value })}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ClassContentFieldLabel>Actividades</ClassContentFieldLabel>
          <Button type="button" variant="outlined" size="sm" onClick={addActivity}>
            + Añadir actividad
          </Button>
        </div>

        {activitiesSection.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-body-md text-on-surface-variant">
            No hay actividades añadidas.
          </div>
        ) : (
          activitiesSection.items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-outline-variant p-4">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-semibold text-on-surface">Actividad {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveActivity(index, index - 1)}
                    disabled={index === 0}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveActivity(index, index + 1)}
                    disabled={index === activitiesSection.items.length - 1}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-label-md font-bold text-error transition-colors hover:bg-error-container"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <ClassContentTextField
                label="Título"
                value={item.title}
                placeholder="Visita al museo"
                onChange={(event) => updateActivity(index, { title: event.target.value })}
              />
              <ClassContentTextAreaField
                label="Descripción"
                value={item.description}
                placeholder="Descripción breve de la actividad."
                className="min-h-[100px]"
                onChange={(event) => updateActivity(index, { description: event.target.value })}
              />
              <ClassContentTextField
                label="Imagen (URL)"
                value={item.image}
                placeholder="https://…"
                onChange={(event) => updateActivity(index, { image: event.target.value })}
              />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export const ClassContentActivitiesCard = memo(ClassContentActivitiesCardComponent);