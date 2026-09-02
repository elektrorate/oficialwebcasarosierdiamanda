"use client";

import { memo } from "react";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import type { ClassContentEditor } from "../hooks/useClassContentEditor";
import { ClassContentFieldLabel, ClassContentTextField } from "./ClassContentTextField";

type ClassContentPaymentMethodsEditorProps = Pick<
  ClassContentEditor,
  | "content"
  | "paymentMethods"
  | "setField"
  | "addPaymentMethod"
  | "updatePaymentMethod"
  | "removePaymentMethod"
>;

function ClassContentPaymentMethodsEditorComponent({
  content,
  paymentMethods,
  setField,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
}: ClassContentPaymentMethodsEditorProps) {
  return (
    <div className="space-y-3">
      <Switch
        checked={content.showPaymentMethodsSection}
        label="Mostrar Formas de pago en la página pública"
        description="Las formas permanecen guardadas aunque esta sección esté oculta."
        onCheckedChange={(checked) => setField("showPaymentMethodsSection", checked)}
      />
      <ClassContentTextField
        label="Título de la sección de pago"
        value={content.paymentMethodsSectionTitle || "Métodos de pago"}
        placeholder="Métodos de pago"
        onChange={(event) => setField("paymentMethodsSectionTitle", event.target.value)}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <ClassContentFieldLabel>Formas de pago</ClassContentFieldLabel>
          <p className="mt-1 text-label-md text-on-surface-variant/70">Se publicarán como lista con viñetas.</p>
        </div>
        <Button type="button" variant="outlined" size="sm" onClick={addPaymentMethod}>
          Añadir forma
        </Button>
      </div>
      {paymentMethods.length ? (
        <div className="space-y-2">
          {paymentMethods.map((method, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <ClassContentTextField
                label={`Forma ${index + 1}`}
                value={method}
                placeholder="Transferencia bancaria"
                onChange={(event) => updatePaymentMethod(index, event.target.value)}
              />
              <button
                type="button"
                onClick={() => removePaymentMethod(index)}
                className="self-end inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-label-md font-bold text-error transition-colors hover:bg-error-container"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-body-md text-on-surface-variant">
          No hay formas de pago añadidas.
        </div>
      )}
    </div>
  );
}

export const ClassContentPaymentMethodsEditor = memo(ClassContentPaymentMethodsEditorComponent);
