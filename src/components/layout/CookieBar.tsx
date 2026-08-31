"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "casarosier_cookie_consent_v2";
const LEGACY_COOKIE_KEY = "casarosier_cookie_accept_v1";

type CookieConsentStatus = "accepted" | "rejected";

const COOKIE_BTN_BASE =
  "min-h-9 cursor-pointer rounded-full border px-3.5 py-2 text-[11px]/[1] font-bold tracking-[0.08em] uppercase [font-family:var(--font-menu)] transition-[background-color,border-color,color] duration-[180ms] ease-in-out focus-visible:outline-none max-[640px]:min-h-8 max-[640px]:py-[7px] max-[640px]:px-2.5";

const COOKIE_BTN_GHOST =
  "border-[#bbb] bg-white text-[#333] hover:border-[#8b7355] hover:text-[#8b7355] focus-visible:border-[#8b7355] focus-visible:text-[#8b7355]";

const COOKIE_BTN_PRIMARY =
  "border-[#111] bg-[#111] text-white hover:border-[#8b7355] hover:bg-[#8b7355] hover:text-white focus-visible:border-[#8b7355] focus-visible:bg-[#8b7355] focus-visible:text-white";

export function CookieBar() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readPreference = () => {
      try {
        const hasConsent =
          window.localStorage.getItem(COOKIE_CONSENT_KEY) ||
          window.localStorage.getItem(LEGACY_COOKIE_KEY);
        setVisible(!hasConsent);
      } catch {
        setVisible(true);
      }
    };
    queueMicrotask(readPreference);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cookiebar-visible", visible);
    document.body.style.setProperty(
      "--cookiebar-offset",
      visible ? `${barRef.current?.offsetHeight ?? 0}px` : "0px"
    );
    return () => {
      document.body.classList.remove("cookiebar-visible");
      document.body.style.removeProperty("--cookiebar-offset");
    };
  }, [visible]);

  const choose = (status: CookieConsentStatus) => {
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({
          status,
          version: 2,
          necessary: true,
          analytics: status === "accepted",
          marketing: status === "accepted",
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // The preference still applies for the current page.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      id="cookiebar"
      ref={barRef}
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-1400 max-h-25 overflow-y-auto border-t border-[#d7d7d3] bg-[#ecebe8] shadow-[0_-6px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto grid min-h-16 max-w-295 grid-cols-[1fr_auto] items-center gap-4 p-[10px_24px_calc(10px+env(safe-area-inset-bottom,0px))] max-[992px]:p-[10px_20px] max-[640px]:min-h-18.5 max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-2.5 max-[640px]:p-[8px_12px_calc(8px+env(safe-area-inset-bottom,0px))]">
        <p className="m-0 text-[#404040] [font-family:var(--font-menu)] text-[12px]/[1.4] font-light max-[640px]:text-[11px] max-[640px]:leading-[1.35]">
          Usamos cookies necesarias y, con tu permiso, analíticas para mejorar
          la experiencia. Consulta la{" "}
          <Link
            href="/politica-privacidad"
            className="text-inherit underline underline-offset-[3px]"
          >
            política de privacidad
          </Link>
          .
        </p>
        <div className="flex gap-2 max-[640px]:flex-col max-[640px]:justify-center">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className={classNames(COOKIE_BTN_BASE, COOKIE_BTN_GHOST)}
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className={classNames(COOKIE_BTN_BASE, COOKIE_BTN_PRIMARY)}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}