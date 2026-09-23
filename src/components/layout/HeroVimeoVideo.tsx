"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOOP_FADE_SECONDS = 1.1;
const PLAYBACK_READY_TIMEOUT_MS = 6_000;

type VimeoMessage = {
  event?: string;
  data?: {
    seconds?: number;
    duration?: number;
  };
};

export function HeroVimeoVideo({
  className,
  src,
  title,
  loopFade = true,
}: {
  className: string;
  src: string;
  title: string;
  loopFade?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const subscribeToPlayback = useCallback(() => {
    const player = iframeRef.current?.contentWindow;
    if (!player) return;
    for (const eventName of ["play", "timeupdate", "error"]) {
      player.postMessage(
        { method: "addEventListener", value: eventName },
        "https://player.vimeo.com",
      );
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const readyTimeout = window.setTimeout(() => setIsPlaying(false), PLAYBACK_READY_TIMEOUT_MS);

    const onMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== "https://player.vimeo.com" ||
        event.source !== iframe.contentWindow
      ) {
        return;
      }

      let message: VimeoMessage;
      try {
        message = typeof event.data === "string" ? JSON.parse(event.data) : event.data as VimeoMessage;
      } catch {
        return;
      }

      if (message.event === "ready") {
        subscribeToPlayback();
        return;
      }

      if (message.event === "error") {
        setIsPlaying(false);
        return;
      }

      if (message.event === "play" || message.event === "timeupdate") {
        window.clearTimeout(readyTimeout);
        setIsPlaying(true);
      }

      if (!loopFade || message.event !== "timeupdate" || reduceMotion.matches) return;

      const seconds = message.data?.seconds;
      const duration = message.data?.duration;
      if (typeof seconds !== "number" || typeof duration !== "number") return;

      const fadeWindow = Math.min(LOOP_FADE_SECONDS, duration * 0.1);
      iframe.style.opacity = duration - seconds <= fadeWindow ? "0" : "1";
    };

    window.addEventListener("message", onMessage);
    subscribeToPlayback();
    return () => {
      window.clearTimeout(readyTimeout);
      window.removeEventListener("message", onMessage);
    };
  }, [loopFade, subscribeToPlayback]);

  return (
    <iframe
      ref={iframeRef}
      className={`${className} hero__video--vimeo${loopFade ? " hero__video--loop-fade" : ""}${isPlaying ? " is-playing" : ""}`}
      src={src}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      onLoad={subscribeToPlayback}
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
