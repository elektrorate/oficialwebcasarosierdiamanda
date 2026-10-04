"use client";

import { useEffect, useState } from "react";
import { getActionWarnings } from "@/lib/admin/action-warnings";
import {
  getSeoContentFields,
  getSeoWarnings,
  resolveSeoText,
  SEO_RECOMMENDED_DESCRIPTION_LENGTH,
  SEO_RECOMMENDED_TITLE_LENGTH,
  type SeoFields,
  type SeoPeer,
  type SeoSiteConfig,
} from "@/lib/seo/content";

export function SeoServerWarnings({ warnings }: { warnings?: string[] }) {
  const messages = getActionWarnings(warnings);
  if (!messages.length) return null;
  return (
    <div role="status" className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface">
      <p className="font-semibold">Avisos SEO del ultimo guardado o publicacion</p>
      <p className="mt-1">La accion se completo. Estos avisos no bloquean la publicacion.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 break-words">
        {messages.map((warning, index) => <li key={`${index}:${warning}`}>{warning}</li>)}
      </ul>
    </div>
  );
}

export default function SeoReview({ serverWarnings = [], ...fields }: SeoFields & { serverWarnings?: string[] }) {
  const [peers, setPeers] = useState<SeoPeer[]>([]);
  const [peerError, setPeerError] = useState<string | null>(null);
  const [peersLoaded, setPeersLoaded] = useState(false);
  const [site, setSite] = useState<SeoSiteConfig>({ siteName: "Casa Rosier", defaultSeoDescription: "" });
  const hasKind = Boolean(fields.kind);

  useEffect(() => {
    if (!hasKind) return;
    const controller = new AbortController();
    fetch("/api/admin/seo-review", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudieron comprobar los duplicados SEO.");
        const data = await response.json() as { peers?: SeoPeer[]; site?: SeoSiteConfig };
        if (!Array.isArray(data.peers)) throw new Error("La revision SEO devolvio una respuesta no valida.");
        if (!data.site || typeof data.site.siteName !== "string" || typeof data.site.defaultSeoDescription !== "string") {
          throw new Error("No se pudo comprobar la configuracion de respaldo SEO.");
        }
        return { peers: data.peers, site: data.site };
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setPeers(data.peers);
        setSite(data.site);
        setPeersLoaded(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPeerError(error instanceof Error ? error.message : "No se pudieron comprobar los duplicados SEO.");
      });
    return () => controller.abort();
  }, [hasKind]);

  const effectiveFields = fields.kind ? getSeoContentFields(fields.kind, {
    id: fields.id, seo_title: fields.title, seo_description: fields.description,
    title: fields.fallbackTitle, name: fields.fallbackTitle,
    excerpt: fields.fallbackDescription, hero_subtitle: fields.fallbackDescription,
  }, site) : fields;
  const preview = resolveSeoText(effectiveFields);
  const warnings = getSeoWarnings(effectiveFields, peers);

  return (
    <section aria-label="Revision SEO" className="my-5 min-w-0 space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-on-surface">
      <div>
        <h2 className="text-title-md font-semibold">Revision SEO</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Recomendaciones informativas. Puedes guardar y publicar sin resolverlas.</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <p>Titulo SEO: {(fields.title ?? "").length} caracteres. Recomendado: hasta {SEO_RECOMMENDED_TITLE_LENGTH}.</p>
          <p>Descripcion SEO: {(fields.description ?? "").length} caracteres. Recomendado: hasta {SEO_RECOMMENDED_DESCRIPTION_LENGTH}.</p>
        </div>
      </div>
      <div aria-live="polite" className="text-sm">
        {warnings.length ? <ul className="list-disc space-y-1 pl-5 break-words">{warnings.map((warning, index) => <li key={`${index}:${warning}`}>{warning}</li>)}</ul> : <p>Sin avisos SEO locales.</p>}
        {hasKind ? <p className="mt-2 text-on-surface-variant">{peerError ?? (peersLoaded ? "Duplicados revisados con los datos cargados al abrir el formulario." : "Comprobando duplicados SEO...")}</p> : null}
      </div>
      <div className="min-w-0 rounded-lg border border-outline-variant bg-white p-4 break-words">
        <p className="mb-2 text-xs text-on-surface-variant">Previsualizacion del texto SEO efectivo</p>
        <p className="line-clamp-2 text-base text-[#1a0dab]">{preview.title || "Sin titulo disponible"}</p>
        <p className="mt-1 line-clamp-3 text-sm text-[#545454]">{preview.description || "Sin descripcion disponible"}</p>
        <p className="mt-3 text-xs text-on-surface-variant">Google puede reescribir el titulo y la descripcion del snippet. El recorte de esta vista previa no modifica los textos guardados.</p>
      </div>
      <SeoServerWarnings warnings={serverWarnings} />
    </section>
  );
}
