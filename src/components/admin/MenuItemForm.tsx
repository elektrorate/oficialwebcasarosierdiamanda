"use client";

import { useState, useEffect } from "react";
import type { MenuItem, MenuItemType, LinkedEntityType, Offering } from "@/lib/cms/types";
import { MENU_ITEM_TYPES, LINKED_ENTITY_TYPES } from "@/lib/cms/types";

interface MenuItemFormProps {
  item?: MenuItem;
  parentOptions: { id: string; label: string }[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<string, string> = { internal: "Interno", external: "Externo", offering: "Offering", custom: "Custom" };
const linkedLabels: Record<string, string> = { offering: "Offering", page: "Página", landing: "Landing", blog: "Blog", shop: "Shop", none: "Ninguna" };
const offeringTypeUrlMap: Record<string, string> = { class: "/clases/", workshop: "/workshops/", experience: "/experiencias/", gift_card: "/gift-cards/" };

export default function MenuItemForm({ item, parentOptions, onSave, onCancel }: MenuItemFormProps) {
  const [label, setLabel] = useState(item?.label ?? "");
  const [type, setType] = useState<MenuItemType>(item?.type ?? "internal");
  const [url, setUrl] = useState(item?.url ?? "");
  const [linkedEntityType, setLinkedEntityType] = useState<LinkedEntityType>(item?.linked_entity_type ?? "none");
  const [linkedEntityId, setLinkedEntityId] = useState(item?.linked_entity_id ?? "");
  const [parentId, setParentId] = useState(item?.parent_id ?? "");
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);
  const [openInNewTab, setOpenInNewTab] = useState(item?.open_in_new_tab ?? false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (type === "offering") {
      fetch("/api/admin/offerings")
        .then((r) => r.json())
        .then((data) => setOfferings(data.offerings ?? []))
        .catch(() => {});
    }
  }, [type]);

  function handleOfferingSelect(id: string) {
    setLinkedEntityId(id);
    const off = offerings.find((o) => o.id === id);
    if (off) {
      setLabel(off.title);
      setLinkedEntityType("offering");
      const prefix = offeringTypeUrlMap[off.type] || "/";
      setUrl(`${prefix}${off.slug}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setIsLoading(true);
    await onSave({
      label,
      type,
      url,
      linked_entity_type: linkedEntityType,
      linked_entity_id: linkedEntityId,
      parent_id: parentId || null,
      is_visible: isVisible,
      open_in_new_tab: openInNewTab,
    });
    setIsLoading(false);
  }

  return (
    <form className="menu-item-form" onSubmit={handleSubmit}>
      <div className="grid-2">
        <label className="field span-2">
          <span>Etiqueta</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Inicio" />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as MenuItemType)}>
            {MENU_ITEM_TYPES.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Entidad vinculada</span>
          <select value={linkedEntityType} onChange={(e) => setLinkedEntityType(e.target.value as LinkedEntityType)}>
            {LINKED_ENTITY_TYPES.map((l) => <option key={l} value={l}>{linkedLabels[l]}</option>)}
          </select>
        </label>
        {type === "offering" ? (
          <label className="field span-2">
            <span>Seleccionar Offering</span>
            <select value={linkedEntityId} onChange={(e) => handleOfferingSelect(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {offerings.filter((o) => o.status === "published").map((o) => (
                <option key={o.id} value={o.id}>{o.title} ({o.type})</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field span-2">
          <span>URL</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </label>
        <label className="field">
          <span>Item padre</span>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Sin padre (raíz)</option>
            {parentOptions.filter((p) => p.id !== item?.id).map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="field checkbox-field">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
          <span>Visible</span>
        </label>
        <label className="field checkbox-field">
          <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} />
          <span>Abrir en nueva pestaña</span>
        </label>
      </div>
      <div className="form-actions" style={{ marginTop: "0.5rem" }}>
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-btn" disabled={isLoading || !label.trim()}>
          {isLoading ? "Guardando..." : item ? "Guardar item" : "Añadir item"}
        </button>
      </div>
    </form>
  );
}
