"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ShopIconEye } from "./ShopProductIcons";

type Props = {
  productHref: string;
  productName: string;
};

function stop(event: MouseEvent) {
  event.stopPropagation();
}

export function ShopProductCardActions({
  productHref,
  productName,
}: Props) {
  return (
    <div className="shop-product-card__actions" role="group" aria-label={`Acciones para ${productName}`}>
      <Link
        href={productHref}
        className="shop-product-card__action"
        aria-label={`Ver ${productName}`}
        onClick={stop}
      >
        <ShopIconEye />
      </Link>
    </div>
  );
}
