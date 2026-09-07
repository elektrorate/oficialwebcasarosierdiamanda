"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ColorPickerField from "./ColorPickerField";
import MediaLibraryModal from "./MediaLibraryModal";
import type { Header, HeaderOverlayImage } from "@/lib/cms/types";
import { HEADER_TYPES } from "@/lib/cms/types";
import HeaderPreview from "./HeaderPreview";

const typeLabels: Record<string, string> = {
  home: "Header principal",
  internal: "Encabezado interior",
  landing: "Encabezado de Landing Page",
  offering: "Encabezado de Offering",
  shop: "Encabezado de Shop",
  blog: "Encabezado de Blog",
  studio: "Encabezado de Studio",
  custom: "Encabezado personalizado",
};

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <label className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">
      {children}{required ? " *" : ""}
    </label>
  );
}

function TextField({
  label,
  required,
  error,
  help,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string; help?: string }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...props}
        className={`block w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary-container ${
          error ? "border-error" : "border-outline-variant"
        } ${props.className ?? ""}`}
      />
      {help && !error ? <p className="text-label-md text-on-surface-variant/70">{help}</p> : null}
      {error ? <p className="text-label-md text-error">{error}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  error,
  help,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; help?: string }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        {...props}
        className={`block min-h-[90px] w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary-container ${
          error ? "border-error" : "border-outline-variant"
        } ${props.className ?? ""}`}
      />
      {help && !error ? <p className="text-label-md text-on-surface-variant/70">{help}</p> : null}
      {error ? <p className="text-label-md text-error">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  required,
  error,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean; error?: string; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        {...props}
        className={`block w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container ${
          error ? "border-error" : "border-outline-variant"
        }`}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error ? <p className="text-label-md text-error">{error}</p> : null}
    </div>
  );
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-5 text-body-md text-on-surface">
      {children}
    </div>
  );
}

