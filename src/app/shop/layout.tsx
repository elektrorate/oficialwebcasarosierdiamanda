import type { ReactNode } from "react";
import "../legacy/shop.css";
import "../../features/shop/components/catalog/shop-catalog.css";
import "../../features/shop/components/item-detail/shop-item-detail.css";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
