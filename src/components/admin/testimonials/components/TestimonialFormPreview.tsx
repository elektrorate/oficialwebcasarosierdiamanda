"use client";

import { memo } from "react";
import { initialsFromName } from "../utils";
import type { TestimonialFormFields } from "../types";

function TestimonialFormPreviewComponent({ fields }: { fields: TestimonialFormFields }) {
  const { name, role, text, avatarId, isFeatured } = fields;

  return (
    <aside
      className="form-preview-card testimonial-preview-card"
      aria-label="Vista previa del testimonio"
      aria-live="polite"
    >
      <div className="testimonial-preview-card__head">
        <p className="auth-kicker">Vista previa</p>
        {isFeatured ? (
          <span className="testimonial-preview-card__badge">Destacado</span>
        ) : null}
      </div>

      <div className="testimonial-preview-card__avatar">
        {avatarId ? (
          <img src={avatarId} alt={name || "Avatar"} width={88} height={88} />
        ) : (
          <span aria-hidden="true">{initialsFromName(name)}</span>
        )}
      </div>

      <blockquote>{text.trim() || "El texto del testimonio aparecerá aquí."}</blockquote>
      <strong>{name.trim() || "Nombre de la persona"}</strong>
      <span>{role.trim() || "Rol o contexto"}</span>
    </aside>
  );
}

export const TestimonialFormPreview = memo(TestimonialFormPreviewComponent);
