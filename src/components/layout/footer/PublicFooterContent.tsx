"use client";

import { useMemo } from "react";
import type { SiteSettings } from "@/lib/cms/settings";
import {
  buildPublicFooterViewModel,
  type PublicFooterViewModel,
} from "@/lib/cms/public-footer-model";
import type { FooterComponent, Form } from "@/lib/cms/types";
import { FooterContactForm } from "./FooterContactForm";
import { FooterContactInfo } from "./FooterContactInfo";
import { FooterSocialMarquee } from "./FooterSocialMarquee";

export type PublicFooterContentProps = {
  model?: PublicFooterViewModel;
  footer?: FooterComponent | null;
  contactForm?: Form | null;
  siteContact?: SiteSettings["contact"];
  siteName?: string;
  footerLegalText?: string;
  socialTrack?: boolean;
  preview?: boolean;
};

export function PublicFooterContent({
  model: modelProp,
  footer,
  contactForm,
  siteContact,
  siteName = "Casa Rosier",
  footerLegalText,
  socialTrack = false,
  preview = false,
}: PublicFooterContentProps) {
  const model = useMemo(
    () =>
      modelProp ??
      buildPublicFooterViewModel({
        footer,
        contactForm,
        siteContact: siteContact ?? {
          email: "",
          phone: "",
          whatsapp: "",
          address: "",
          city: "",
          country: "",
          map_url: "",
        },
        siteName,
        footerLegalText,
      }),
    [contactForm, footer, footerLegalText, modelProp, siteContact, siteName],
  );

  const marqueeHref = model.socialLinks[0]?.url?.trim() || null;

  return (
    <footer
      id="footer"
      className="bg-[#faf9f6]"
      style={model.themeStyle}
    >
      {socialTrack ? <FooterSocialMarquee href={marqueeHref} /> : null}
      <section
        id="contacto-footer"
        className="py-[clamp(64px,8vw,92px)] pb-[clamp(48px,6vw,72px)]"
      >
        <div className="container max-w-[min(560px,100%)] flex flex-col items-stretch gap-[clamp(28px,4vw,40px)]">
          <FooterContactInfo model={model} variant="editorial" />
          <FooterContactForm config={model.contactForm} preview={preview} />
          <nav
            className="grid w-full grid-cols-[1fr_auto_1fr] items-center mt-[clamp(8px,1.5vw,16px)] pt-[clamp(12px,2vw,20px)] max-[640px]:grid-cols-1 max-[640px]:justify-items-center max-[640px]:gap-2.5 max-[640px]:text-center"
            aria-label="Enlaces legales del sitio"
          >
            <a
              className="text-[#8a8a8a] text-[clamp(11px,1vw,12px)] leading-[1.3] font-light no-underline [font-family:var(--font-menu)] transition-colors duration-180 ease-in-out hover:text-[#5a5a5a] justify-self-start max-[640px]:col-1 max-[640px]:justify-self-center"
              href="/auth"
            >
              Administración
            </a>
            <a
              className="text-[#8a8a8a] text-[clamp(11px,1vw,12px)] leading-[1.3] font-light no-underline [font-family:var(--font-menu)] transition-colors duration-180 ease-in-out hover:text-[#5a5a5a] col-2 justify-self-center max-[640px]:col-1 max-[640px]:justify-self-center"
              href="/politica-privacidad"
            >
              Política y privacidad
            </a>
          </nav>
        </div>
      </section>
      {model.legalCopy ? (
        <div className="mt-0 px-6 pb-[clamp(24px,4vw,32px)] pt-0 border-t-0 text-center">
          <p className="m-0 text-[11px] leading-normal font-light text-[#9a9a9a] [font-family:var(--font-menu)]">{model.legalCopy}</p>
        </div>
      ) : null}
    </footer>
  );
}
