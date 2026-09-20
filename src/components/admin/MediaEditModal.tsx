"use client";

import { useState } from "react";
import type { MediaAsset } from "@/lib/cms/types";
import { MEDIA_FOLDERS } from "@/lib/cms/types";

const folderLabels: Record<string, string> = {
  home: "Home",
  headers: "Headers",
  offerings: "Offerings",
  shop: "Shop",
  bitacora: "Bitácora",
  estudio: "Estudio",
  logos: "Logos",
  general: "General",
};

export default function MediaEditModal({
  asset,
  onClose,
}: {
  asset: MediaAsset;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(asset.title);
  const [altText, setAltText] = useState(asset.alt_text);
  const [description, setDescription] = useState(asset.description);
  const [folder, setFolder] = useState(asset.folder);
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/admin/media/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: asset.id,
        title,
        alt_text: altText,
        description,
        folder,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Error al guardar." }));
      setError(data.error || "Error al guardar.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Editar metadata</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="field">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <span>Texto alternativo</span>
          <input value={altText} onChange={(e) => setAltText(e.target.value)} />
        </div>

        <div className="field">
          <span>Descripción</span>
          <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <span>Folder</span>
          <select value={folder} onChange={(e) => setFolder(e.target.value)}>
            {MEDIA_FOLDERS.map((f) => (
              <option key={f} value={f}>
                {folderLabels[f] || f}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span>Tags (separados por coma)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="primary-btn" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
