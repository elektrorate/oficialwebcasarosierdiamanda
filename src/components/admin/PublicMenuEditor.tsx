"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import type { NavigationItem } from "@/data/types";
import AdminActionModal from "./AdminActionModal";
import ColorPickerField from "./ColorPickerField";
import MediaSelectField from "./MediaSelectField";
import {
  menuUrlValidationMessage,
  normalizeMenuUrl,
  systemMenuRootId,
  systemMenuRootKey,
  type SystemMenuRootKey,
} from "@/lib/cms/menu-links";
import type { SiteSettings } from "@/lib/cms/settings";
import type { LinkedEntityType, Menu, MenuItem, MenuItemType } from "@/lib/cms/types";

type EditableMenuItem = {
  id?: string;
  key: string;
  label: string;
  url: string;
  sort_order: number;
  type: MenuItemType;
  linked_entity_type: LinkedEntityType;
  linked_entity_id: string;
  is_visible: boolean;
  open_in_new_tab: boolean;
  locked?: boolean;
  children: EditableMenuChild[];
};

type EditableMenuChild = Omit<EditableMenuItem, "children" | "locked"> & {
  parent_id?: string | null;
};

type PublishMenuResponse = { items?: MenuItem[]; error?: string };
type ActionModalState = { type: "success" | "error"; title: string; message: string } | null;

const DYNAMIC_MENU_KEYS = new Set(["clases", "workshops", "experiencias", "giftcards"]);

const DEFAULT_POINTS: EditableMenuItem[] = [
  menuPoint("inicio", "Inicio", "/#hero", 0, { locked: true }),
  menuPoint("clases", "Clases", "/clases", 1),
  menuPoint("workshops", "Workshops", "/workshops", 2),
  menuPoint("experiencias", "Experiencias", "/experiencias", 3),
  menuPoint("giftcards", "GiftCards", "/gift-cards", 4),
  menuPoint("estudio", "Comunidad", "/el-estudio", 5, {
    children: [
      menuChild("estudio-detalle", "El estudio", "/el-estudio", 0),
      menuChild("estudio-bitacora", "Bitácora", "/blog", 1),
    ],
  }),
  menuPoint("shop", "Shop", "/shop", 6),
];

function menuPoint(
  key: SystemMenuRootKey,
  label: string,
  url: string,
  sortOrder: number,
  options: Partial<Pick<EditableMenuItem, "locked" | "children">> = {},
): EditableMenuItem {
  return {
    key,
    label,
    url,
    sort_order: sortOrder,
    type: "internal",
    linked_entity_type: "none",
    linked_entity_id: systemMenuRootId(key),
    is_visible: true,
    open_in_new_tab: false,
    locked: options.locked,
    children: options.children ?? [],
  };
}

