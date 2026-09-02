"use client";

import { memo } from "react";
import Button from "@/components/ui/Button";
import { AdminInput } from "@/components/ui/AdminField";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { ListItemActions } from "./ListItemActions";
import { SectionCard } from "./SectionCard";

type PricingSectionProps = {
  form: ClassEditFormState;
};

function pricingRowKey(item: { description: string; price: number | null; order: number }) {
  return `${item.order}-${item.price ?? "null"}-${item.description}`;
}

function PricingSectionComponent({ form }: PricingSectionProps) {
  const { details, errors, addPricing, updatePricing, removePricing, updateDetails, currency, setCurrency } = form;

  return (
    <SectionCard
      compact
      action={(
        <Button type="button" onClick={addPricing} size="sm">
          Agregar opción
        </Button>
      )}
    >
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-outline-variant p-4 md:grid-cols-2">
        <AdminInput
          label="Título del bloque de precios"
          placeholder="Precio"
          value={details.priceSectionTitle}
          onChange={(event) => updateDetails({ priceSectionTitle: event.target.value })}
        />
        <label className="flex flex-col gap-1.5 text-body-sm font-medium text-on-surface">
          Moneda
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {details.pricing.length ? details.pricing.map((item, index) => (
          <div
            key={pricingRowKey(item)}
            className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant p-4 md:grid-cols-[1fr_140px_auto] md:items-start"
          >
            <AdminInput
              label="Descripción"
              placeholder="Bono 4 clases"
              value={item.description}
              onChange={(event) => updatePricing(index, { description: event.target.value })}
            />
            <AdminInput
              label="Precio (€)"
              type="number"
              min={0}
              value={item.price ?? ""}
              error={errors[`pricing-${index}`]}
              validationKey={`pricing-${index}`}
              onChange={(event) => updatePricing(index, {
                price: event.target.value === "" ? null : Number(event.target.value),
              })}
            />
            <div className="mt-7">
              <ListItemActions
                onRemove={() => removePricing(index)}
                removeLabel="Eliminar precio"
              />
            </div>
          </div>
        )) : (
          <p className="text-body-md text-on-surface-variant">No hay opciones de precio cargadas.</p>
        )}
      </div>
    </SectionCard>
  );
}

export const PricingSection = memo(PricingSectionComponent);
