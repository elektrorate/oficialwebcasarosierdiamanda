"use client";

import { useEffect, useRef } from "react";

export function BlurRevealText({ text, className }: { text: string; className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-blur-part]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      parts.forEach((part) => {
        part.style.opacity = "1";
        part.style.filter = "none";
        part.style.transform = "none";
      });
      return;
    }

    const animations = parts.map((part, index) => part.animate(
      [
        { opacity: 0, filter: "blur(22px)", transform: "translateY(-190px) scale(0.9)" },
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 2150,
        delay: 210 + index * 145,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      },
    ));

    return () => animations.forEach((animation) => animation.cancel());
  }, [text]);

  return (
    <span ref={rootRef} className={className} aria-label={text}>
      {text.split(/(\s+)/).map((part, index) => part.trim() ? (
        <span key={`${part}-${index}`} data-blur-part aria-hidden="true" className="hero-blur-reveal__part">
          {part}
        </span>
      ) : <span key={`space-${index}`} aria-hidden="true">{part}</span>)}
    </span>
  );
}
