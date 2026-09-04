"use client";

import { useCallback, useMemo, useState } from "react";
import type { ExperienceItem } from "@/data/types";

export type ClassDetailGalleryItem = {
  id: string;
  kind: "image" | "video";
  poster: string;
  alt: string;
  seoTitle?: string;
  modalDescription?: string;
  showCta?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  ctaNewTab?: boolean;
  videoUrl?: string;
};

export function buildClassDetailGalleryItems(item: ExperienceItem): ClassDetailGalleryItem[] {
  const images = item.galleryImages.filter((entry) => Boolean(entry.image)).slice(0, 8);
  const videoUrl = item.videoUrl?.trim();

  if (videoUrl) {
    const poster = item.videoCardImage || images[0]?.image || item.coverImage || "";
    const alt = images[0]?.alt || item.title;
    const entries: ClassDetailGalleryItem[] = [
      { id: "featured-video", kind: "video", poster, alt, seoTitle: images[0]?.seoTitle, videoUrl },
    ];
    images.forEach((entry, index) => {
      entries.push({
        id: `image-${index}`,
        kind: "image",
        poster: entry.image,
        alt: entry.alt,
        seoTitle: entry.seoTitle,
        modalDescription: entry.modalDescription,
        showCta: entry.showCta,
        ctaLabel: entry.ctaLabel,
        ctaHref: entry.ctaHref,
        ctaNewTab: entry.ctaNewTab,
      });
    });
    return entries;
  }

  return images.map((entry, index) => ({
    id: `image-${index}`,
    kind: "image",
    poster: entry.image,
    alt: entry.alt,
    seoTitle: entry.seoTitle,
    modalDescription: entry.modalDescription,
    showCta: entry.showCta,
    ctaLabel: entry.ctaLabel,
    ctaHref: entry.ctaHref,
    ctaNewTab: entry.ctaNewTab,
  }));
}

export function useClassDetailGallery(item: ExperienceItem) {
  const items = useMemo(() => buildClassDetailGalleryItems(item), [item]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const safeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const activeItem = items[safeIndex] ?? null;

  const selectIndex = useCallback((index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    items,
    activeIndex: safeIndex,
    activeItem,
    isPlaying,
    selectIndex,
    startPlayback,
    stopPlayback,
  };
}
