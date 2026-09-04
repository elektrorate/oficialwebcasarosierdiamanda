"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ExperienceItem } from "@/data/types";
import { assetPath } from "@/lib/assets";
import { classNames } from "@/lib/utils";
import { useClassDetailGallery, type ClassDetailGalleryItem } from "../../hooks/useClassDetailGallery";
import { ClassDetailGalleryModal } from "./ClassDetailGalleryModal";
import {
  isDirectVideoFile,
  offeringVideoEmbedUrl,
  offeringVideoIsEmbeddable,
} from "../../lib/offeringVideoEmbed";

function GalleryPlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="class-gallery__play" aria-label={label} onClick={onClick}>
      <span className="class-gallery__play-icon" aria-hidden="true" />
    </button>
  );
}

function GalleryMainMedia({
  item,
  title,
  isPlaying,
  onPlay,
  onOpen,
  openButtonRef,
}: {
  item: ClassDetailGalleryItem;
  title: string;
  isPlaying: boolean;
  onPlay: () => void;
  onOpen?: () => void;
  openButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const posterSrc = assetPath(item.poster);
  const lastPosterSrc = useRef(posterSrc);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previousPosterSrc, setPreviousPosterSrc] = useState<string | null>(null);

  useEffect(() => {
    if (lastPosterSrc.current === posterSrc) return;

    setPreviousPosterSrc(lastPosterSrc.current);
    lastPosterSrc.current = posterSrc;

    if (swapTimeout.current) clearTimeout(swapTimeout.current);
    swapTimeout.current = setTimeout(() => {
      setPreviousPosterSrc(null);
      swapTimeout.current = null;
    }, 980);

    return () => {
      if (swapTimeout.current) {
        clearTimeout(swapTimeout.current);
        swapTimeout.current = null;
      }
    };
  }, [posterSrc]);

  if (item.kind === "video" && item.videoUrl && isPlaying) {
    const embedUrl = offeringVideoEmbedUrl(item.videoUrl, true);
    if (embedUrl) {
      return (
        <div className="class-gallery__main-wrap class-gallery__main-wrap--video">
          <iframe
            className="class-gallery__embed"
            src={embedUrl}
            title={`Video de ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    if (isDirectVideoFile(item.videoUrl)) {
      return (
        <div className="class-gallery__main-wrap class-gallery__main-wrap--video">
          <video
            className="class-gallery__video"
            src={assetPath(item.videoUrl)}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        </div>
      );
    }
  }

  const showPlay =
    item.kind === "video" && item.videoUrl && offeringVideoIsEmbeddable(item.videoUrl);

  return (
    <div className="class-gallery__main-wrap">
      <img className="class-gallery__main-ghost" src={posterSrc} alt="" aria-hidden="true" />
      <img className="class-gallery__main" src={posterSrc} alt={item.alt || title} title={item.seoTitle || undefined} />
      {previousPosterSrc ? (
        <img
          className="class-gallery__main class-gallery__main--previous"
          src={previousPosterSrc}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      {showPlay ? (
        <GalleryPlayButton label={`Reproducir video de ${title}`} onClick={onPlay} />
      ) : null}
      {onOpen ? (
        <button
          ref={openButtonRef}
          className="class-gallery__expand"
          type="button"
          aria-label={`Ampliar imagen de ${title}`}
          onClick={onOpen}
        />
      ) : null}
    </div>
  );
}

type Props = {
  item: ExperienceItem;
};

export function ClassDetailGallery({ item }: Props) {
  const gallery = useClassDetailGallery(item);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  }, []);

  if (!gallery.items.length || !gallery.activeItem) return null;

  return (
    <div className="class-gallery thumbnail-carousel grid gap-4.5" aria-label={`Galeria de ${item.title}`}>
      <div className="thumbnail-carousel__main">
        <GalleryMainMedia
          item={gallery.activeItem}
          title={item.title}
          isPlaying={gallery.isPlaying}
          onPlay={gallery.startPlayback}
          onOpen={gallery.activeItem.kind === "image" ? () => setIsModalOpen(true) : undefined}
          openButtonRef={openButtonRef}
        />
      </div>
      {gallery.items.length > 1 ? (
        <div className={classNames("thumbnail-carousel__thumbs", "class-gallery__thumbs grid grid-cols-4 gap-2.5 justify-self-center w-full")}>
          {gallery.items.map((mediaItem, index) => {
            const isActive = index === gallery.activeIndex;
            return (
              <div className="thumbnail-carousel__thumb-wrap" key={mediaItem.id}>
                <button
                  className={classNames("class-gallery__thumb p-0 border border-[rgba(140,119,93,0.18)] rounded-none bg-transparent overflow-hidden cursor-pointer", isActive && "is-active border-[#b06f34] shadow-[0_0_0_1px_rgba(176,111,52,0.16)]")}
                  type="button"
                  aria-label={
                    mediaItem.kind === "video"
                      ? `Ver video de ${item.title}`
                      : `Ver imagen ${index + 1} de ${item.title}`
                  }
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => gallery.selectIndex(index)}
                >
                  <img src={assetPath(mediaItem.poster)} alt={mediaItem.alt || item.title} title={mediaItem.seoTitle || undefined} loading="lazy" decoding="async" className="w-full aspect-square object-cover" />
                  {mediaItem.kind === "video" ? (
                    <span className="class-gallery__thumb-play" aria-hidden="true" />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {isModalOpen ? (
        <ClassDetailGalleryModal
          activeIndex={gallery.activeIndex}
          items={gallery.items}
          offeringTitle={item.title}
          onClose={closeModal}
          onSelect={gallery.selectIndex}
        />
      ) : null}
    </div>
  );
}
