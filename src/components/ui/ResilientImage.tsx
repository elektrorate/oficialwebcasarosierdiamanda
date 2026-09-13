"use client";

import Image, { type ImageProps } from "next/image";
import { applyImageFallback } from "@/lib/image-fallback";

type Props = Omit<ImageProps, "onError"> & {
  fallbackSrc?: string;
};

export function ResilientImage({ fallbackSrc, ...props }: Props) {
  return (
    <Image
      {...props}
      onError={(event) => applyImageFallback(event, fallbackSrc)}
    />
  );
}
