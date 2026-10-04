"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/admin/AdminLink";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { MarketingPublicButtonLink, MarketingSettings } from "@/lib/cms/types";
import TrackedLink from "@/components/marketing/TrackedLink";
import MarketingSwitch from "./MarketingSwitch";
import SeoReview from "@/components/admin/SeoReview";
import { getActionWarnings } from "@/lib/admin/action-warnings";

type BooleanSettingKey = {
  [K in keyof MarketingSettings]: MarketingSettings[K] extends boolean ? K : never;
}[keyof MarketingSettings];

const setupSteps = [
  {
    title: "Analítica interna",
    text: "Registra vistas de página y eventos propios aunque GA4 no esté conectado.",
    href: "#tracking-core",
    icon: "monitoring",
  },
  {
    title: "Eventos",
    text: "Define qué acciones se capturan: vistas, clics y conversiones.",
    href: "/admin/marketing/events",
    icon: "toggle_on",
  },
  {
    title: "Campañas UTM",
    text: "Genera URLs medibles para redes, newsletters y colaboraciones.",
    href: "/admin/marketing/campaigns/new",
    icon: "campaign",
  },
  {
    title: "Reportes",
    text: "Crea un resumen descargable con actividad, SEO y campañas.",
    href: "/admin/marketing/reports",
    icon: "summarize",
  },
] as const;

function makeButtonLink(partial?: Partial<MarketingPublicButtonLink>): MarketingPublicButtonLink {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    label: partial?.label ?? "",
    url: partial?.url ?? "",
    eventName: partial?.eventName ?? "click_external_link",
  };
}

