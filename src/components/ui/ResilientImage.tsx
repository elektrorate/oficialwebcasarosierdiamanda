"use client";

import type { ImgHTMLAttributes } from "react";
import { applyImageFallback } from "@/lib/image-fallback";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError"> & {
  fallbackSrc?: string;
};

export function ResilientImage({ fallbackSrc, ...props }: Props) {
  return (
    <img
      {...props}
      onError={(event) => applyImageFallback(event, fallbackSrc)}
    />
  );
}
