import assert from "node:assert/strict";
import test from "node:test";
import { resolveSettingsOrigins } from "../src/lib/cms/settings-overrides.ts";

function makeFooter(overrides: Record<string, unknown> = {}) {
  const footer: Record<string, unknown> = {
    contact_email: "",
    whatsapp: "",
    address: "",
    map_url: "",
    legal_text: "",
    contact_title: "Contacto",
    contact_text: "",
    social_links: [],
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) footer[k] = v;
  }
  return footer as never;
}

test("sin footer todo es global", () => {
  const origins = resolveSettingsOrigins(null);
  assert.equal(origins["contact.email"].origin, "global");
  assert.equal(origins["footer.legal_text"].origin, "global");
  assert.equal(origins["social.instagram_url"].origin, "global");
});

test("el email del footer es una sobrescritura", () => {
  const origins = resolveSettingsOrigins(makeFooter({ contact_email: "hola@x.com" }));
  assert.equal(origins["contact.email"].origin, "footer-override");
  assert.ok(origins["contact.email"].resetHint);
});

test("el legal_text del footer es una sobrescritura", () => {
  const origins = resolveSettingsOrigins(makeFooter({ legal_text: "Aviso legal propio" }));
  assert.equal(origins["footer.legal_text"].origin, "footer-override");
});

test("las redes del footer son sobrescritura cuando tienen URL", () => {
  const origins = resolveSettingsOrigins(makeFooter({ social_links: [{ platform: "instagram", url: "https://x.com/rosier", label: "Instagram", icon_url: "/img/x.svg", icon_color: "", button_color: "" }] }));
  assert.equal(origins["social.instagram_url"].origin, "footer-override");
});

test("las redes del footer sin URL son globales", () => {
  const origins = resolveSettingsOrigins(makeFooter({ social_links: [{ platform: "instagram", url: "", label: "Instagram", icon_url: "/img/x.svg", icon_color: "", button_color: "" }] }));
  assert.equal(origins["social.instagram_url"].origin, "global");
});

test("contact.email sin valor en el footer es global", () => {
  const origins = resolveSettingsOrigins(makeFooter({ contact_email: "" }));
  assert.equal(origins["contact.email"].origin, "global");
});

test("todos los campos están presentes en el mapa", () => {
  const origins = resolveSettingsOrigins(null);
  const expected = [
    "site.site_name", "site.site_description", "site.logo_url", "site.favicon_url",
    "site.default_language", "site.timezone",
    "menu.header_logo_url", "menu.scroll_menu_background_color", "menu.scroll_menu_text_color",
    "menu.scroll_menu_icon_color", "menu.scroll_menu_logo_tint_enabled", "menu.scroll_menu_logo_tint_color",
    "contact.email", "contact.phone", "contact.whatsapp", "contact.address",
    "contact.city", "contact.country", "contact.map_url",
    "footer.footer_logo_url", "footer.footer_text", "footer.legal_text",
    "footer.show_social_links", "footer.show_contact_info",
    "seo.default_seo_title", "seo.default_seo_description", "seo.default_og_image_url",
    "seo.robots_index", "seo.robots_follow",
    "system.maintenance_mode",
  ];
  for (const field of expected) {
    assert.ok(field in origins, `falta ${field}`);
  }
});
