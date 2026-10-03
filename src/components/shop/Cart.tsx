"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CartItem } from "@/data/types";
import {
  clearCart,
  readCart,
  removeCartItem
} from "@/lib/cart";

export function Cart({
  whatsappHref = "",
}: {
  whatsappHref?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = () => {
    setItems(readCart());
    setHydrated(true);
  };

  useEffect(() => {
    queueMicrotask(refresh);
    window.addEventListener("casarosier:cart", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("casarosier:cart", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!hydrated) {
    return <div className="cart__empty" aria-live="polite" />;
  }

  if (!items.length) {
    return (
      <div className="cart__empty">
        <h2>Tu carrito esta vacio</h2>
        <p>Aun no has anadido ninguna gift card ni experiencia al pedido.</p>
        <Link
          className="class-detail__button class-detail__button--primary"
          href="/gift-cards"
        >
          Ver gift cards
        </Link>
      </div>
    );
  }

  const totalItems = items.reduce(
    (count, item) => count + (item.quantity || 1),
    0
  );

  return (
    <div className="cart__layout">
      <section className="cart__items">
        <header className="cart__head">
          <h2>Tu seleccion</h2>
          <button
            className="cart__clear"
            type="button"
            onClick={() => {
              clearCart();
              refresh();
            }}
          >
            Vaciar carrito
          </button>
        </header>
        <div className="cart__list">
          {items.map((item) => (
            <article className="cart-item" key={item.cartItemId}>
              <div className="cart-item__content">
                <p className="cart-item__eyebrow">{item.kind || "producto"}</p>
                <h3 className="cart-item__title">{item.title || "Producto"}</h3>
                {item.subtitle && (
                  <p className="cart-item__subtitle">{item.subtitle}</p>
                )}
                {item.price && (
                  <p className="cart-item__price">{item.price}</p>
                )}
                <div className="cart-item__meta">
                  {item.orderSummary?.map((row) => (
                    <div
                      className="cart-item__meta-row"
                      key={`${row.label}-${row.value}`}
                    >
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="cart-item__remove"
                type="button"
                onClick={() => {
                  removeCartItem(item.cartItemId);
                  refresh();
                }}
              >
                Quitar
              </button>
            </article>
          ))}
        </div>
      </section>
      <aside className="cart__summary">
        <div className="cart__summary-card">
          <h2>Resumen del pedido</h2>
          <div className="cart__summary-rows">
            <div className="cart__summary-row">
              <span>Articulos</span>
              <strong>{totalItems}</strong>
            </div>
            {items.map((item) => (
              <div
                className="cart__summary-row cart__summary-row--stacked"
                key={item.cartItemId}
              >
                <span>{item.title || "Producto"}</span>
                <strong>{item.price || ""}</strong>
              </div>
            ))}
          </div>
          {whatsappHref ? (
            <a
              className="class-detail__button class-detail__button--primary"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Finalizar por WhatsApp
            </a>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
