import { randomUUID } from "node:crypto";
import { SECTION_BASES, SECTION_TYPES, menuSlug, offeringBase, validSectionPath } from "./menu-routing.ts";
import type { SectionRoute } from "./menu-routing.ts";

type Row = Record<string, unknown>;
export type PublicationItem = {
  id?: string; label: string; url: string; linked_entity_type: string; linked_entity_id: string;
  is_visible: boolean; open_in_new_tab: boolean; url_auto?: boolean; children?: PublicationItem[];
};
export type PublicationSnapshot = {
  revision: string; menu: Row; items: Row[]; offerings: Row[]; routes: SectionRoute[];
  redirects: Row[];
  destinations?: string[];
};
const RESERVED = new Set(["admin", "api", "auth", "_next", "blog", "landing", "home", "carrito", "politica-privacidad", "robots", "sitemap", "favicon", "icon", "manifest", "opengraph-image", "twitter-image", "robots-txt", "sitemap-xml", "reservas-privadas", "gift-card"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function rootKey(item: PublicationItem) { return item.linked_entity_id.replace(/^menu-root:/, ""); }

export function planMenuPublication(snapshot: PublicationSnapshot, tree: PublicationItem[], confirmMoves = false) {
  assert(Array.isArray(tree) && tree.length > 0 && tree.length <= 100, "Menú no válido.");
  const routes = snapshot.routes.map((route) => ({ ...route, aliases: [...route.aliases] }));
  const items: Row[] = [];
  const changes: Row[] = [];
  const redirects: Array<{ source_url: string; target_url: string }> = [];
  const known = new Map(snapshot.items.map((item) => [item.id, item]));
  const seenIds = new Set<string>();
  const seenRoots = new Set<string>();
  const seenOfferings = new Set<string>();
  const desiredSlugs = new Map(snapshot.offerings.map((offering) => [String(offering.slug), String(offering.id)]));
  const messages: string[] = [];
  const validateItem = (input: PublicationItem, parent: string | null, order: number) => {
    assert(input && typeof input.label === "string" && input.label.trim().length > 0 && input.label.length <= 180, "El nombre visible es obligatorio (máximo 180 caracteres).");
    assert(typeof input.url === "string", "URL no válida.");
    assert(typeof input.is_visible === "boolean" && typeof input.open_in_new_tab === "boolean", "Opciones de menú no válidas.");
    const id = input.id || randomUUID();
    assert(UUID.test(id) && !seenIds.has(id), "Identificador de menú repetido o no válido.");
    if (input.id) assert(known.has(input.id), "El elemento ya no pertenece a este menú. Recarga el editor.");
    seenIds.add(id);
    const row: Row = {
      id, label: input.label.trim(), url: input.url.trim(), type: "internal", parent_id: parent,
      sort_order: order, linked_entity_type: input.linked_entity_type, linked_entity_id: input.linked_entity_id,
      is_visible: input.is_visible, open_in_new_tab: input.open_in_new_tab, url_auto: input.url_auto !== false,
    };
    items.push(row);
    return row;
  };
  tree.forEach((input, index) => {
    const root = validateItem(input, null, index);
    const key = rootKey(input);
    assert(!seenRoots.has(key), "Sección repetida."); seenRoots.add(key);
    const previous = input.id ? known.get(input.id) : undefined;
    if (key === "inicio") {
      Object.assign(root, { url: "/#hero", is_visible: true, open_in_new_tab: false });
    } else if (SECTION_BASES[key]) {
      let route = routes.find((entry) => entry.key === key);
      if (!route) { route = { key, path: SECTION_BASES[key], aliases: [] }; routes.push(route); }
      const changedLabel = previous && previous.label !== root.label;
      const nextPath = input.url_auto !== false && changedLabel ? `/${menuSlug(String(root.label))}` : String(root.url);
      assert(validSectionPath(nextPath) && !RESERVED.has(nextPath.slice(1)), `${input.label}: la sección necesita una ruta como /cursos, sin parámetros.`);
      for (const [other, base] of Object.entries(SECTION_BASES)) assert(other === key || base !== nextPath, `La ruta ${nextPath} pertenece a otra sección.`);
      if (route.path !== nextPath) {
        messages.push(`${input.label}: ${route.path} → ${nextPath}`);
        route.aliases = [...new Set([...route.aliases, route.path])].filter((path) => path !== nextPath);
        route.path = nextPath;
      }
      root.url = nextPath;
    } else {
      validateDestination(String(root.url), snapshot);
    }
    assert(Array.isArray(input.children ?? []), "Subelementos no válidos.");
    (input.children ?? []).forEach((child, childIndex) => {
      assert(!child.children?.length, "El menú admite dos niveles.");
      const row = validateItem(child, String(root.id), childIndex);
      if (child.linked_entity_type !== "offering") { validateDestination(String(row.url), snapshot); return; }
      assert(SECTION_TYPES[key], "Las actividades solo pueden moverse a Cursos, Workshops, Experiencias o Gift Cards.");
      assert(!seenOfferings.has(child.linked_entity_id), "La misma página no puede tener dos secciones principales.");
      seenOfferings.add(child.linked_entity_id);
      const offering = snapshot.offerings.find((entry) => entry.id === child.linked_entity_id);
      assert(offering && !offering.deleted_at, "La página vinculada ya no existe.");
      const previousChild = child.id ? known.get(child.id) : snapshot.items.find((entry) => entry.linked_entity_id === child.linked_entity_id);
      const details = offering.details as { class?: { menuTitle?: string }; menuTitle?: string } | undefined;
      const oldLabel = previousChild?.label || details?.class?.menuTitle || details?.menuTitle || offering.title;
      const moved = offering.type !== SECTION_TYPES[key];
      assert(!moved || confirmMoves, "Confirma el traslado de sección antes de publicar. Los datos se conservarán, pero su presentación puede cambiar.");
      const slug = child.url_auto !== false && (oldLabel !== row.label || child.url.split("/").pop() !== offering.slug) ? menuSlug(String(row.label)) : String(offering.slug);
      assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 160, "El nombre no genera una URL válida.");
      const owner = desiredSlugs.get(slug);
      assert(!owner || owner === offering.id, `La URL «${slug}» ya está ocupada. Cambia el nombre.`);
      desiredSlugs.set(slug, String(offering.id));
      const before = `${offeringBase(String(offering.type))}/${offering.slug}`;
      const after = `${SECTION_BASES[key]}/${slug}`;
      row.url = after;
      if (before !== after) {
        messages.push(`${child.label}: ${before} → ${after}`);
        redirects.push({ source_url: before, target_url: after });
      }
      if (moved || slug !== offering.slug || oldLabel !== row.label) changes.push({ id: offering.id, type: SECTION_TYPES[key], slug, menu_title: row.label });
    });
  });
  assert(seenRoots.has("inicio"), "El menú debe conservar Inicio.");
  const paths = new Map<string, string>();
  for (const route of routes) for (const path of [route.path, ...route.aliases]) {
    assert(!paths.has(path) || paths.get(path) === route.key, `La ruta ${path} ya pertenece a otra sección o a su historial.`);
    paths.set(path, route.key);
  }
  const redirectMap = new Map(snapshot.redirects.filter((r) => r.status === "active" && !r.deleted_at).map((r) => [String(r.source_url), String(r.target_url)]));
  for (const redirect of redirects) {
    assert(!redirectMap.has(redirect.target_url), `La nueva ruta ${redirect.target_url} ya está reservada por una redirección.`);
    redirectMap.set(redirect.source_url, redirect.target_url);
  }
  for (const route of routes) assert(!redirectMap.has(route.path), `La ruta ${route.path} ya tiene una redirección.`);
  // Flatten prior redirects pointing at moved pages, preserving unrelated redirects.
  const finalRedirects = new Map(redirects.map((r) => [r.source_url, r.target_url]));
  for (const source of redirectMap.keys()) {
    let target = redirectMap.get(source)!;
    const visited = new Set([source]);
    while (redirectMap.has(target)) {
      assert(!visited.has(target), "La publicación produciría un bucle de redirecciones.");
      visited.add(target); target = redirectMap.get(target)!;
    }
    assert(target !== source, "La publicación produciría un bucle de redirecciones.");
    if (target !== redirectMap.get(source)) finalRedirects.set(source, target);
  }
  return { items, offerings: changes, routes, redirects: [...finalRedirects].map(([source_url, target_url]) => ({ source_url, target_url })), messages };
}

function validateDestination(url: string, snapshot: PublicationSnapshot) {
  if (/^https?:\/\//i.test(url)) { new URL(url); return; }
  const fixed = ["/", "/#hero", "/blog", "/politica-privacidad", ...Object.values(SECTION_BASES), ...snapshot.routes.map((r) => r.path)];
  const offerings = snapshot.offerings.filter((o) => !o.deleted_at).map((o) => `${offeringBase(String(o.type))}/${o.slug}`);
  const pathname = url.split(/[?#]/)[0];
  assert(!/[\\\s]/.test(url) && !url.startsWith("//") && (fixed.includes(pathname) || offerings.includes(pathname) || snapshot.destinations?.includes(pathname)), `El destino ${url} no corresponde a una página conocida. Vincula la página antes de publicar.`);
}
