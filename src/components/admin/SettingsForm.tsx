"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/cms/settings";
import type { GlobalSettingsField, FieldOriginInfo } from "@/lib/cms/settings-overrides";
import type { Menu } from "@/lib/cms/types";
import SettingsSection from "./SettingsSection";
import MediaSelectField from "./MediaSelectField";
import ColorPickerField from "./ColorPickerField";
import { formatAdminDateTime } from "@/lib/admin/date-format";
import SeoReview from "./SeoReview";
import { getActionWarnings } from "@/lib/admin/action-warnings";

type EditableMenuItem = {
  id?: string;
  key: string;
  label: string;
  href: string;
  order: number;
  locked?: boolean;
};

type Origins = Partial<Record<GlobalSettingsField, FieldOriginInfo>>;

const DEFAULT_MENU_ITEMS: EditableMenuItem[] = [
  { key: "inicio", label: "Inicio", href: "/#hero", order: 0, locked: true },
  { key: "clases", label: "Clases", href: "/clases", order: 1 },
  { key: "workshops", label: "Workshops", href: "/workshops", order: 2 },
  { key: "experiencias", label: "Experiencias", href: "/experiencias", order: 3 },
  { key: "gift-cards", label: "Gift Cards", href: "/gift-cards", order: 4 },
  { key: "estudio", label: "Comunidad", href: "/el-estudio", order: 5 },
  { key: "shop", label: "Shop", href: "/shop", order: 6 },
];

function normalizedMenuLabel(label: string, href: string) {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if ((href === "/reservas-privadas" || href === "/experiencias") && normalized === "reservas privadas") {
    return "Experiencias";
  }
  if (
    (href === "/gift-cards" || href === "/gift-card") &&
    (normalized === "tarjeta de regalo" ||
      normalized === "tarjetas de regalo" ||
      normalized === "targetas de regalo")
  ) {
    return "Gift Cards";
  }
  return label;
}

