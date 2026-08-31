"use client";

import type { CSSProperties } from "react";
import { socialIconFallback } from "@/lib/cms/public-footer-model";
import type { PublicFooterViewModel } from "@/lib/cms/public-footer-model";

export function FooterContactInfo({
  model,
  variant = "default",
}: {
  model: PublicFooterViewModel;
  variant?: "default" | "editorial";
}) {
  const { socialButtonColor, socialIconColor } = model.theme;
  const isEditorial = variant === "editorial";

  return (
    <div className="grid justify-items-center text-center gap-[clamp(8px,1.2vw,12px)] pt-0">
      <h2 className="m-0 mb-[clamp(4px,0.6vw,8px)] text-[clamp(28px,3.2vw,36px)] leading-[1.1] font-normal text-[#1a1a1a] [font-family:var(--font-display)]">{model.contactTitle}</h2>
      {model.contactLines.map((line, index) => (
        <p className="m-0 text-[clamp(13px,1.15vw,15px)] leading-normal font-light text-[#3a3a3a] [font-family:var(--font-menu)]" key={`${line}-${index}`}>
          {line}
        </p>
      ))}
      {model.extraAddress ? <p className="m-0 text-[clamp(13px,1.15vw,15px)] leading-normal font-light text-[#3a3a3a] [font-family:var(--font-menu)]">{model.extraAddress}</p> : null}
      {model.socialLinks.length > 0 ? (
        <>
          <p className="mt-[clamp(6px,1vw,10px)] mb-0 text-[clamp(13px,1.15vw,15px)] leading-normal font-light text-[#3a3a3a] [font-family:var(--font-menu)]">{model.socialTitle}</p>
          <div className="mt-[clamp(8px,1.2vw,12px)] flex items-center justify-center gap-4">
            {model.socialLinks.map((link, index) => (
              <a
                className="contact-info__social-link"
                href={link.url}
                aria-label={link.label || link.platform || `Red social ${index + 1}`}
                target="_blank"
                rel="noopener noreferrer"
                style={
                  {
                    "--contact-social-bg": socialButtonColor,
                    "--contact-social-icon": socialIconColor,
                  } as CSSProperties
                }
                key={`${link.platform}-${index}`}
              >
                <span
                  className="contact-info__social-icon"
                  aria-hidden="true"
                  style={
                    {
                      "--contact-social-icon-url": `url("${link.icon_url || socialIconFallback(link.platform)}")`,
                      "--contact-social-icon": socialIconColor,
                    } as CSSProperties
                  }
                />
              </a>
            ))}
          </div>
        </>
      ) : null}
      {model.mapUrl ? (
        <div className="mt-[clamp(20px,2.8vw,32px)] w-full flex justify-center">
          {isEditorial ? (
            <a
              className="inline-flex flex-col items-center gap-0 text-[#b5a48b] text-[clamp(22px,2.65vw,28px)] leading-[1.35] font-light no-underline lowercase tracking-[0.03em] text-center [font-family:var(--font-menu)] hover:text-[#957a4e] hover:no-underline focus-visible:text-[#957a4e] focus-visible:outline-none"
              href={model.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="block">{model.mapLinkLines[0]}</span>
              <span className="block">{model.mapLinkLines[1]}</span>
            </a>
          ) : (
            <a className="contact-info__map-link" href={model.mapUrl} target="_blank" rel="noopener noreferrer">
              Ver en Google Maps
            </a>
          )}
        </div>
      ) : null}
      {!isEditorial ? (
        <div className="contact-info__legal-links" aria-label="Enlaces legales">
          <a className="contact-info__legal-link" href="/politica-privacidad">
            Política y privacidad
          </a>
          <a className="contact-info__legal-link" href="/auth">
            Administración
          </a>
        </div>
      ) : null}
    </div>
  );
}
