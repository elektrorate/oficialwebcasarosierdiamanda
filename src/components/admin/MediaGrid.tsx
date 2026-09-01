"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { MediaAsset } from "@/lib/cms/types";

type Toast = { type: "success" | "error"; message: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(asset: MediaAsset) {
  return ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"].includes(asset.file_type);
}

function isVideo(asset: MediaAsset) {
  return ["mp4", "webm", "mov", "m4v"].includes(asset.file_type);
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return window.location.origin + url;
}

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export default function MediaGrid({
  assets,
  onSelect,
}: {
  assets: MediaAsset[];
  onSelect?: (url: string) => void;
}) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);

  const photoAssets = useMemo(() => assets.filter((a) => isImage(a)), [assets]);
  const selectableIds = useMemo(() => new Set(photoAssets.map((a) => a.id)), [photoAssets]);

  const allPhotosSelected = photoAssets.length > 0 && photoAssets.every((a) => selectedIds.has(a.id));
  const selectableSelectedIds = useMemo(
    () => new Set([...selectedIds].filter((id) => selectableIds.has(id))),
    [selectedIds, selectableIds],
  );

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(absoluteUrl(url));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3000);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPhotosSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of photoAssets) {
          if (isImage(id)) next.add(id.id);
        }
        return next;
      });
    }
  }

  async function deletePhoto(asset: MediaAsset) {
    if (deleting) return;
    if (!window.confirm("¿Eliminar esta foto definitivamente de Multimedia y Supabase?")) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id, action: "permanent" }),
      });

      if (response.ok) {
        showToast({ type: "success", message: "Foto eliminada correctamente." });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(asset.id);
          return next;
        });
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      showToast({ type: "error", message: data.error || "No se pudo eliminar la foto." });
    } catch {
      showToast({ type: "error", message: "No se pudo conectar con el servidor. Intenta nuevamente." });
    } finally {
      setDeleting(false);
    }
  }

  async function deleteSelected() {
    if (deleting) return;
    const ids = [...selectableSelectedIds];
    if (!ids.length) return;

    if (!window.confirm(`¿Eliminar definitivamente ${ids.length} foto${ids.length > 1 ? "s" : ""} de Multimedia y Supabase?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "permanent" }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        deletedIds?: string[];
        failedIds?: string[];
        error?: string;
      };

      if (response.ok || data.ok) {
        showToast({
          type: "success",
          message: `${data.deletedIds?.length ?? ids.length} foto${ids.length > 1 ? "s" : ""} eliminada${ids.length > 1 ? "s" : ""} correctamente.`,
        });
        const deleted = new Set(data.deletedIds ?? ids);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of deleted) next.delete(id);
          return next;
        });
        router.refresh();
        return;
      }

      showToast({ type: "error", message: data.error || "No se pudieron eliminar las fotos." });
    } catch {
      showToast({ type: "error", message: "No se pudo conectar con el servidor. Intenta nuevamente." });
    } finally {
      setDeleting(false);
    }
  }

  const numSelected = selectableSelectedIds.size;

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`rounded-xl border px-4 py-3 text-label-md ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-error bg-error-container text-on-error-container"
          }`}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}

      {photoAssets.length ? (
        <div className="media-grid-toolbar">
          <label className="media-grid-toolbar__select-all">
            <input
              type="checkbox"
              checked={allPhotosSelected}
              disabled={deleting}
              onChange={toggleSelectAll}
            />
            <span>{allPhotosSelected ? "Quitar selección" : "Seleccionar todas"}</span>
          </label>

          {numSelected > 0 ? (
            <span className="media-grid-toolbar__count">
              {numSelected} seleccionada{numSelected > 1 ? "s" : ""}
            </span>
          ) : null}

          {numSelected > 0 ? (
            <button
              type="button"
              className="danger-btn"
              disabled={deleting}
              onClick={deleteSelected}
            >
              {deleting ? "Eliminando..." : `Eliminar ${numSelected}`}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="media-grid">
        {assets.map((asset) => {
          const isPhoto = isImage(asset);
          const isSelected = isPhoto && selectedIds.has(asset.id);
          const isDeleting = deleting;

          return (
            <div
              key={asset.id}
              className={`media-card${isSelected ? " media-card--selected" : ""}`}
            >
              <div className="media-preview relative">
                {isPhoto ? (
                  isAbsoluteUrl(asset.file_url) ? (
                    <img src={asset.file_url} alt={asset.alt_text || asset.original_name} className="media-img-preview" />
                  ) : (
                    <Image src={asset.file_url} alt={asset.alt_text || asset.original_name} fill sizes="220px" className="object-cover" unoptimized />
                  )
                ) : isVideo(asset) ? (
                  <video src={asset.file_url} className="media-video-preview" controls preload="metadata" />
                ) : (
                  <div className="media-file-icon">
                    <span>{asset.file_type.toUpperCase() || "FILE"}</span>
                  </div>
                )}

                {isPhoto ? (
                  <label className="media-card__checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${asset.original_name}`}
                      checked={isSelected}
                      disabled={deleting}
                      onChange={() => toggleSelect(asset.id)}
                    />
                  </label>
                ) : null}
              </div>

              <div className="media-info">
                <strong className="media-name">{asset.original_name}</strong>
                <p className="muted">{asset.folder} · {formatSize(asset.size)}</p>
                <a className="media-url" href={asset.file_url} target="_blank" rel="noopener noreferrer">
                  {asset.file_url}
                </a>
              </div>

              <div className="media-actions">
                {onSelect ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => onSelect(asset.file_url)}
                  >
                    Seleccionar
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={isDeleting}
                  onClick={() => copyUrl(asset.file_url, asset.id)}
                >
                  {copiedId === asset.id ? "Copiado" : "Copiar URL"}
                </button>
                {!onSelect && isPhoto ? (
                  <button
                    type="button"
                    className="danger-btn"
                    disabled={isDeleting}
                    onClick={() => deletePhoto(asset)}
                  >
                    Eliminar foto
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
