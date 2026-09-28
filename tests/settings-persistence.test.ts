import assert from "node:assert/strict";
import test from "node:test";
import type { SiteSettings } from "../src/lib/cms/settings-types.ts";
import {
  SettingsPersistenceError,
  persistSettings,
} from "../src/lib/cms/settings-persist.ts";

function mkSettings(): SiteSettings {
  return {
    site: { site_name: "", site_description: "", logo_url: "", favicon_url: "", default_language: "es", timezone: "Europe/Madrid" },
    menu: { header_logo_url: "", scroll_menu_background_color: "", scroll_menu_text_color: "", scroll_menu_icon_color: "", scroll_menu_logo_tint_enabled: false, scroll_menu_logo_tint_color: "" },
    contact: { email: "", phone: "", whatsapp: "", address: "", city: "", country: "", map_url: "" },
    social: { instagram_url: "", tiktok_url: "", facebook_url: "", youtube_url: "", pinterest_url: "" },
    footer: { footer_logo_url: "", footer_text: "", legal_text: "", show_social_links: true, show_contact_info: true },
    seo: { default_seo_title: "", default_seo_description: "", default_og_image_url: "", robots_index: true, robots_follow: true },
    system: { maintenance_mode: false, updated_at: "" },
  };
}

test("persistSettings reporta éxito cuando ambas escrituras funcionan", async () => {
  const result = await persistSettings(
    mkSettings(),
    {
      writeSiteSettings: async () => {},
      writeMenuVisualSettings: async () => {},
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.saved.length, 2);
  assert.equal(result.failed.length, 0);
  assert.equal(result.errors.length, 0);
});

test("persistSettings reporta fallo sin falso éxito cuando site_settings falla", async () => {
  const result = await persistSettings(
    mkSettings(),
    {
      writeSiteSettings: async () => { throw new Error("conexión perdida"); },
      writeMenuVisualSettings: async () => {},
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.saved.length, 1);
  assert.equal(result.failed.length, 1);
  assert.ok(result.errors.some((e) => e.includes("site_settings")));
});

test("persistSettings informa guardado parcial cuando site_settings ok y menu falla", async () => {
  const result = await persistSettings(
    mkSettings(),
    {
      writeSiteSettings: async () => {},
      writeMenuVisualSettings: async () => { throw new Error("tabla inexistente"); },
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.saved.length, 1);
  assert.equal(result.failed.length, 1);
  assert.ok(result.errors.some((e) => e.includes("menu_visual_settings")));
});

test("SettingsPersistenceError expone saved y failed", () => {
  const err = new SettingsPersistenceError("No se pudo guardar.", ["site_settings"], ["menu_visual_settings"]);
  assert.ok(err instanceof SettingsPersistenceError);
  assert.equal(err.saved.length, 1);
  assert.equal(err.saved[0], "site_settings");
  assert.equal(err.failed.length, 1);
  assert.equal(err.failed[0], "menu_visual_settings");
  assert.ok(err.message.includes("No se pudo guardar"));
});
