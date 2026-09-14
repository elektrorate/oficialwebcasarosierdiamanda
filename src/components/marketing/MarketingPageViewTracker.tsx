"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackMarketingEvent } from "@/lib/marketing/track-event";

export default function MarketingPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let sent = false;
    const sendPageView = () => {
      if (sent) return;
      sent = true;
      void trackMarketingEvent({
        eventName: "page_view",
        pageUrl: pathname,
        metadata: { referrer: document.referrer || "" },
      });
    };

    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback
      ? window.requestIdleCallback(sendPageView, { timeout: 1500 })
      : null;
    const fallbackId = hasIdleCallback
      ? null
      : window.setTimeout(sendPageView, 750);
    window.addEventListener("pagehide", sendPageView, { once: true });

    return () => {
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (fallbackId !== null) window.clearTimeout(fallbackId);
      window.removeEventListener("pagehide", sendPageView);
      sendPageView();
    };
  }, [pathname]);

  return null;
}
