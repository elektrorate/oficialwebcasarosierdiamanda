"use client";

import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import { TextAreaField } from "../fields";
import type { ClassEditFormState } from "../hooks/useClassEditForm";

export function ScheduleSection({ form }: { form: ClassEditFormState }) {
  const { details, updateDetails } = form;

  return (
    <Card padding="lg" className="space-y-5 rounded-2xl">
      <div>
        <h2 className="text-headline-sm text-on-surface">Horario</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Escribe el horario como texto libre y define si debe mostrarse en la página pública.
        </p>
      </div>
      <TextAreaField
        label="Horario en texto"
        value={details.scheduleDescription}
        onChange={(event) => updateDetails({ scheduleDescription: event.target.value, scheduleDays: [] })}
        className="min-h-[160px]"
      />
      <Switch
        checked={details.showScheduleOnFrontend}
        label="Mostrar horarios en la página pública"
        description="Controla si el texto de horario aparece dentro de la ficha del producto."
        onCheckedChange={(checked) => updateDetails({ showScheduleOnFrontend: checked })}
      />
    </Card>
  );
}