function createOverlayId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const defaultOverlayImage: HeaderOverlayImage = {
  id: "", image: "", alt: "", width: "320px", height: "auto",
  positionX: "40%", positionY: "55%",
  desktopPositionX: "", desktopPositionY: "",
  mobilePositionX: "", mobilePositionY: "",
  zIndex: 1, opacity: 1, rotation: "0deg",
  visibleDesktop: true, visibleMobile: true, animation: "none", order: 0,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function HeaderForm({
  mode,
  header,
  menus = [],
}: {
  mode: "create" | "edit";
  header?: Header;
  menus?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const hasMenus = menus.length > 0;
  const [form, setForm] = useState({
    name: header?.name ?? "",
    slug: header?.slug ?? "",
    type: header?.type ?? "internal" as string,
    status: header?.status ?? "draft" as string,
    visual_variant: header?.visual_variant ?? "minimal" as string,
    title: header?.title ?? "",
    subtitle: header?.subtitle ?? "",
    eyebrow: header?.eyebrow ?? "",
    desktop_image_url: header?.desktop_image_url ?? "",
    mobile_image_url: header?.mobile_image_url ?? "",
    overlay_enabled: header?.overlay_enabled ?? false,
    overlay_color: header?.overlay_color ?? "#000000",
    overlay_opacity: header?.overlay_opacity ?? 0.4,
    gradient_enabled: header?.gradient_enabled ?? false,
    gradient_css: header?.gradient_css ?? "",
    desktop_height: header?.desktop_height ?? "80vh",
    mobile_height: header?.mobile_height ?? "60vh",
    content_position: header?.content_position ?? "center",
    content_alignment: header?.content_alignment ?? "center",
    menu_color: header?.menu_color ?? "light",
    logo_variant: header?.logo_variant ?? "default",
    cta_label: header?.cta_label ?? "",
    cta_url: header?.cta_url ?? "",
    logo: header?.logo ?? "",
    logoAlt: header?.logoAlt ?? "",
    logoWidth: header?.logoWidth ?? "120px",
    logoHeight: header?.logoHeight ?? "auto",
    logoPositionX: header?.logoPositionX ?? "8%",
    logoPositionY: header?.logoPositionY ?? "40px",
    logoDesktopPositionX: header?.logoDesktopPositionX ?? "",
    logoDesktopPositionY: header?.logoDesktopPositionY ?? "",
    logoMobilePositionX: header?.logoMobilePositionX ?? "",
    logoMobilePositionY: header?.logoMobilePositionY ?? "",
    logoZIndex: header?.logoZIndex ?? 10,
    logoVisibleDesktop: header?.logoVisibleDesktop ?? true,
    logoVisibleMobile: header?.logoVisibleMobile ?? true,
    menuId: header?.menuId ?? "",
    showMenu: header?.showMenu ?? hasMenus,
    menuPositionX: header?.menuPositionX ?? "50%",
    menuPositionY: header?.menuPositionY ?? "40px",
    menuDesktopPositionX: header?.menuDesktopPositionX ?? "",
    menuDesktopPositionY: header?.menuDesktopPositionY ?? "",
    menuMobilePositionX: header?.menuMobilePositionX ?? "",
    menuMobilePositionY: header?.menuMobilePositionY ?? "",
    menuAlign: header?.menuAlign ?? "center",
    menuZIndex: header?.menuZIndex ?? 20,
    menuVisibleDesktop: header?.menuVisibleDesktop ?? true,
    menuVisibleMobile: header?.menuVisibleMobile ?? true,
    menuTextColor: header?.menuTextColor ?? "#ffffff",
    menuHoverColor: header?.menuHoverColor ?? "#cccccc",
    showMenuSeparators: header?.showMenuSeparators ?? false,
    overlayImages: header?.overlayImages ?? [],
    assignedPages: header?.assignedPages ?? [],
    isDefault: header?.isDefault ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function updateOverlayImage(index: number, next: Partial<HeaderOverlayImage>) {
    const overlayImages = form.overlayImages.map((item, i) => (i === index ? { ...item, ...next } : item));
    update("overlayImages", overlayImages);
  }

  function addOverlayImage() {
    update("overlayImages", [...form.overlayImages, { ...defaultOverlayImage, id: createOverlayId(), order: form.overlayImages.length }]);
  }

  function duplicateOverlayImage(index: number) {
    const current = form.overlayImages[index];
    if (!current) return;
    const overlayImages = [
      ...form.overlayImages.slice(0, index + 1),
      { ...current, id: createOverlayId(), order: index + 1 },
      ...form.overlayImages.slice(index + 1),
    ].map((item, order) => ({ ...item, order }));
    update("overlayImages", overlayImages);
  }

  function removeOverlayImage(index: number) {
    if (!window.confirm("¿Eliminar esta imagen superpuesta?")) return;
    update("overlayImages", form.overlayImages.filter((_, i) => i !== index).map((item, order) => ({ ...item, order })));
  }

  function toggleAssignedPage(page: string) {
    const current = form.assignedPages;
    update("assignedPages", current.includes(page) ? current.filter((p) => p !== page) : [...current, page]);
  }

  function handleSelectImage(url: string) {
    if (!pickerTarget) return;
    if (pickerTarget === "logo") update("logo", url);
    else if (pickerTarget === "desktop_image") update("desktop_image_url", url);
    else if (pickerTarget === "mobile_image") update("mobile_image_url", url);
    else if (pickerTarget.startsWith("overlay-")) {
      const index = parseInt(pickerTarget.replace("overlay-", ""), 10);
      if (!isNaN(index)) updateOverlayImage(index, { image: url });
    }
    setPickerTarget(null);
  }

  const assignedPageOptions = [
    { value: "home", label: "Home" },
    { value: "el-estudio", label: "El Estudio" },
    { value: "clases", label: "Clases" },
    { value: "clase-detalle", label: "Detalle de Clase" },
    { value: "workshops", label: "Workshops" },
    { value: "workshop-detalle", label: "Detalle de Workshop" },
    { value: "experiencias", label: "Experiencias" },
    { value: "gift-card", label: "Gift Card" },
    { value: "shop", label: "Shop" },
    { value: "bitacora", label: "Bitácora" },
    { value: "landing-pages", label: "Landing Pages" },
    { value: "legal", label: "Páginas legales" },
    { value: "custom", label: "Página personalizada" },
  ];

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!form.slug.trim()) nextErrors.slug = "El slug es obligatorio.";
    if (!form.type) nextErrors.type = "El tipo es obligatorio.";
    if (!form.status) nextErrors.status = "El estado es obligatorio.";
    if (form.showMenu && hasMenus && !form.menuId) nextErrors.menuId = "Selecciona un menú o desactiva 'Mostrar menú'.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    if (!validate()) return;

    setIsSaving(true);
    const payload = {
      ...form,
      menuId: form.menuId || null,
      overlayImages: form.overlayImages.filter((item) => item.image).map((item, order) => ({ ...item, order })),
    };

    const response = await fetch(mode === "create" ? "/api/admin/headers" : `/api/admin/headers/${header?.id}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSaving(false);
    if (!response.ok) {
      let message = "No se pudo guardar el encabezado.";
      try {
        const result = await response.json();
        if (typeof result?.error === "string" && result.error.trim()) {
          message = result.error;
        }
      } catch {
        // Keep default message when response body is not JSON.
      }
      setToast(message);
      return;
    }

    setIsDirty(false);
    setToast("Encabezado guardado correctamente.");
    router.push("/admin/components/headers");
    router.refresh();
  }

  async function handleDelete() {
    if (mode === "create") {
      if (!window.confirm("¿Descartar este encabezado? Los cambios no se guardarán.")) return;
      router.push("/admin/components/headers");
      return;
    }
    if (!window.confirm("¿Mover este encabezado a la papelera?")) return;
    const response = await fetch(`/api/admin/headers/${header?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trash" }),
    });
    if (response.ok) router.push("/admin/components/headers");
    else setToast("No se pudo eliminar el encabezado.");
  }

  function handleCancel() {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Salir igualmente?")) return;
    router.push("/admin/components/headers");
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">{mode === "create" ? "Crear encabezado" : "Editar encabezado"}</h1>
          <p className="text-body-md text-on-surface-variant">Configura los elementos visuales y funcionales del header.</p>
        </div>
      </div>

      {toast ? (
        <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface">
          {toast}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {/* ── Información General ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Información General</h2>
            <TextField
              label="Nombre del encabezado"
              required
              value={form.name}
              error={errors.name}
              placeholder="Header principal Home"
              onChange={(event) => { update("name", event.target.value); if (!form.slug) update("slug", slugify(event.target.value)); }}
            />
            <TextField
              label="Slug / Identificador"
              required
              value={form.slug}
              error={errors.slug}
              help="Si el slug ya existe, se agregará un número al final"
              onChange={(event) => update("slug", slugify(event.target.value))}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField
                label="Tipo de encabezado"
                required
                value={form.type}
                error={errors.type}
                options={HEADER_TYPES.map((t) => ({ value: t, label: typeLabels[t] || t }))}
                onChange={(event) => update("type", event.target.value)}
              />
              <SelectField
                label="Estado"
                required
                value={form.status}
                error={errors.status}
                options={[
                  { value: "draft", label: "Borrador" },
                  { value: "published", label: "Publicado" },
                  { value: "archived", label: "Archivado" },
                ]}
                onChange={(event) => update("status", event.target.value)}
              />
              <SelectField
                label="Variante visual"
                value={form.visual_variant}
                options={[
                  { value: "minimal", label: "Minimal" },
                  { value: "editorial", label: "Editorial" },
                  { value: "immersive", label: "Inmersivo" },
                  { value: "split", label: "Split" },
                  { value: "clean", label: "Clean" },
                ]}
                onChange={(event) => update("visual_variant", event.target.value)}
              />
            </div>
          </Card>

          {/* ── Textos del Header ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Textos del Header</h2>
            <TextField label="Eyebrow" value={form.eyebrow} onChange={(event) => update("eyebrow", event.target.value)} />
            <TextField label="Título" value={form.title} onChange={(event) => update("title", event.target.value)} />
            <TextAreaField label="Subtítulo" value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} />
          </Card>

          {/* ── Configuración Visual ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Configuración Visual</h2>
            <div className="space-y-2">
              <FieldLabel>Imagen principal</FieldLabel>
              {form.desktop_image_url ? (
                <div className="relative mb-2 aspect-video overflow-hidden rounded-xl">
                  <Image src={form.desktop_image_url} alt="Header desktop" fill sizes="600px" className="object-cover" unoptimized />
                </div>
              ) : null}
              <Button type="button" variant="outlined" size="sm" onClick={() => setPickerTarget("desktop_image")}>
                {form.desktop_image_url ? "Reemplazar imagen" : "Seleccionar imagen"}
              </Button>
              <p className="text-label-md text-on-surface-variant/70">Proporción recomendada: 16:9 o ancho completo</p>
            </div>
            <div className="space-y-2">
              <FieldLabel>Imagen principal móvil</FieldLabel>
              {form.mobile_image_url ? (
                <div className="relative mb-2 aspect-[9/16] w-48 overflow-hidden rounded-xl">
                  <Image src={form.mobile_image_url} alt="Header mobile" fill sizes="200px" className="object-cover" unoptimized />
                </div>
              ) : null}
              <Button type="button" variant="outlined" size="sm" onClick={() => setPickerTarget("mobile_image")}>
                {form.mobile_image_url ? "Reemplazar imagen" : "Seleccionar imagen"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label="Altura desktop" value={form.desktop_height} placeholder="720px" onChange={(event) => update("desktop_height", event.target.value)} />
              <TextField label="Altura móvil" value={form.mobile_height} placeholder="520px" onChange={(event) => update("mobile_height", event.target.value)} />
            </div>
          </Card>

          {/* ── Overlay y Gradiente ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Overlay y Gradiente</h2>
            <label className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <input type="checkbox" checked={form.overlay_enabled} onChange={(event) => update("overlay_enabled", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
              <span className="text-body-md font-semibold text-on-surface">Activar overlay</span>
            </label>
            {form.overlay_enabled ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ColorPickerField label="Color overlay" value={form.overlay_color} onChange={(value) => update("overlay_color", value)} />
                <TextField label="Opacidad" type="number" step="0.05" min="0" max="1" value={form.overlay_opacity} onChange={(event) => update("overlay_opacity", Number(event.target.value))} />
              </div>
            ) : null}
            <label className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <input type="checkbox" checked={form.gradient_enabled} onChange={(event) => update("gradient_enabled", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
              <span className="text-body-md font-semibold text-on-surface">Activar gradiente</span>
            </label>
            {form.gradient_enabled ? (
              <TextField label="CSS del gradiente" value={form.gradient_css} placeholder="linear-gradient(...)" onChange={(event) => update("gradient_css", event.target.value)} />
            ) : null}
          </Card>

          {/* ── Logotipo ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Logotipo</h2>
            <div className="space-y-2">
              <FieldLabel>Logotipo</FieldLabel>
              {form.logo ? (
                <div className="relative mb-2 h-24 w-48 overflow-hidden rounded-xl">
                  <Image src={form.logo} alt={form.logoAlt || "Logotipo"} fill sizes="200px" className="object-contain" unoptimized />
                </div>
              ) : (
                <button type="button" onClick={() => setPickerTarget("logo")} className="flex h-24 w-48 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary">
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                </button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outlined" size="sm" onClick={() => setPickerTarget("logo")}>
                  {form.logo ? "Reemplazar" : "Cargar logotipo"}
                </Button>
                {form.logo ? <Button type="button" variant="ghost" size="sm" onClick={() => update("logo", "")}>Eliminar</Button> : null}
              </div>
            </div>
            <TextField label="Texto alternativo del logotipo" value={form.logoAlt} onChange={(event) => update("logoAlt", event.target.value)} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label="Ancho" value={form.logoWidth} placeholder="120px" onChange={(event) => update("logoWidth", event.target.value)} />
              <TextField label="Alto" value={form.logoHeight} placeholder="auto" onChange={(event) => update("logoHeight", event.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label="Posición horizontal (X)" value={form.logoPositionX} placeholder="8%" onChange={(event) => update("logoPositionX", event.target.value)} />
              <TextField label="Posición vertical (Y)" value={form.logoPositionY} placeholder="40px" onChange={(event) => update("logoPositionY", event.target.value)} />
            </div>
            <TextField label="Orden de capa (z-index)" type="number" value={form.logoZIndex} onChange={(event) => update("logoZIndex", Number(event.target.value))} />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-body-md text-on-surface">
                <input type="checkbox" checked={form.logoVisibleDesktop} onChange={(event) => update("logoVisibleDesktop", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
                Visible en desktop
              </label>
              <label className="flex items-center gap-2 text-body-md text-on-surface">
                <input type="checkbox" checked={form.logoVisibleMobile} onChange={(event) => update("logoVisibleMobile", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
                Visible en móvil
              </label>
            </div>
          </Card>

          {/* ── Menú del Header ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm text-on-surface">Menú del Header</h2>
              <label className="flex items-center gap-2 text-label-md font-semibold text-on-surface-variant">
                Mostrar menú
                <div
                  role="checkbox"
                  tabIndex={0}
                  aria-checked={form.showMenu}
                  onClick={() => update("showMenu", !form.showMenu)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); update("showMenu", !form.showMenu); } }}
                  className={`relative h-7 w-12 cursor-pointer rounded-full transition-colors ${form.showMenu ? "bg-secondary" : "bg-outline-variant"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.showMenu ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </label>
            </div>
            {form.showMenu ? (
              <>
                {!hasMenus ? (
                  <InfoBlock>
                    No hay menús creados todavía. Puedes guardar este encabezado sin menú y asociarlo más tarde.
                  </InfoBlock>
                ) : null}
                <SelectField
                  label="Menú asociado"
                  required={hasMenus}
                  value={form.menuId}
                  error={errors.menuId}
                  options={[{ value: "", label: "Seleccionar menú..." }, ...menus.map((m) => ({ value: m.id, label: m.name }))]}
                  onChange={(event) => update("menuId", event.target.value)}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField label="Posición horizontal (X)" value={form.menuPositionX} placeholder="50%" onChange={(event) => update("menuPositionX", event.target.value)} />
                  <TextField label="Posición vertical (Y)" value={form.menuPositionY} placeholder="40px" onChange={(event) => update("menuPositionY", event.target.value)} />
                </div>
                <SelectField
                  label="Alineación del menú"
                  value={form.menuAlign}
                  options={[
                    { value: "left", label: "Izquierda" },
                    { value: "center", label: "Centro" },
                    { value: "right", label: "Derecha" },
                  ]}
                  onChange={(event) => update("menuAlign", event.target.value)}
                />
                <TextField label="Orden de capa (z-index)" type="number" value={form.menuZIndex} onChange={(event) => update("menuZIndex", Number(event.target.value))} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ColorPickerField label="Color del texto" value={form.menuTextColor} onChange={(value) => update("menuTextColor", value)} />
                  <ColorPickerField label="Color hover" value={form.menuHoverColor} onChange={(value) => update("menuHoverColor", value)} />
                </div>
                <label className="flex items-center gap-2 text-body-md text-on-surface">
                  <input type="checkbox" checked={form.showMenuSeparators} onChange={(event) => update("showMenuSeparators", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
                  Mostrar separadores entre elementos
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-body-md text-on-surface">
                    <input type="checkbox" checked={form.menuVisibleDesktop} onChange={(event) => update("menuVisibleDesktop", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
                    Mostrar en desktop
                  </label>
                  <label className="flex items-center gap-2 text-body-md text-on-surface">
                    <input type="checkbox" checked={form.menuVisibleMobile} onChange={(event) => update("menuVisibleMobile", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
                    Mostrar en móvil
                  </label>
                </div>
              </>
            ) : null}
          </Card>

          {/* ── Fotos Superposición ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-headline-sm text-on-surface">Fotos Superposición</h2>
              <Button type="button" variant="outlined" size="sm" onClick={addOverlayImage}>+ Añadir imagen superpuesta</Button>
            </div>
            {form.overlayImages.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary-container bg-secondary-container/10 px-6 py-12 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-3xl">layers</span>
                </span>
                <h3 className="text-title-md font-bold text-on-surface">No hay imágenes superpuestas.</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">Agrega PNGs o imágenes para superponer en el header.</p>
                <Button type="button" variant="outlined" className="mt-4 border-secondary-container text-secondary" onClick={addOverlayImage}>
                  + Añadir imagen superpuesta
                </Button>
              </div>
            ) : (
              form.overlayImages.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">Imagen / PNG {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => duplicateOverlayImage(index)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary">
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        Duplicar
                      </button>
                      <button type="button" onClick={() => removeOverlayImage(index)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-md font-semibold text-error transition-colors hover:bg-error-container">
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FieldLabel>Imagen superpuesta</FieldLabel>
                      {item.image ? (
                        <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl">
                          <Image src={item.image} alt={item.alt || `Overlay ${index + 1}`} fill sizes="400px" className="object-contain" unoptimized />
                        </div>
                      ) : null}
                      <Button type="button" variant="outlined" size="sm" onClick={() => setPickerTarget(`overlay-${index}`)}>
                        {item.image ? "Reemplazar imagen" : "Seleccionar imagen"}
                      </Button>
                    </div>
                    <TextField label="Texto alternativo" value={item.alt} onChange={(event) => updateOverlayImage(index, { alt: event.target.value })} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField label="Ancho" value={item.width} placeholder="320px" onChange={(event) => updateOverlayImage(index, { width: event.target.value })} />
                      <TextField label="Alto" value={item.height} placeholder="auto" onChange={(event) => updateOverlayImage(index, { height: event.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField label="Posición X" value={item.positionX} placeholder="40%" onChange={(event) => updateOverlayImage(index, { positionX: event.target.value })} />
                      <TextField label="Posición Y" value={item.positionY} placeholder="55%" onChange={(event) => updateOverlayImage(index, { positionY: event.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <TextField label="Z-index" type="number" value={item.zIndex} onChange={(event) => updateOverlayImage(index, { zIndex: Number(event.target.value) })} />
                      <TextField label="Opacidad" type="number" step="0.1" min="0" max="1" value={item.opacity} onChange={(event) => updateOverlayImage(index, { opacity: Number(event.target.value) })} />
                      <TextField label="Rotación" value={item.rotation} placeholder="0deg" onChange={(event) => updateOverlayImage(index, { rotation: event.target.value })} />
                    </div>
                    <SelectField
                      label="Animación"
                      value={item.animation}
                      options={[
                        { value: "none", label: "Ninguna" },
                        { value: "fade-in", label: "Fade in" },
                        { value: "slide-up", label: "Slide up" },
                        { value: "slide-left", label: "Slide left" },
                        { value: "parallax", label: "Parallax suave" },
                      ]}
                      onChange={(event) => updateOverlayImage(index, { animation: event.target.value })}
                    />
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-body-md text-on-surface">
                        <input type="checkbox" checked={item.visibleDesktop} onChange={(event) => updateOverlayImage(index, { visibleDesktop: event.target.checked })} className="h-4 w-4 rounded border-outline-variant text-primary" />
                        Visible en desktop
                      </label>
                      <label className="flex items-center gap-2 text-body-md text-on-surface">
                        <input type="checkbox" checked={item.visibleMobile} onChange={(event) => updateOverlayImage(index, { visibleMobile: event.target.checked })} className="h-4 w-4 rounded border-outline-variant text-primary" />
                        Visible en móvil
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* ── Asignación del Header ── */}
          <Card padding="lg" className="space-y-5 rounded-2xl">
            <h2 className="text-headline-sm text-on-surface">Asignación del Header</h2>
            <p className="text-body-md text-on-surface-variant">Define en qué páginas se usa este encabezado.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {assignedPageOptions.map((page) => (
                <label key={page.value} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-body-md text-on-surface hover:bg-surface-container-low">
                  <input
                    type="checkbox"
                    checked={form.assignedPages.includes(page.value)}
                    onChange={() => toggleAssignedPage(page.value)}
                    className="h-4 w-4 rounded border-outline-variant text-primary"
                  />
                  {page.label}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <input type="checkbox" checked={form.isDefault} onChange={(event) => update("isDefault", event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
              <span>
                <span className="block text-body-md font-semibold text-on-surface">Usar como header por defecto</span>
                <span className="block text-label-md text-on-surface-variant/70">Si una página no tiene un header específico, se usará este.</span>
              </span>
            </label>
          </Card>
        </div>

        {/* ── Sidebar: Preview + Acciones ── */}
        <aside className="space-y-6">
          <Card padding="md" className="space-y-3 rounded-2xl">
            <h2 className="text-title-md font-bold text-on-surface">Vista previa del header</h2>
            <HeaderPreview header={form as unknown as Header} />
          </Card>

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Guardando..." : mode === "create" ? "Crear encabezado" : "Guardar cambios"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={handleCancel}>Cancelar</Button>
            <button type="button" onClick={handleDelete} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-error px-6 text-label-md font-semibold text-on-error transition-colors hover:bg-error/90">
              {mode === "create" ? "Descartar" : "Eliminar encabezado"}
            </button>
          </div>
        </aside>
      </form>

      <MediaLibraryModal
        open={pickerTarget !== null}
        onSelect={handleSelectImage}
        onClose={() => setPickerTarget(null)}
      />
    </>
  );
}