function menuChild(key: string, label: string, url: string, sortOrder: number): EditableMenuChild {
  return {
    key,
    label,
    url,
    sort_order: sortOrder,
    type: "internal",
    linked_entity_type: "none",
    linked_entity_id: "",
    is_visible: true,
    open_in_new_tab: false,
  };
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function keyForItem(item: Pick<MenuItem, "label" | "url"> & Partial<Pick<MenuItem, "linked_entity_id">>) {
  const stableKey = systemMenuRootKey(item.linked_entity_id);
  if (stableKey) return stableKey;
  const label = normalizeLabel(item.label);
  if (["/#hero", "/", "/home"].includes(item.url) || label === "inicio") return "inicio";
  if (item.url === "/clases" || label === "clases") return "clases";
  if (item.url === "/workshops" || label === "workshops") return "workshops";
  if (item.url === "/experiencias" || item.url === "/reservas-privadas" || label === "experiencias" || label === "reservas privadas") return "experiencias";
  if (item.url === "/gift-cards" || item.url === "/gift-card" || label === "gift cards" || label === "giftcards" || label.includes("regalo")) return "giftcards";
  if (item.url === "/el-estudio" || label === "el estudio" || label === "comunidad") return "estudio";
  if (item.url === "/shop" || label === "shop") return "shop";
  return `item-${item.url || label}`;
}

function keyForNavigationItem(item: NavigationItem) {
  return keyForItem({ label: item.label, url: item.href, linked_entity_id: item.linked_entity_id });
}

function cloneChildren(children: EditableMenuChild[]) {
  return children.map((child) => ({ ...child }));
}

function mergeChildrenWithSavedOrder(available: EditableMenuChild[], saved: EditableMenuChild[] = []) {
  const availableById = new Map(available
    .filter((child) => child.linked_entity_id)
    .map((child) => [child.linked_entity_id, child]));
  const availableByUrl = new Map(available.map((child) => [child.url, child]));
  const usedIds = new Set<string>();
  const usedUrls = new Set<string>();
  const merged: EditableMenuChild[] = [];

  saved
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((child) => {
      const byId = child.linked_entity_id ? availableById.get(child.linked_entity_id) : undefined;
      if (byId) {
        usedIds.add(child.linked_entity_id);
        usedUrls.add(byId.url);
        merged.push({
          ...byId,
          is_visible: child.is_visible,
          open_in_new_tab: child.open_in_new_tab,
        });
        return;
      }

      const byUrl = availableByUrl.get(child.url);
      if (!byUrl) return;
      usedUrls.add(child.url);
      merged.push({
        ...byUrl,
        is_visible: child.is_visible,
        open_in_new_tab: child.open_in_new_tab,
      });
    });

  available.forEach((child) => {
    const alreadyUsed = (child.linked_entity_id && usedIds.has(child.linked_entity_id)) || usedUrls.has(child.url);
    if (!alreadyUsed) merged.push(child);
  });

  return merged.map((child, index) => ({ ...child, sort_order: index }));
}

function editableChildFromNavigation(item: NavigationItem, sortOrder: number): EditableMenuChild {
  return {
    key: `available-${item.linked_entity_id ?? item.href}-${sortOrder}`,
    label: item.label,
    url: item.href,
    sort_order: sortOrder,
    type: "internal",
    linked_entity_type: (item.linked_entity_type as LinkedEntityType | undefined) ?? "none",
    linked_entity_id: item.linked_entity_id ?? "",
    is_visible: item.visible,
    open_in_new_tab: item.target === "_blank",
  };
}

function availableChildrenByRoot(navigationItems: NavigationItem[]) {
  const childrenByRoot = new Map<string, EditableMenuChild[]>();

  navigationItems.forEach((item) => {
    const key = keyForNavigationItem(item);
    if (!DYNAMIC_MENU_KEYS.has(key)) return;

    const children = (item.children ?? [])
      .sort((a, b) => a.order - b.order)
      .map((child, index) => editableChildFromNavigation(child, index));
    childrenByRoot.set(key, children);
  });

  return childrenByRoot;
}
function itemToEditable(item: MenuItem, children: MenuItem[]): EditableMenuItem {
  const key = keyForItem(item);
  const defaultPoint = DEFAULT_POINTS.find((point) => point.key === key);
  const normalizedChildren = children
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((child) => ({
      id: child.id,
      key: child.id,
      label: child.label,
      url: child.url,
      sort_order: child.sort_order,
      type: child.type,
      linked_entity_type: child.linked_entity_type,
      linked_entity_id: child.linked_entity_id,
      is_visible: child.is_visible,
      open_in_new_tab: child.open_in_new_tab,
      parent_id: child.parent_id,
    }));

  return {
    id: item.id,
    key,
    label: item.label,
    url: item.url || defaultPoint?.url || "/",
    sort_order: defaultPoint?.sort_order ?? item.sort_order,
    type: item.type,
    linked_entity_type: item.linked_entity_type,
    linked_entity_id: item.linked_entity_id || (defaultPoint ? systemMenuRootId(defaultPoint.key as SystemMenuRootKey) : ""),
    is_visible: key === "inicio" ? true : item.is_visible,
    open_in_new_tab: item.open_in_new_tab,
    locked: key === "inicio",
    children: normalizedChildren.length ? normalizedChildren : cloneChildren(defaultPoint?.children ?? []),
  };
}

function buildEditableMenu(menu: Menu | null, availableNavigationItems: NavigationItem[]): EditableMenuItem[] {
  const availableChildren = availableChildrenByRoot(availableNavigationItems);
  const defaults = DEFAULT_POINTS.map((point) => ({
    ...point,
    children: DYNAMIC_MENU_KEYS.has(point.key)
      ? cloneChildren(availableChildren.get(point.key) ?? [])
      : cloneChildren(point.children),
  }));

  if (!menu?.items.length) return defaults;

  const childrenByParent = new Map<string, MenuItem[]>();
  for (const item of menu.items) {
    if (!item.parent_id) continue;
    const children = childrenByParent.get(item.parent_id) ?? [];
    children.push(item);
    childrenByParent.set(item.parent_id, children);
  }

  const roots = menu.items
    .filter((item) => !item.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => itemToEditable(item, childrenByParent.get(item.id) ?? []));

  const byKey = new Map(roots.map((item) => [item.key, item]));
  const merged = defaults.map((defaultPoint) => {
    const savedPoint = byKey.get(defaultPoint.key);
    return {
      ...defaultPoint,
      ...(savedPoint ?? {}),
      children: DYNAMIC_MENU_KEYS.has(defaultPoint.key)
        ? mergeChildrenWithSavedOrder(availableChildren.get(defaultPoint.key) ?? [], savedPoint?.children)
        : savedPoint?.children?.length
          ? savedPoint.children.map((child, index) => ({ ...child, sort_order: index }))
          : defaultPoint.children,
    };
  });

  const extras = roots.filter((item) => !defaults.some((point) => point.key === item.key));
  return [...merged, ...extras].sort((a, b) => a.sort_order - b.sort_order);
}

function payloadFor(item: EditableMenuItem | EditableMenuChild, parentId: string | null) {
  return {
    label: item.label.trim(),
    type: item.type,
    url: normalizeMenuUrl(item.url) ?? item.url.trim(),
    linked_entity_type: item.linked_entity_type,
    linked_entity_id: item.linked_entity_id,
    parent_id: parentId,
    sort_order: item.sort_order,
    is_visible: item.key === "inicio" ? true : item.is_visible,
    open_in_new_tab: item.open_in_new_tab,
  };
}

function InteractiveMenuPreview({
  items,
  logoUrl,
  backgroundColor,
  textColor,
  logoTintEnabled,
  logoTintColor,
}: {
  items: EditableMenuItem[];
  logoUrl: string;
  backgroundColor: string;
  textColor: string;
  logoTintEnabled: boolean;
  logoTintColor: string;
}) {
  const visibleItems = items.filter((item) => item.is_visible);
  const tintStyle = {
    WebkitMaskImage: `url("${logoUrl.replace(/"/g, "%22")}")`,
    maskImage: `url("${logoUrl.replace(/"/g, "%22")}")`,
    backgroundColor: logoTintColor,
  } as CSSProperties;

  return (
    <div className="interactive-menu-preview" aria-label="Vista previa del menú de scroll">
      <div className="interactive-menu-preview__bar" style={{ backgroundColor }}>
        <div className="interactive-menu-preview__logo">
          {logoTintEnabled ? (
            <span className="interactive-menu-preview__logo-tint" style={tintStyle} aria-hidden="true" />
          ) : (
            <img src={logoUrl} alt="Casa Rosier" />
          )}
        </div>
        <nav className="interactive-menu-preview__nav" aria-label="Vista previa navegación">
          {visibleItems.map((item, index) => (
            <span className="interactive-menu-preview__item" key={item.key} style={{ color: textColor }}>
              <span>{item.label || "Sin nombre"}</span>
              {item.children.some((child) => child.is_visible) ? <span className="interactive-menu-preview__plus">+</span> : null}
              {index < visibleItems.length - 1 ? <span className="interactive-menu-preview__separator" aria-hidden="true">|</span> : null}
            </span>
          ))}
        </nav>
        <span className="interactive-menu-preview__mobile-icon" style={{ color: textColor }} aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
}

export default function PublicMenuEditor({
  initialMenu,
  initialSettings,
  availableNavigationItems,
}: {
  initialMenu: Menu | null;
  initialSettings: SiteSettings;
  availableNavigationItems: NavigationItem[];
}) {
  const [items, setItems] = useState(() => buildEditableMenu(initialMenu, availableNavigationItems));
  const [logoUrl, setLogoUrl] = useState(initialSettings.menu.header_logo_url);
  const [scrollBackgroundColor, setScrollBackgroundColor] = useState(initialSettings.menu.scroll_menu_background_color);
  const [scrollTextColor, setScrollTextColor] = useState(initialSettings.menu.scroll_menu_text_color);
  const [scrollLogoTintEnabled, setScrollLogoTintEnabled] = useState(initialSettings.menu.scroll_menu_logo_tint_enabled);
  const [scrollLogoTintColor, setScrollLogoTintColor] = useState(initialSettings.menu.scroll_menu_logo_tint_color);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState>(null);

  const canSave = Boolean(initialMenu?.id) && !isSaving;
  const saveLabel = isSaving ? "Publicando..." : "Publicar";

  function updateItem(key: string, patch: Partial<EditableMenuItem>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  function updateChild(parentKey: string, childKey: string, patch: Partial<EditableMenuChild>) {
    setItems((current) => current.map((item) => {
      if (item.key !== parentKey) return item;
      return {
        ...item,
        children: item.children.map((child) => child.key === childKey ? { ...child, ...patch } : child),
      };
    }));
  }

  function moveChild(parentKey: string, childKey: string, direction: -1 | 1) {
    setItems((current) => current.map((item) => {
      if (item.key !== parentKey) return item;
      const currentIndex = item.children.findIndex((child) => child.key === childKey);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= item.children.length) return item;
      const children = [...item.children];
      const [moved] = children.splice(currentIndex, 1);
      children.splice(nextIndex, 0, moved);
      return {
        ...item,
        children: children.map((child, index) => ({ ...child, sort_order: index })),
      };
    }));
  }

  async function handleSave() {
    if (!initialMenu?.id) {
      setError("No hay un menú principal activo para guardar.");
      return;
    }

    const invalidItem = items
      .flatMap((item) => [item, ...item.children])
      .find((item) => menuUrlValidationMessage(item.url));
    if (invalidItem) {
      const message = `${invalidItem.label || "Este elemento"}: ${menuUrlValidationMessage(invalidItem.url)}`;
      setError(message);
      setActionModal({ type: "error", title: "Revisa la URL", message });
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/menu/publish", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: initialMenu.id,
          settings: {
            menu: {
              header_logo_url: logoUrl,
              scroll_menu_background_color: scrollBackgroundColor,
              scroll_menu_text_color: scrollTextColor,
              scroll_menu_icon_color: scrollTextColor,
              scroll_menu_logo_tint_enabled: scrollLogoTintEnabled,
              scroll_menu_logo_tint_color: scrollLogoTintColor,
            },
          },
          items: items.map((item, index) => ({
            id: item.id,
            ...payloadFor({ ...item, sort_order: index }, null),
            children: item.children.map((child, childIndex) => ({
                id: child.id,
                ...payloadFor({ ...child, sort_order: childIndex }, item.id ?? null),
              })),
          })),
        }),
      });

      const data = await response.json().catch(() => ({})) as PublishMenuResponse;
      if (!response.ok || !data.items) throw new Error(data.error || "No se pudo publicar el menú.");

      const savedRoots = data.items
        .filter((item) => !item.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const savedChildrenByParent = new Map<string, MenuItem[]>();
      for (const item of data.items.filter((savedItem) => savedItem.parent_id)) {
        const list = savedChildrenByParent.get(item.parent_id ?? "") ?? [];
        list.push(item);
        savedChildrenByParent.set(item.parent_id ?? "", list);
      }

      const savedItems = items.map((item, index) => {
        const savedRoot = savedRoots[index];
        const savedChildren = savedRoot
          ? (savedChildrenByParent.get(savedRoot.id) ?? []).sort((a, b) => a.sort_order - b.sort_order)
          : [];
        return {
          ...item,
          id: savedRoot?.id ?? item.id,
          sort_order: index,
          children: item.children.map((child, childIndex) => ({
            ...child,
            id: savedChildren[childIndex]?.id ?? child.id,
            parent_id: savedRoot?.id ?? child.parent_id,
            sort_order: childIndex,
          })),
        };
      });
      setItems(savedItems);
      setActionModal({
        type: "success",
        title: "Menú publicado",
        message: "La configuración del menú se guardó correctamente.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo publicar el menú.";
      setError(message);
      setActionModal({
        type: "error",
        title: "No se pudo publicar",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="public-menu-editor">
      <AdminActionModal
        open={Boolean(actionModal)}
        type={actionModal?.type ?? "info"}
        title={actionModal?.title ?? ""}
        message={actionModal?.message}
        confirmLabel="Entendido"
        onClose={() => setActionModal(null)}
      />

      <div className="section-head public-menu-editor__head">
        <div>
          <p className="auth-kicker">CMS</p>
          <h2>Menú</h2>
        </div>
        <button type="button" className="primary-btn inline" disabled={!canSave} onClick={() => void handleSave()}>
          {saveLabel}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="public-menu-editor__panel">
        <p className="form-help">
          Las rutas internas deben empezar por /. Cambiar una URL modifica el enlace del menú, pero no crea ni renombra la página de destino.
        </p>
        <div className="public-menu-list" aria-label="Puntos del menú">
          <div className="public-menu-simple" role="table" aria-label="Editor simple del menú público">
            <div className="public-menu-simple__head" role="row">
              <span role="columnheader">Elemento</span>
              <span role="columnheader">URL</span>
              <span role="columnheader">Comportamiento</span>
            </div>
            <div className="public-menu-simple__body">
              {items.map((item) => (
                <div className="public-menu-simple__group" key={item.key}>
                  <div className="public-menu-simple__row" role="row">
                    <label className="public-menu-simple__field public-menu-simple__field--label">
                      <span>{item.locked ? "Elemento fijo" : "Nombre visible"}</span>
                      <input
                        value={item.label}
                        aria-label={`Nombre visible de ${item.label || "elemento del menú"}`}
                        onChange={(event) => updateItem(item.key, { label: event.target.value })}
                      />
                    </label>
                    <label className="public-menu-simple__field public-menu-simple__field--url">
                      <span>{item.locked ? "URL fija" : "URL del enlace"}</span>
                      <input
                        value={item.url}
                        readOnly={item.locked}
                        placeholder="/ruta"
                        aria-label={`URL de ${item.label || "elemento del menú"}`}
                        onChange={(event) => updateItem(item.key, { url: event.target.value })}
                      />
                    </label>
                    <div className="public-menu-simple__options">
                      <label className="public-menu-simple__option">
                        <input
                          type="checkbox"
                          checked={item.is_visible}
                          disabled={item.locked}
                          onChange={(event) => updateItem(item.key, { is_visible: event.target.checked })}
                        />
                        <span>Mostrar en la web</span>
                      </label>
                      <label className="public-menu-simple__option">
                        <input
                          type="checkbox"
                          checked={item.open_in_new_tab}
                          disabled={item.locked}
                          onChange={(event) => updateItem(item.key, { open_in_new_tab: event.target.checked })}
                        />
                        <span>Abrir en nueva pestaña</span>
                      </label>
                    </div>
                  </div>

                  {item.children.map((child, childIndex) => {
                    const hasAutomaticUrl = child.linked_entity_type === "offering";
                    return (
                    <div className="public-menu-simple__row public-menu-simple__row--child" role="row" key={child.key}>
                      <label className="public-menu-simple__field public-menu-simple__field--label">
                        <span>Subelemento</span>
                        <input
                          value={child.label}
                          aria-label={`Nombre visible de ${child.label || "subelemento del menú"}`}
                          onChange={(event) => updateChild(item.key, child.key, { label: event.target.value })}
                        />
                      </label>
                      <label className="public-menu-simple__field public-menu-simple__field--url">
                        <span>{hasAutomaticUrl ? "URL automática" : "URL del enlace"}</span>
                        <input
                          value={child.url}
                          readOnly={hasAutomaticUrl}
                          placeholder="/ruta"
                          aria-label={`URL de ${child.label || "subelemento del menú"}`}
                          onChange={(event) => updateChild(item.key, child.key, { url: event.target.value })}
                        />
                      </label>
                      <div className="public-menu-simple__options">
                        <label className="public-menu-simple__option">
                          <input
                            type="checkbox"
                            checked={child.is_visible}
                            onChange={(event) => updateChild(item.key, child.key, { is_visible: event.target.checked })}
                          />
                          <span>Mostrar en la web</span>
                        </label>
                        <label className="public-menu-simple__option">
                          <input
                            type="checkbox"
                            checked={child.open_in_new_tab}
                            onChange={(event) => updateChild(item.key, child.key, { open_in_new_tab: event.target.checked })}
                          />
                          <span>Abrir en nueva pestaña</span>
                        </label>
                      </div>
                      <div className="public-menu-simple__child-actions" aria-label={`Orden de ${child.label || "subelemento"}`}>
                        <button
                          type="button"
                          className="secondary-btn icon-btn"
                          disabled={childIndex === 0}
                          aria-label={`Subir ${child.label || "subelemento"}`}
                          onClick={() => moveChild(item.key, child.key, -1)}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          className="secondary-btn icon-btn"
                          disabled={childIndex === item.children.length - 1}
                          aria-label={`Bajar ${child.label || "subelemento"}`}
                          onClick={() => moveChild(item.key, child.key, 1)}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-head compact">
            <div>
              <p className="auth-kicker">Logo</p>
              <h3>Logo de la página</h3>
            </div>
          </div>
          <MediaSelectField label="Logo del encabezado" value={logoUrl} onChange={setLogoUrl} />
          <p className="public-menu-card__note">
            Para que el aplicado de color funcione mejor en SVG y PNG, se recomienda que la imagen sea totalmente blanca y tenga transparencia.
          </p>
        </div>

        <div className="settings-section">
          <div className="section-head compact">
            <div>
              <p className="auth-kicker">Menú de Scroll</p>
              <h3>Menú fijo al bajar</h3>
              <p className="muted">Aparece al bajar la página para mantener la navegación visible.</p>
            </div>
          </div>
          <div className="scroll-menu-color-grid">
            <ColorPickerField label="Fondo" value={scrollBackgroundColor} onChange={setScrollBackgroundColor} />
            <ColorPickerField label="Texto e íconos" value={scrollTextColor} onChange={setScrollTextColor} />
            <ColorPickerField label="Logo del menú fijo" value={scrollLogoTintColor} onChange={setScrollLogoTintColor} />
          </div>
          <label className="checkbox-field scroll-logo-tint-toggle">
            <input
              type="checkbox"
              checked={scrollLogoTintEnabled}
              onChange={(event) => setScrollLogoTintEnabled(event.target.checked)}
            />
            <span>Aplicar color al logo del menú fijo</span>
          </label>
          <p className="public-menu-card__note">
            El color del logo se aplica como máscara para SVG y PNG; para mejores resultados usa un archivo blanco con transparencia.
          </p>

          <InteractiveMenuPreview
            items={items}
            logoUrl={logoUrl}
            backgroundColor={scrollBackgroundColor}
            textColor={scrollTextColor}
            logoTintEnabled={scrollLogoTintEnabled}
            logoTintColor={scrollLogoTintColor}
          />
        </div>
      </div>

      <button
        type="button"
        className="public-menu-editor__fixed-save primary-btn"
        disabled={!canSave}
        onClick={() => void handleSave()}
      >
        {saveLabel}
      </button>
    </div>
  );
}