export default function MarketingSettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/marketing")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la configuración de marketing.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const readiness = useMemo(() => {
    if (!settings) return { completed: 0, total: 4 };
    const completed = [
      settings.analytics_enabled,
      settings.events.length > 0,
      settings.utm_builder_enabled,
      settings.robots_enabled && settings.sitemap_enabled && settings.schema_enabled,
    ].filter(Boolean).length;
    return { completed, total: 4 };
  }, [settings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");

    const publicButtonLinks = settings.public_button_links.map((button) => ({
      ...button,
      label: button.label.trim(),
      url: button.url.trim(),
    }));

    const payload: Partial<MarketingSettings> = {
      ...settings,
      public_button_links: publicButtonLinks,
      whatsapp_button_url: publicButtonLinks.find((button) => button.eventName === "click_whatsapp")?.url ?? "",
      instagram_button_url: publicButtonLinks.find((button) => button.eventName === "click_instagram")?.url ?? "",
    };

    if (payload.meta_access_token?.startsWith("••••••")) {
      delete payload.meta_access_token;
    }

    const res = await fetch("/api/admin/marketing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { warnings = [], ...updated } = await res.json();
      setSettings(updated);
      setSeoWarnings(getActionWarnings(warnings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se pudo guardar la configuración.");
    }

    setSaving(false);
  }

  function update<K extends keyof MarketingSettings>(field: K, value: MarketingSettings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  function toggle(field: BooleanSettingKey, value: boolean) {
    update(field, value as MarketingSettings[typeof field]);
  }

  function updateButton<K extends keyof MarketingPublicButtonLink>(id: string, field: K, value: MarketingPublicButtonLink[K]) {
    if (!settings) return;
    setSettings({
      ...settings,
      public_button_links: settings.public_button_links.map((button) => (button.id === id ? { ...button, [field]: value } : button)),
    });
  }

  function addButton() {
    if (!settings) return;
    setSettings({ ...settings, public_button_links: [...settings.public_button_links, makeButtonLink()] });
  }

  function removeButton(id: string) {
    if (!settings) return;
    setSettings({ ...settings, public_button_links: settings.public_button_links.filter((button) => button.id !== id) });
  }

  if (!settings) {
    return (
      <div className="grid min-h-64 place-items-center rounded-xl border border-outline-variant bg-white">
        <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant/50" aria-hidden="true">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-label-caps uppercase text-secondary">Configuración inicial</p>
            <h2 className="mt-1 text-headline-md text-on-surface">Cómo funcionará el análisis</h2>
            <p className="mt-1 max-w-3xl text-body-md text-on-surface-variant">
              La analítica interna registra vistas y eventos propios desde el sitio público. GA4, Search Console y pixels externos quedan pendientes hasta que exista una integración real verificada.
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <span className="block text-label-sm font-semibold text-on-surface-variant">Preparación</span>
            <span className="mt-1 block text-headline-sm text-on-surface">{readiness.completed}/{readiness.total} mejoras listas</span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {setupSteps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container-high text-secondary" aria-hidden="true">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </span>
                <span className="text-label-sm font-bold text-on-surface-variant">0{index + 1}</span>
              </div>
              <h3 className="mt-3 text-body-md font-bold text-on-surface">{step.title}</h3>
              <p className="mt-1 text-label-md text-on-surface-variant">{step.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="tracking-core" className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
          <h3 className="text-title-md font-bold text-on-surface">Base de análisis</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">Estos controles hacen que el sitio capture información útil desde el primer día.</p>
          <div className="mt-4 grid gap-3">
            <MarketingSwitch
              checked={settings.analytics_enabled}
              onCheckedChange={(checked) => toggle("analytics_enabled", checked)}
              label="Analítica interna del sitio"
              description="Activa page views y eventos propios en /api/marketing/track-event."
              icon="query_stats"
            />
            <MarketingSwitch
              checked={settings.utm_builder_enabled}
              onCheckedChange={(checked) => toggle("utm_builder_enabled", checked)}
              label="Constructor UTM"
              description="Permite crear campañas y URLs medibles desde el CMS."
              icon="link"
            />
            <MarketingSwitch
              checked={settings.automation_webhooks_enabled}
              onCheckedChange={(checked) => toggle("automation_webhooks_enabled", checked)}
              label="Webhooks de automatización"
              description="Prepara envío de eventos a herramientas externas cuando se configure un webhook."
              icon="webhook"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-label-sm font-medium text-on-surface">Webhook URL</label>
            <input
              type="url"
              value={settings.webhook_url}
              onChange={(event) => update("webhook_url", event.target.value)}
              placeholder="https://hooks.example.com/..."
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
          <h3 className="text-title-md font-bold text-on-surface">Conectores externos</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">Opcionales para cruzar datos con plataformas de terceros.</p>
          <div className="mt-4 space-y-3">
            <StatusRow active={false} label="GA4" value={settings.ga4_measurement_id ? `${settings.ga4_measurement_id} · integración pendiente` : "Sin Measurement ID"} />
            <StatusRow active={false} label="Search Console" value={settings.google_search_console_id ? `${settings.google_search_console_id} · integración pendiente` : "Sin propiedad"} />
            <StatusRow active={false} label="Meta Pixel" value={settings.meta_pixel_id ? `${settings.meta_pixel_id} · integración pendiente` : "Sin Pixel ID"} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
        <h3 className="text-title-md font-bold text-on-surface">Google Analytics y Search Console</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="GA4 Measurement ID">
            <input type="text" value={settings.ga4_measurement_id} onChange={(event) => update("ga4_measurement_id", event.target.value)} placeholder="G-XXXXXXXXXX" className="admin-marketing-input" />
          </Field>
          <Field label="Google Tag Manager ID">
            <input type="text" value={settings.gtm_container_id} onChange={(event) => update("gtm_container_id", event.target.value)} placeholder="GTM-XXXXXXX" className="admin-marketing-input" />
          </Field>
          <Field label="Propiedad Search Console">
            <input type="url" value={settings.google_search_console_id} onChange={(event) => update("google_search_console_id", event.target.value)} placeholder="https://casarosierceramica.com/" className="admin-marketing-input" />
          </Field>
          <Field label="Microsoft Clarity ID">
            <input type="text" value={settings.microsoft_clarity_id} onChange={(event) => update("microsoft_clarity_id", event.target.value)} placeholder="Clarity ID" className="admin-marketing-input" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
        <h3 className="text-title-md font-bold text-on-surface">Pixels y redes</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <MarketingSwitch checked={settings.meta_pixel_enabled} onCheckedChange={(checked) => toggle("meta_pixel_enabled", checked)} label="Meta Pixel" description="Registra eventos para campañas de Meta." icon="ads_click" />
          <MarketingSwitch checked={settings.meta_conversion_api_enabled} onCheckedChange={(checked) => toggle("meta_conversion_api_enabled", checked)} label="Meta Conversion API" description="Prepara envío server-side cuando agregues token y dataset." icon="cloud_sync" />
          <MarketingSwitch checked={settings.tiktok_pixel_enabled} onCheckedChange={(checked) => toggle("tiktok_pixel_enabled", checked)} label="TikTok Pixel" description="Activa medición para campañas de TikTok." icon="music_video" />
          <MarketingSwitch checked={settings.pinterest_tag_enabled} onCheckedChange={(checked) => toggle("pinterest_tag_enabled", checked)} label="Pinterest Tag" description="Activa medición para Pinterest." icon="push_pin" />
          <MarketingSwitch checked={settings.linkedin_insight_enabled} onCheckedChange={(checked) => toggle("linkedin_insight_enabled", checked)} label="LinkedIn Insight" description="Activa medición para campañas profesionales." icon="business_center" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Meta Pixel ID"><input type="text" value={settings.meta_pixel_id} onChange={(event) => update("meta_pixel_id", event.target.value)} placeholder="1234567890" className="admin-marketing-input" /></Field>
          <Field label="Meta Dataset ID"><input type="text" value={settings.meta_dataset_id} onChange={(event) => update("meta_dataset_id", event.target.value)} placeholder="Dataset ID" className="admin-marketing-input" /></Field>
          <Field label="Meta Access Token"><input type="password" value={settings.meta_access_token} onChange={(event) => update("meta_access_token", event.target.value)} placeholder="Token privado" className="admin-marketing-input" /></Field>
          <Field label="TikTok Pixel ID"><input type="text" value={settings.tiktok_pixel_id} onChange={(event) => update("tiktok_pixel_id", event.target.value)} placeholder="TikTok Pixel ID" className="admin-marketing-input" /></Field>
          <Field label="Pinterest Tag ID"><input type="text" value={settings.pinterest_tag_id} onChange={(event) => update("pinterest_tag_id", event.target.value)} placeholder="Pinterest Tag ID" className="admin-marketing-input" /></Field>
          <Field label="LinkedIn Partner ID"><input type="text" value={settings.linkedin_partner_id} onChange={(event) => update("linkedin_partner_id", event.target.value)} placeholder="Partner ID" className="admin-marketing-input" /></Field>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
        <h3 className="text-title-md font-bold text-on-surface">SEO técnico</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <MarketingSwitch checked={settings.robots_enabled} onCheckedChange={(checked) => toggle("robots_enabled", checked)} label="Robots.txt" description="Permite declarar reglas de rastreo." icon="smart_toy" />
          <MarketingSwitch checked={settings.sitemap_enabled} onCheckedChange={(checked) => toggle("sitemap_enabled", checked)} label="Sitemap" description="Mantiene URLs listas para buscadores." icon="account_tree" />
          <MarketingSwitch checked={settings.schema_enabled} onCheckedChange={(checked) => toggle("schema_enabled", checked)} label="Schema" description="Prepara datos estructurados para SEO." icon="schema" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Título global SEO"><input type="text" value={settings.seo_global_title} onChange={(event) => update("seo_global_title", event.target.value)} placeholder="Casa Rosier Cerámica | ..." className="admin-marketing-input" /></Field>
          <Field label="Imagen OG global"><input type="text" value={settings.seo_og_image} onChange={(event) => update("seo_og_image", event.target.value)} placeholder="/img/og.jpg" className="admin-marketing-input" /></Field>
          <Field label="Descripción global SEO" full>
            <textarea value={settings.seo_global_description} onChange={(event) => update("seo_global_description", event.target.value)} rows={3} placeholder="Descripción global para SEO..." className="admin-marketing-input min-h-28" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[0_12px_28px_rgba(11,28,48,0.05)]">
        <h3 className="text-title-md font-bold text-on-surface">Botones públicos medibles</h3>
        <p className="mt-1 text-body-sm text-on-surface-variant">Cada botón puede disparar un evento cuando alguien lo prueba desde el CMS o lo uses en la interfaz pública.</p>
        <div className="mt-4 space-y-3">
          {settings.public_button_links.map((button) => (
            <div key={button.id} className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 lg:grid-cols-[1fr_1.4fr_200px_auto]">
              <Field label="Etiqueta"><input type="text" value={button.label} onChange={(event) => updateButton(button.id, "label", event.target.value)} placeholder="WhatsApp" className="admin-marketing-input" /></Field>
              <Field label="URL"><input type="url" value={button.url} onChange={(event) => updateButton(button.id, "url", event.target.value)} placeholder="https://..." className="admin-marketing-input" /></Field>
              <Field label="Evento">
                <select value={button.eventName} onChange={(event) => updateButton(button.id, "eventName", event.target.value as MarketingPublicButtonLink["eventName"])} className="admin-marketing-input">
                  <option value="click_whatsapp">click_whatsapp</option>
                  <option value="click_instagram">click_instagram</option>
                  <option value="click_external_link">click_external_link</option>
                </select>
              </Field>
              <div className="flex items-end">
                <button type="button" onClick={() => removeButton(button.id)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-3 text-label-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-container">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outlined" icon="add" onClick={addButton}>Agregar botón</Button>
          {settings.public_button_links.filter((button) => button.url.trim()).map((button) => (
            <TrackedLink
              key={button.id}
              href={button.url}
              eventName={button.eventName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg bg-surface-container-high px-4 py-2 text-label-md font-semibold text-on-surface transition hover:bg-surface-container-high/80 focus:outline-none focus:ring-2 focus:ring-primary-container"
              tracking={{ source: "admin_preview", medium: "settings_form" }}
            >
              Probar {button.label || button.eventName}
            </TrackedLink>
          ))}
        </div>
      </section>

      <SeoReview title={settings.seo_global_title} description={settings.seo_global_description} serverWarnings={seoWarnings} />

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-white/95 p-3 shadow-[0_16px_36px_rgba(11,28,48,0.12)] backdrop-blur">
        <Button onClick={handleSave} disabled={saving} icon={saving ? "progress_activity" : "save"}>{saving ? "Guardando..." : "Guardar configuración"}</Button>
        {saved ? <span className="text-label-sm font-semibold text-green-700">Configuración guardada</span> : null}
        {error ? <span className="text-label-sm font-semibold text-error">{error}</span> : null}
      </div>
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-label-sm font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

function StatusRow({ active, label, value }: { active: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
      <div className="min-w-0">
        <span className="block text-label-sm font-bold text-on-surface">{label}</span>
        <span className="block truncate text-label-md text-on-surface-variant">{value}</span>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${active ? "bg-green-100 text-green-700" : "bg-surface-container-high text-on-surface-variant"}`}>
        {active ? "Listo" : "Pendiente"}
      </span>
    </div>
  );
}
