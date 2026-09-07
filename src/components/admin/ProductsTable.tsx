"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductCategory, ProductStatus } from "@/lib/cms/types";
import { formatAdminDateTime } from "@/lib/admin/date-format";
import AdminActionModal from "./AdminActionModal";

type Notice = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

type ConfirmAction = {
  id: string;
  action: string;
  title: string;
  message: string;
  confirmLabel: string;
};

const statusLabels: Record<ProductStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
  deleted: "Papelera",
};

function money(value: number | null) {
  return value !== null ? `${value} €` : "—";
}

function stockLabel(product: Product) {
  return product.stock !== null ? String(product.stock) : "∞";
}

function statusClass(status: ProductStatus) {
  return `shop-product-status is-${status}`;
}

export default function ProductsTable({
  items,
  categories,
  pagination,
}: {
  items: Product[];
  categories: ProductCategory[];
  pagination?: { total: number; q: string };
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [query, setQuery] = useState(pagination?.q ?? "");

  function catName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
  }


  function message(action: string) {
    if (action === "publish") return "Publicado exitosamente.";
    if (action === "draft") return "Borrador guardado correctamente.";
    if (action === "trash") return "Movido a papelera exitosamente.";
    return "Acción completada correctamente.";
  }

  async function run(id: string, action: string) {
    if (pendingAction) return;
    setNotice(null);
    setPendingAction(`${id}:${action}`);
    try {
      const r = await fetch(`/api/admin/shop/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (r.ok) {
        setNotice({ type: "success", title: "Acción completada", message: message(action) });
        router.refresh();
        return;
      }
      const data = await r.json().catch(() => ({})) as { error?: string };
      setNotice({ type: "error", title: "No se pudo completar", message: data.error || "No se pudo completar la acción." });
    } catch {
      setNotice({ type: "error", title: "No se pudo conectar", message: "Revisa la conexión y vuelve a intentarlo." });
    } finally {
      setPendingAction(null);
    }
  }

  function requestTrash(product: Product) {
    setConfirm({
      id: product.id,
      action: "trash",
      title: "Mover a papelera",
      message: `Se moverá "${product.name}" a la papelera. Puedes restaurarlo después desde Papelera.`,
      confirmLabel: "Mover a papelera",
    });
  }

  function renderMenu(product: Product) {
    const rowPending = pendingAction?.startsWith(`${product.id}:`);
    const isPublished = product.status === "published";
    const nextAction = isPublished ? "draft" : "publish";
    const nextLabel = isPublished ? "Pasar a borrador" : "Publicar";
    const pendingLabel = isPublished ? "Guardando..." : "Publicando...";

    return (
      <details className="shop-product-menu">
        <summary aria-label={`Más acciones para ${product.name}`}>...</summary>
        <div className="shop-product-menu__panel">
          <button className="shop-product-menu__item" type="button" disabled={rowPending} onClick={() => run(product.id, nextAction)}>
            {pendingAction === `${product.id}:${nextAction}` ? pendingLabel : nextLabel}
          </button>
        </div>
      </details>
    );
  }

  return (
    <>
      <div className="shop-products-panel">
        <form action="/admin/shop" method="get" className="shop-products-toolbar">
          <input type="hidden" name="tab" value="items" />
          <label className="shop-products-search">
            <span>Buscar</span>
            <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, SKU o categoria" />
          </label>
          <button type="submit" className="secondary-btn">Buscar</button>
          <p>{items.length} de {pagination?.total ?? items.length} articulos</p>
        </form>

        {items.length ? (
          <>
            <div className="table-card shop-products-table-card shop-products-desktop-table">
              <table className="admin-table shop-products-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Actualizado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => {
                    const lowStock = product.stock !== null && product.stock <= product.low_stock_threshold;
                    return (
                      <tr key={product.id}>
                        <td>
                          <strong className="shop-product-title">{product.name}</strong>
                          <span className="shop-product-sku">{product.sku || "Sin SKU"}</span>
                        </td>
                        <td><span className="entity-badge">{catName(product.category_id) || "—"}</span></td>
                        <td className="shop-product-price">{money(product.price)}</td>
                        <td><span className={lowStock ? "shop-product-stock is-low" : "shop-product-stock"}>{stockLabel(product)}</span></td>
                        <td><span className={statusClass(product.status)}>{statusLabels[product.status]}</span></td>
                        <td className="shop-product-updated">{formatAdminDateTime(product.updated_at)}</td>
                        <td>
                          <div className="shop-product-actions">
                            <a className="shop-product-edit" href={`/admin/shop/products/${product.id}/edit`}>Editar</a>
                            {renderMenu(product)}
                            <button
                              className="shop-product-delete"
                              type="button"
                              disabled={pendingAction?.startsWith(`${product.id}:`)}
                              onClick={() => requestTrash(product)}
                            >
                              {pendingAction === `${product.id}:trash` ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="shop-products-mobile-list">
              {items.map((product) => {
                const lowStock = product.stock !== null && product.stock <= product.low_stock_threshold;
                return (
                  <article className="shop-product-card" key={product.id}>
                    <div className="shop-product-card__head">
                      <div>
                        <h3>{product.name}</h3>
                        <p>{catName(product.category_id)} · {product.sku || "Sin SKU"}</p>
                      </div>
                      <span className={statusClass(product.status)}>{statusLabels[product.status]}</span>
                    </div>
                    <div className="shop-product-card__meta">
                      <span>{money(product.price)}</span>
                      <span className={lowStock ? "shop-product-stock is-low" : "shop-product-stock"}>Stock {stockLabel(product)}</span>
                      <span>{formatAdminDateTime(product.updated_at)}</span>
                    </div>
                    <div className="shop-product-card__actions">
                      <a className="shop-product-edit" href={`/admin/shop/products/${product.id}/edit`}>Editar</a>
                      {renderMenu(product)}
                      <button
                        className="shop-product-delete"
                        type="button"
                        disabled={pendingAction?.startsWith(`${product.id}:`)}
                        onClick={() => requestTrash(product)}
                      >
                        {pendingAction === `${product.id}:trash` ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="muted">No hay artículos con ese filtro.</p>
        )}
      </div>

      <AdminActionModal
        open={Boolean(notice)}
        type={notice?.type}
        title={notice?.title ?? ""}
        message={notice?.message}
        confirmLabel="Entendido"
        onClose={() => setNotice(null)}
      />
      <AdminActionModal
        open={Boolean(confirm)}
        type="confirm"
        title={confirm?.title ?? ""}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => {
          if (confirm) void run(confirm.id, confirm.action);
        }}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
