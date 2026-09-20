"use client";

import Switch from "@/components/ui/Switch";
import { AdminInput, AdminSelect } from "@/components/ui/AdminField";
import type { CalendarLabel } from "@/lib/cms/types";
import { MONTH_OPTIONS, YEAR_OPTIONS } from "../constants";
import { calendarMonthCells } from "../utils";
import { CalendarMonthPicker } from "./CalendarMonthPicker";
import { ListItemActions } from "./ListItemActions";

type CalendarLabelItemProps = {
  label: CalendarLabel;
  index: number;
  error?: string;
  onUpdate: (next: Partial<CalendarLabel>) => void;
  onToggleDay: (day: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export function CalendarLabelItem({
  label,
  index,
  error,
  onUpdate,
  onToggleDay,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CalendarLabelItemProps) {
  const monthDays = calendarMonthCells(label.year, label.month);

  return (
    <div
      className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
      data-validation-key={`calendar-label-${index}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-label-lg font-bold text-on-surface">Etiqueta {index + 1}</p>
          <p className="text-label-md text-on-surface-variant">
            {label.days.length ? `${label.days.length} días seleccionados` : "Sin días seleccionados"}
          </p>
        </div>
        <ListItemActions
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
          removeLabel="Eliminar etiqueta"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_150px_1fr] md:items-start">
        <AdminSelect
          label="Mes"
          value={label.month}
          onChange={(event) => onUpdate({ month: Number(event.target.value) })}
        >
          {MONTH_OPTIONS.map((month, monthIndex) => (
            <option key={month} value={monthIndex + 1}>{month}</option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Anio"
          value={label.year}
          onChange={(event) => onUpdate({ year: Number(event.target.value) })}
        >
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </AdminSelect>
        <AdminInput
          label="Disponibilidad"
          value={label.availabilityText ?? ""}
          placeholder="disponibilidad: 8 alumnos"
          onChange={(event) => onUpdate({ availabilityText: event.target.value })}
        />
      </div>

      <Switch
        checked={label.active}
        label="Etiqueta activa"
        description="Permite conservarla en el CMS sin mostrarla en la página pública."
        onCheckedChange={(checked) => onUpdate({ active: checked })}
      />

      <CalendarMonthPicker
        selectedDays={label.days}
        monthDays={monthDays}
        onToggleDay={onToggleDay}
      />

      {error ? <p className="text-label-md text-error">{error}</p> : null}
    </div>
  );
}
