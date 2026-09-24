"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MediaLibraryModal from "./MediaLibraryModal";
import {
  formatUploadMegabytes,
  uploadAdminMediaFile,
  validateImageFileForUpload,
} from "@/lib/admin/media-upload-client";

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function localImageSrc(url: string) {
  if (!url) return "";
  return url.startsWith("/") ? url : `/${url}`;
}

export type MediaResolutionHint = {
  renderWidthPx?: number;
  recommendedMinWidth?: number;
  recommendedMinHeight?: number;
};

export default function MediaSelectField({
  label,
  value,
  onChange,
  className,
  previewClassName,
  folder = "general",
  resolutionHint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  previewClassName?: string;
  folder?: string;
  resolutionHint?: MediaResolutionHint;
}) {
  const uploadInFlight = useRef(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setMeasured(null);
  }, [value]);

  const effectiveMinWidth = resolutionHint?.recommendedMinWidth ?? resolutionHint?.renderWidthPx ?? 0;
  const showResolutionWarning =
    Boolean(resolutionHint) &&
    measured !== null &&
    effectiveMinWidth > 0 &&
    measured.width > 0 &&
    measured.width < effectiveMinWidth;

  async function uploadFile(file: File) {
    if (uploadInFlight.current) return;

    const validationError = validateImageFileForUpload(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    uploadInFlight.current = true;
    setIsUploading(true);
    setError(null);
    setUploadHint(`Subiendo ${formatUploadMegabytes(file.size)}…`);

    try {
      const result = await uploadAdminMediaFile({
        file,
        folder,
        title: file.name,
        altText: label,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.optimization?.optimized) {
        setUploadHint(
          `Optimizada: ${formatUploadMegabytes(result.optimization.originalSize)} → ${formatUploadMegabytes(result.optimization.finalSize)}`,
        );
      } else if (result.clientCompressed) {
        setUploadHint("Imagen reducida en el navegador antes de subir.");
      } else {
        setUploadHint(null);
      }

      onChange(result.fileUrl);
    } finally {
      uploadInFlight.current = false;
      setIsUploading(false);
    }
  }

  return (
    <div className={["media-select-field", className].filter(Boolean).join(" ")}>
      <span className="field-label">{label}</span>
      <div className={["img-preview relative", previewClassName].filter(Boolean).join(" ")}>
        {value ? (
          isAbsoluteUrl(value) ? (
            <img src={value} alt={label} className="media-img-preview" />
          ) : (
            <Image src={localImageSrc(value)} alt={label} fill sizes="260px" className="object-cover" unoptimized />
          )
        ) : (
          <span className="media-select-field__empty">Sin imagen</span>
        )}
      </div>
      <div className="media-select-field__actions">
        <button
          type="button"
          className="secondary-btn"
          aria-expanded={showPicker}
          onClick={() => setShowPicker(true)}
        >
          Biblioteca
        </button>
        <label className="secondary-btn" style={{ cursor: isUploading ? "wait" : "pointer" }}>
          {isUploading ? uploadHint || "Subiendo…" : "Subir"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {value ? (
          <button type="button" className="danger-btn" onClick={() => onChange("")}>
            Limpiar
          </button>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!error && uploadHint && !isUploading ? (
        <p className="text-label-md text-on-surface-variant">{uploadHint}</p>
      ) : null}

      <MediaLibraryModal
        open={showPicker}
        onSelect={(url) => {
          onChange(url);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}
