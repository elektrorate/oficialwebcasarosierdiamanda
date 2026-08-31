"use client";

import { memo, useMemo } from "react";
import type { PublicFooterContactFormProps } from "@/lib/cms/public-footer-model";
import {
  layoutFooterFormFieldNodes,
  sortedVisibleFooterFormFields,
} from "@/lib/layout/footer-contact-form/fields";
import { useFooterContactFormSubmit } from "@/lib/layout/footer-contact-form/useFooterContactFormSubmit";
import { classNames } from "@/lib/utils";
import { FooterContactFormField } from "./FooterContactFormField";

function FooterContactFormComponent({
  config,
  preview = false,
}: {
  config: PublicFooterContactFormProps;
  preview?: boolean;
}) {
  const fields = useMemo(() => sortedVisibleFooterFormFields(config.form), [config.form]);
  const nodes = useMemo(() => layoutFooterFormFieldNodes(fields), [fields]);
  const { state, message, handleSubmit, isSubmitting } = useFooterContactFormSubmit(config, preview);

  const body = (
    <>
      {nodes.map((node) =>
        node.kind === "row" ? (
          <div className="grid grid-cols-2 gap-[clamp(10px,1.4vw,12px)] max-[640px]:grid-cols-1" key={node.key}>
            <FooterContactFormField field={node.fields[0]} preview={preview} />
            <FooterContactFormField field={node.fields[1]} preview={preview} />
          </div>
        ) : (
          <FooterContactFormField key={node.key} field={node.field} preview={preview} />
        ),
      )}
      <button
        className="mt-[clamp(8px,1.2vw,12px)] w-fit min-w-22 cursor-pointer justify-self-start rounded-lg border-0 bg-(--contact-submit-bg,#111) py-3 px-7 text-[clamp(13px,1.1vw,14px)] leading-none font-normal text-(--contact-submit-color,#fff) [font-family:var(--font-menu)]"
        type={preview ? "button" : "submit"}
        disabled={preview || isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar"}
      </button>
      {message ? (
        <p
          role="status"
          className={classNames(
            "-mt-1 mb-0 text-[10px] leading-[1.4] font-light text-[#4a4a4a] [font-family:var(--font-menu)]",
            state === "success" && "text-[#006d21]",
            state === "error" && "text-[#9f1d1d]",
          )}
        >
          {message}
        </p>
      ) : null}
    </>
  );

  if (preview) {
    return (
      <div
        className="grid w-full gap-[clamp(10px,1.4vw,12px)]"
        aria-label="Formulario de contacto del footer"
      >
        {body}
      </div>
    );
  }

  return (
    <form className="grid w-full gap-[clamp(10px,1.4vw,12px)]" onSubmit={handleSubmit}>
      {body}
    </form>
  );
}

export const FooterContactForm = memo(FooterContactFormComponent);
