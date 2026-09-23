"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { classNames } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 48;
const CLICK_SUPPRESS_PX = 8;
const AXIS_LOCK_PX = 6;

interface CarouselRenderMeta {
  index: number;
  realIndex: number;
  isDuplicate: boolean;
  isActive: boolean;
}

interface CarouselProps<T> {
  items: readonly T[];
  renderItem: (item: T, meta: CarouselRenderMeta) => ReactNode;
  getSlideProps?: (
    item: T,
    meta: CarouselRenderMeta
  ) => HTMLAttributes<HTMLDivElement>;
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  trackClassName?: string;
  slideClassName?: string;
  dotsClassName?: string;
  dotClassName?: string;
  arrowClassName?: string;
  previousArrowClassName?: string;
  nextArrowClassName?: string;
  showDots?: boolean;
  showArrows?: boolean;
  marquee?: boolean;
  /** Enable pointer drag / swipe between slides. Defaults to true when navigable. */
  draggable?: boolean;
  autoPlayMs?: number;
  previousLabel?: string;
  nextLabel?: string;
  dotLabel?: (index: number) => string;
  getSlideId?: (item: T, index: number) => string;
  onIndexChange?: (index: number) => void;
}

type DragAxis = null | "x" | "y";

export function Carousel<T>({
  items,
  renderItem,
  getSlideProps,
  ariaLabel,
  className,
  viewportClassName,
  trackClassName,
  slideClassName,
  dotsClassName,
  dotClassName,
  arrowClassName,
  previousArrowClassName,
  nextArrowClassName,
  showDots = false,
  showArrows = false,
  marquee = false,
  draggable = true,
  autoPlayMs,
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  dotLabel = (index) => `Ir al slide ${index + 1}`,
  getSlideId,
  onIndexChange
}: CarouselProps<T>) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    lastX: 0,
    locked: null as DragAxis,
  });
  const canNavigate = items.length > 1;
  const enableDrag = draggable && canNavigate && !marquee;
  const renderedItems = useMemo(
    () => (marquee ? [...items, ...items] : [...items]),
    [items, marquee]
  );

  const goTo = useCallback((nextIndex: number) => {
    if (!items.length) return;
    const normalized = (nextIndex + items.length) % items.length;
    setIndex(normalized);
    onIndexChange?.(normalized);
  }, [items.length, onIndexChange]);

  useEffect(() => {
    if (
      marquee ||
      paused ||
      isDragging ||
      !autoPlayMs ||
      !canNavigate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      goTo(index + 1);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [autoPlayMs, canNavigate, goTo, index, isDragging, marquee, paused]);

  useEffect(() => {
    if (!marquee) return;
    const element = viewportRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsInView(entry.isIntersecting);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [marquee]);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const dx = drag.lastX - drag.startX;
    const wasHorizontal = drag.locked === "x";

    drag.active = false;
    drag.pointerId = null;
    drag.locked = null;

    if (wasHorizontal) {
      if (Math.abs(dx) >= CLICK_SUPPRESS_PX) {
        suppressClickRef.current = true;
      }
      if (dx <= -DRAG_THRESHOLD_PX) goTo(index + 1);
      else if (dx >= DRAG_THRESHOLD_PX) goTo(index - 1);
    }

    setDragOffsetPx(0);
    setIsDragging(false);
    setPaused(false);

    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
  }, [goTo, index]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enableDrag || event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest("a, button, input, textarea, select, label")) {
      return;
    }

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      locked: null,
    };
    setPaused(true);
  }, [enableDrag]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.locked) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      drag.locked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      if (drag.locked === "y") {
        drag.active = false;
        drag.pointerId = null;
        setPaused(false);
        return;
      }
      viewportRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    if (drag.locked !== "x") return;

    event.preventDefault();
    drag.lastX = event.clientX;
    setDragOffsetPx(dx);
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  if (!items.length) return null;

  const trackStyle = marquee
    ? undefined
    : {
        transform: `translateX(calc(-${index * 100}% + ${dragOffsetPx}px))`,
        transition: isDragging ? "none" : undefined,
      };

  return (
    <div
      className={classNames(
        "carousel",
        marquee && "carousel--marquee",
        marquee && (isInView ? "is-in-view" : "is-out-of-view"),
        enableDrag && "carousel--draggable",
        isDragging && "is-dragging",
        className
      )}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (!canNavigate || marquee) return;
        if (event.key === "ArrowLeft") goTo(index - 1);
        if (event.key === "ArrowRight") goTo(index + 1);
      }}
    >
      {showArrows && canNavigate && (
        <button
          className={classNames(
            "carousel__arrow carousel__arrow--prev",
            arrowClassName,
            previousArrowClassName
          )}
          type="button"
          aria-label={previousLabel}
          onClick={() => goTo(index - 1)}
        >
          <span aria-hidden="true">&lt;</span>
        </button>
      )}
      <div
        ref={viewportRef}
        className={classNames("carousel__viewport", viewportClassName)}
        onPointerDown={enableDrag ? onPointerDown : undefined}
        onPointerMove={enableDrag ? onPointerMove : undefined}
        onPointerUp={enableDrag ? endDrag : undefined}
        onPointerCancel={enableDrag ? endDrag : undefined}
        onClickCapture={enableDrag ? onClickCapture : undefined}
      >
        <div
          className={classNames("carousel__track", trackClassName)}
          style={trackStyle}
        >
          {renderedItems.map((item, itemIndex) => {
            const realIndex = itemIndex % items.length;
            const isDuplicate = itemIndex >= items.length;
            const slideId = getSlideId?.(item, realIndex);

            const meta = {
              index: itemIndex,
              realIndex,
              isDuplicate,
              isActive: realIndex === index
            };
            const slideProps = getSlideProps?.(item, meta) ?? {};

            return (
              <div
                {...slideProps}
                className={classNames("carousel__slide", slideClassName)}
                id={!isDuplicate ? slideId : undefined}
                aria-hidden={isDuplicate || undefined}
                key={`${slideId ?? realIndex}-${itemIndex}`}
              >
                {renderItem(item, meta)}
              </div>
            );
          })}
        </div>
      </div>
      {showArrows && canNavigate && (
        <button
          className={classNames(
            "carousel__arrow carousel__arrow--next",
            arrowClassName,
            nextArrowClassName
          )}
          type="button"
          aria-label={nextLabel}
          onClick={() => goTo(index + 1)}
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      )}
      {showDots && canNavigate && (
        <div className={classNames("carousel__dots", dotsClassName)}>
          {items.map((item, dotIndex) => (
            <button
              className={classNames(
                "carousel__dot",
                dotClassName,
                dotIndex === index && "is-active"
              )}
              type="button"
              aria-label={dotLabel(dotIndex)}
              aria-controls={getSlideId?.(item, dotIndex)}
              aria-pressed={dotIndex === index}
              onClick={() => goTo(dotIndex)}
              key={getSlideId?.(item, dotIndex) ?? dotIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ThumbnailGalleryProps<T> {
  items: readonly T[];
  renderMain: (item: T, index: number) => ReactNode;
  renderThumb: (
    item: T,
    index: number,
    isActive: boolean,
    select: () => void
  ) => ReactNode;
  ariaLabel: string;
  className?: string;
  mainClassName?: string;
  thumbsClassName?: string;
}

export function ThumbnailGallery<T>({
  items,
  renderMain,
  renderThumb,
  ariaLabel,
  className,
  mainClassName,
  thumbsClassName
}: ThumbnailGalleryProps<T>) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  if (!current) return null;

  return (
    <div className={classNames("thumbnail-carousel", className)} role="region" aria-label={ariaLabel}>
      <div className={classNames("thumbnail-carousel__main", mainClassName)}>
        {renderMain(current, active)}
      </div>
      <div className={classNames("thumbnail-carousel__thumbs", thumbsClassName)}>
        {items.map((item, index) => (
          <div className="thumbnail-carousel__thumb-wrap" key={index}>
            {renderThumb(item, index, active === index, () => setActive(index))}
          </div>
        ))}
      </div>
    </div>
  );
}