function buildEditableMenuItems(menu?: Menu | null): EditableMenuItem[] {
  const roots = (menu?.items ?? [])
    .filter((item) => !item.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const byHref = new Map(roots.map((item) => [item.url, item]));
  const legacyBlogRoot = roots.find((item) => {
    const normalized = normalizedMenuLabel(item.label, item.url)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return item.url === "/blog" && (normalized === "blog" || normalized === "bitacora");
  });
  const defaults = DEFAULT_MENU_ITEMS.map((item) => {
    const existing = byHref.get(item.href) ?? (item.href === "/shop" ? legacyBlogRoot : undefined);
    return existing
      ? { ...item, id: existing.id, label: item.locked || item.href === "/shop" ? item.label : normalizedMenuLabel(existing.label, item.href), order: existing.sort_order }
      : item;
  });

  const defaultHrefs = new Set(defaults.map((item) => item.href));
  const extras = roots
    .filter((item) => !defaultHrefs.has(item.url) && item.id !== legacyBlogRoot?.id)
    .map((item) => ({
      id: item.id,
      key: item.id,
      label: normalizedMenuLabel(item.label, item.url),
      href: item.url,
      order: item.sort_order,
    }));

  return [...defaults, ...extras].sort((a, b) => a.order - b.order);
}

/** Aviso de sobrescritura del editor del footer, con la vía para volver al global. */
function OverrideNote({ origins, field }: { origins: Origins; field: GlobalSettingsField }) {
  const info = origins[field];
  if (!info || info.origin !== "footer-override") return null;

  return (
    <small className="settings-override-note">
      Sobrescrito por el footer: {info.detail}{info.resetHint ? ` ${info.resetHint}` : ""}
    </small>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <small className="muted">{children}</small>;
}

export default function SettingsForm({
  initial,
  initialMenu,
  origins = {},
}: {
  initial: SiteSettings;
  initialMenu?: Menu | null;
  origins?: Origins;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [menuItems, setMenuItems] = useState<EditableMenuItem[]>(() => buildEditableMenuItems(initialMenu));
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);

  function updateSection<K extends keyof SiteSettings>(section: K, value: Partial<SiteSettings[K]>) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...value },
    }));
  }

  function updateMenuItem(key: string, label: string) {
    setMenuItems((prev) =>
      prev.map((item) => (item.key === key && !item.locked ? { ...item, label } : item))
    );
  }

  async function saveMenuItems() {
    if (!initialMenu?.id) return;

    const savedItems: EditableMenuItem[] = [];
    for (const item of menuItems) {
      const payload = {
        label: item.locked ? "Inicio" : item.label,
        type: "internal",
        url: item.locked ? "/#hero" : item.href,
        linked_entity_type: "none",
        linked_entity_id: "",
        parent_id: null,
        sort_order: item.order,
        is_visible: true,
        open_in_new_tab: false,
      };

      const response = await fetch(`/api/admin/menus/${initialMenu.id}/items`, {
        method: item.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.id ? { itemId: item.id, ...payload } : payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error al guardar el menú." }));
        throw new Error(data.error || "Error al guardar el menú.");
      }
      const data = await response.json();
      savedItems.push({ ...item, id: data.item?.id ?? item.id });
    }
    setMenuItems(savedItems);
  }

  async function handleSave() {
    setIsLoading(true);
    setSuccess(null);
    setError(null);
    setErrorDetails([]);

    // 1) Ajustes globales. Si el servidor no los confirma, no se toca el menú y
    //    se conservan los valores introducidos en el formulario.
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "No se pudo guardar la configuración.");
        setErrorDetails(Array.isArray(data?.errors) ? data.errors : []);
        if (Array.isArray(data?.saved) && data.saved.length) {
          setErrorDetails((prev) => [
            ...prev,
            `Guardado antes del fallo: ${data.saved.join(", ")}. Revisa los campos señalados.`,
          ]);
        }
        return;
      }

      if (!data?.settings) {
        setError("El servidor respondió sin confirmar los ajustes guardados.");
        return;
      }

      // El formulario se sincroniza con lo que el servidor ha confirmado,
      // incluida la fecha real de actualización.
      setSettings(data.settings as SiteSettings);
      setSeoWarnings(getActionWarnings(data.warnings));
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
      return;
    } finally {
      setIsLoading(false);
    }

    // 2) Etiquetas del menú principal, en una segunda operación independiente.
    setIsLoading(true);
    try {
      await saveMenuItems();
    } catch (menuError) {
      setError(
        `Los ajustes globales se guardaron, pero las etiquetas del menú no. ${
          menuError instanceof Error ? menuError.message : "Error al guardar el menú."
        }`,
      );
      return;
    } finally {
      setIsLoading(false);
    }

    setSuccess("Configuración guardada correctamente.");
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleReset() {
    if (!window.confirm("¿Restaurar valores iniciales? Se perderán los cambios actuales.")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorDetails([]);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "No se pudieron restaurar los valores iniciales.");
        return;
      }

      const data = await response.json();
      if (data?.settings) setSettings(data.settings as SiteSettings);
      setSeoWarnings(getActionWarnings(data.warnings));
      setSuccess("Valores iniciales restaurados.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="settings-form">
      <SettingsSection title="Menú" description="Logo, textos y colores del menú principal.">
        <div className="grid-2">
          <MediaSelectField
            label="Logo del menú"
            value={settings.menu.header_logo_url}
            onChange={(url) => updateSection("menu", { header_logo_url: url })}
          />
          <div className="grid-2">
            <ColorPickerField
              label="Fondo sticky"
              value={settings.menu.scroll_menu_background_color}
              onChange={(value) => updateSection("menu", { scroll_menu_background_color: value })}
            />
            <ColorPickerField
              label="Texto e íconos sticky"
              value={settings.menu.scroll_menu_text_color}
              onChange={(value) => updateSection("menu", {
                scroll_menu_text_color: value,
                scroll_menu_icon_color: value,
              })}
            />
            <ColorPickerField
              label="Logo sticky"
              value={settings.menu.scroll_menu_logo_tint_color}
              onChange={(value) => updateSection("menu", { scroll_menu_logo_tint_color: value })}
            />
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.menu.scroll_menu_logo_tint_enabled}
                onChange={(e) => updateSection("menu", { scroll_menu_logo_tint_enabled: e.target.checked })}
              />
              <span>Aplicar color al logo sticky</span>
            </label>
          </div>
        </div>
        <Hint>
          Prioridad del logo: logo del menú → logo general del sitio → logo por defecto. Los logos
          propios de una página (hero, blog, shop) mandan sobre estos.
        </Hint>

        <div className="settings-menu-items">
          {menuItems.map((item) => (
            <label className="field" key={item.key}>
              <span>{item.href}</span>
              <input
                value={item.label}
                disabled={item.locked}
                onChange={(e) => updateMenuItem(item.key, e.target.value)}
              />
              {item.locked ? <small>Bloqueado: siempre debe existir un inicio.</small> : null}
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Información general" description="Nombre, descripción e imagen del sitio.">
        <div className="grid-2">
          <label className="field span-2">
            <span>Nombre del sitio</span>
            <input
              value={settings.site.site_name}
              onChange={(e) => updateSection("site", { site_name: e.target.value })}
            />
            <small>Se usa en el título por defecto, en Open Graph y en los datos estructurados.</small>
          </label>
          <label className="field span-2">
            <span>Descripción del sitio</span>
            <textarea
              rows={3}
              value={settings.site.site_description}
              onChange={(e) => updateSection("site", { site_description: e.target.value })}
            />
            <small>Se usa si no hay una descripción SEO por defecto.</small>
          </label>
          <label className="field">
            <span>Idioma por defecto</span>
            <input
              value={settings.site.default_language}
              onChange={(e) => updateSection("site", { default_language: e.target.value })}
            />
            <small>
              Declara el idioma del documento (html[lang]) y de los metadatos. No traduce el
              contenido del CMS: los textos siguen siendo los que escribes.
            </small>
          </label>
          <label className="field">
            <span>Zona horaria</span>
            <input
              value={settings.site.timezone}
              onChange={(e) => updateSection("site", { timezone: e.target.value })}
            />
            <small>Zona IANA (por ejemplo Europe/Madrid) para las fechas públicas del sitio.</small>
          </label>
        </div>

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <MediaSelectField
            label="Logo del sitio"
            value={settings.site.logo_url}
            onChange={(url) => updateSection("site", { logo_url: url })}
          />
          <MediaSelectField
            label="Favicon"
            value={settings.site.favicon_url}
            onChange={(url) => updateSection("site", { favicon_url: url })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Contacto"
        description="Email, teléfono y WhatsApp del sitio. El título, el texto del bloque y el diseño se editan en Componentes → Footer."
      >
        <div className="grid-2">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={settings.contact.email}
              onChange={(e) => updateSection("contact", { email: e.target.value })}
            />
            <OverrideNote origins={origins} field="contact.email" />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input
              value={settings.contact.phone}
              onChange={(e) => updateSection("contact", { phone: e.target.value })}
            />
            <small>No tiene equivalente en el footer: este valor siempre manda.</small>
          </label>
          <label className="field">
            <span>WhatsApp</span>
            <input
              value={settings.contact.whatsapp}
              onChange={(e) => updateSection("contact", { whatsapp: e.target.value })}
            />
            <OverrideNote origins={origins} field="contact.whatsapp" />
            <small>También es el CTA por defecto de los productos de la tienda.</small>
          </label>
          <label className="field">
            <span>Dirección</span>
            <input
              value={settings.contact.address}
              onChange={(e) => updateSection("contact", { address: e.target.value })}
            />
            <OverrideNote origins={origins} field="contact.address" />
          </label>
          <label className="field">
            <span>Ciudad</span>
            <input
              value={settings.contact.city}
              onChange={(e) => updateSection("contact", { city: e.target.value })}
            />
          </label>
          <label className="field">
            <span>País</span>
            <input
              value={settings.contact.country}
              onChange={(e) => updateSection("contact", { country: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span>URL del mapa</span>
            <input
              value={settings.contact.map_url}
              onChange={(e) => updateSection("contact", { map_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="contact.map_url" />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Redes sociales"
        description="Enlaces a perfiles sociales. Se usan en el footer cuando el editor del footer no define los suyos."
      >
        <div className="grid-2">
          <label className="field">
            <span>Instagram</span>
            <input
              value={settings.social.instagram_url}
              onChange={(e) => updateSection("social", { instagram_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="social.instagram_url" />
          </label>
          <label className="field">
            <span>TikTok</span>
            <input
              value={settings.social.tiktok_url}
              onChange={(e) => updateSection("social", { tiktok_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="social.tiktok_url" />
          </label>
          <label className="field">
            <span>Facebook</span>
            <input
              value={settings.social.facebook_url}
              onChange={(e) => updateSection("social", { facebook_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="social.facebook_url" />
          </label>
          <label className="field">
            <span>YouTube</span>
            <input
              value={settings.social.youtube_url}
              onChange={(e) => updateSection("social", { youtube_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="social.youtube_url" />
          </label>
          <label className="field">
            <span>Pinterest</span>
            <input
              value={settings.social.pinterest_url}
              onChange={(e) => updateSection("social", { pinterest_url: e.target.value })}
            />
            <OverrideNote origins={origins} field="social.pinterest_url" />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection title="Footer" description="Marca, texto y visibilidad del pie de página.">
        <div className="grid-2">
          <MediaSelectField
            label="Logo del footer"
            value={settings.footer.footer_logo_url}
            onChange={(url) => updateSection("footer", { footer_logo_url: url })}
          />
          <label className="field">
            <span>Texto del footer</span>
            <textarea
              rows={3}
              value={settings.footer.footer_text}
              onChange={(e) => updateSection("footer", { footer_text: e.target.value })}
            />
            <small>Texto descriptivo de la marca. No sustituye al texto legal.</small>
          </label>
          <label className="field span-2">
            <span>Texto legal</span>
            <textarea
              rows={3}
              value={settings.footer.legal_text}
              onChange={(e) => updateSection("footer", { legal_text: e.target.value })}
            />
            <small>Aviso legal del pie de página (por ejemplo el aviso de cookies).</small>
            <OverrideNote origins={origins} field="footer.legal_text" />
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={settings.footer.show_social_links}
              onChange={(e) => updateSection("footer", { show_social_links: e.target.checked })}
            />
            <span>Mostrar redes sociales</span>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={settings.footer.show_contact_info}
              onChange={(e) => updateSection("footer", { show_contact_info: e.target.checked })}
            />
            <span>Mostrar información de contacto</span>
          </label>
        </div>
        <Hint>
          Al ocultar la información de contacto se retiran teléfono, dirección y mapa del pie. El
          formulario de contacto y los enlaces legales se mantienen.
        </Hint>
      </SettingsSection>

      <SettingsSection
        title="SEO global"
        description="Valores por defecto. El SEO propio de cada página prevalece sobre estos ajustes."
      >
        <div className="grid-2">
          <label className="field span-2">
            <span>SEO title por defecto</span>
            <input
              value={settings.seo.default_seo_title}
              onChange={(e) => updateSection("seo", { default_seo_title: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span>SEO description por defecto</span>
            <textarea
              rows={3}
              value={settings.seo.default_seo_description}
              onChange={(e) => updateSection("seo", { default_seo_description: e.target.value })}
            />
          </label>
          <MediaSelectField
            label="Imagen Open Graph por defecto"
            value={settings.seo.default_og_image_url}
            onChange={(url) => updateSection("seo", { default_og_image_url: url })}
          />
          <div className="field">
            <span>Directivas robots</span>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.seo.robots_index}
                onChange={(e) => updateSection("seo", { robots_index: e.target.checked })}
              />
              <span>Permitir indexación (noindex cuando se desmarca)</span>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.seo.robots_follow}
                onChange={(e) => updateSection("seo", { robots_follow: e.target.checked })}
              />
              <span>Permitir follow (nofollow cuando se desmarca)</span>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.seo.sitemap_enabled}
                onChange={(e) => updateSection("seo", { sitemap_enabled: e.target.checked })}
              />
              <span>Publicar sitemap.xml</span>
            </label>
            <small>
              Se aplican por separado. Desmarcar la indexación también bloquea el rastreo en
              robots.txt; «follow» no tiene equivalente en robots.txt.
            </small>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Sistema" description="Opciones avanzadas del CMS.">
        <div className="grid-2">
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={settings.system.maintenance_mode}
              onChange={(e) => updateSection("system", { maintenance_mode: e.target.checked })}
            />
            <span>Modo mantenimiento</span>
            <small>
              Devuelve 503 en las páginas públicas. /admin, /auth y /api siguen accesibles para
              que puedas entrar y desactivarlo, y las APIs e integraciones no se interrumpen.
            </small>
          </label>
          <div className="field">
            <span>Última actualización</span>
            <p className="muted" style={{ padding: "0.95rem 0" }}>
              {settings.system.updated_at
                ? formatAdminDateTime(settings.system.updated_at)
                : "Nunca"}
            </p>
            <small>Fecha confirmada por el servidor en el último guardado.</small>
          </div>
        </div>
      </SettingsSection>

      {success ? <p className="form-success">{success}</p> : null}
      <SeoReview title={settings.seo.default_seo_title} description={settings.seo.default_seo_description} fallbackTitle={settings.site.site_name} fallbackDescription={settings.site.site_description} serverWarnings={seoWarnings} />
      {error ? <p className="form-error">{error}</p> : null}
      {errorDetails.length ? (
        <ul className="settings-form-errors">
          {errorDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}

      <div className="form-actions" style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" className="secondary-btn" onClick={handleReset} disabled={isLoading}>
          Restaurar valores iniciales
        </button>
        <button type="button" className="primary-btn" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
