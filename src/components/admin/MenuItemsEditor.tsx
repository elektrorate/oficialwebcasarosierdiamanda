"use client";

import { useState } from "react";
import type { Menu, MenuItem } from "@/lib/cms/types";
import MenuItemForm from "./MenuItemForm";

interface Props {
  menu: Menu;
  onItemsChange: () => void;
}

function buildTree(items: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem>();
  const roots: MenuItem[] = [];
  items.forEach((i) => map.set(i.id, i));
  items.forEach((i) => {
    if (i.parent_id && map.has(i.parent_id)) {
      // child, skip in root
    } else {
      roots.push(i);
    }
  });
  return roots.sort((a, b) => a.sort_order - b.sort_order);
}

function getChildren(itemId: string, items: MenuItem[]): MenuItem[] {
  return items.filter((i) => i.parent_id === itemId).sort((a, b) => a.sort_order - b.sort_order);
}

function isProtectedHomeMenuItem(item: MenuItem) {
  return !item.parent_id && ["/#hero", "/", "/home"].includes(item.url);
}

export default function MenuItemsEditor({ menu, onItemsChange }: Props) {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentOptions = menu.items.map((i) => ({ id: i.id, label: i.label }));

  async function api(path: string, method: string, body?: Record<string, unknown>) {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Error en la solicitud");
    }
    return res.json();
  }

  async function handleSave(data: Record<string, unknown>) {
    try {
      if (editingItem) {
        await api(`/api/admin/menus/${menu.id}/items`, "PUT", { itemId: editingItem.id, ...data });
      } else {
        await api(`/api/admin/menus/${menu.id}/items`, "POST", data);
      }
      setEditingItem(null);
      setShowNewForm(false);
      setError(null);
      onItemsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await api(`/api/admin/menus/${menu.id}/items?itemId=${itemId}`, "DELETE");
      setError(null);
      onItemsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function handleToggle(itemId: string) {
    try {
      await api(`/api/admin/menus/${menu.id}/items`, "PUT", { itemId, is_visible: !menu.items.find((i) => i.id === itemId)?.is_visible });
      setError(null);
      onItemsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar visibilidad");
    }
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    const siblings = menu.items.filter((i) => {
      const item = menu.items.find((x) => x.id === itemId);
      return item ? i.parent_id === item.parent_id : false;
    }).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((i) => i.id === itemId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === siblings.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const ids = siblings.map((i) => i.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    try {
      await api(`/api/admin/menus/${menu.id}/items`, "PUT", { action: "reorder", orderedItemIds: ids });
      setError(null);
      onItemsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reordenar");
    }
  }

  function renderItem(item: MenuItem, depth = 0): React.ReactNode {
    const children = getChildren(item.id, menu.items);
    const protectedHome = isProtectedHomeMenuItem(item);
    return (
      <div key={item.id} className={`menu-editor-item ${!item.is_visible ? "menu-item-hidden" : ""}`} style={{ marginLeft: depth * 24 }}>
        <div className="menu-item-row">
          <span className="menu-item-label">{item.label}</span>
          <span className="menu-item-meta">{item.type} · {item.url || "—"}</span>
          <span className="menu-item-badge">{protectedHome ? "bloqueado" : !item.is_visible ? "oculto" : children.length > 0 ? `${children.length} sub` : ""}</span>
          <div className="row-actions">
            <button className="secondary-btn" onClick={() => handleMove(item.id, "up")} disabled={depth === 0 && menu.items.filter((i) => i.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order)[0]?.id === item.id}>▲</button>
            <button className="secondary-btn" onClick={() => handleMove(item.id, "down")} disabled={depth === 0 && menu.items.filter((i) => i.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order).slice(-1)[0]?.id === item.id}>▼</button>
            <button className="secondary-btn" onClick={() => { setEditingItem(item); setShowNewForm(false); }} disabled={protectedHome}>Editar</button>
            <button className="secondary-btn" onClick={() => handleToggle(item.id)} disabled={protectedHome}>{item.is_visible ? "Ocultar" : "Mostrar"}</button>
            <button className="danger-btn" onClick={() => handleDelete(item.id)} disabled={protectedHome}>Eliminar</button>
          </div>
        </div>
        {children.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="menu-items-editor">
      <div className="menu-editor-head">
        <h3>Items del menú ({menu.items.length})</h3>
        <button className="primary-btn" onClick={() => { setShowNewForm(true); setEditingItem(null); }}>Añadir item</button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {showNewForm ? (
        <div className="menu-item-form-wrap">
          <MenuItemForm
            parentOptions={parentOptions}
            onSave={handleSave}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      ) : null}

      {editingItem ? (
        <div className="menu-item-form-wrap">
          <MenuItemForm
            item={editingItem}
            parentOptions={parentOptions}
            onSave={handleSave}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      ) : null}

      <div className="menu-editor-list">
        {menu.items.length === 0 ? (
          <p className="muted" style={{ padding: "1rem 0" }}>No hay items todavía. Añade el primero.</p>
        ) : (
          buildTree(menu.items).map((item) => renderItem(item))
        )}
      </div>
    </div>
  );
}
