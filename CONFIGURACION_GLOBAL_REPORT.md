# Configuración Global — Inventario de Campos y Resumen de Cambios

## Inventario de Campos (36 campos)

| Campo | Sección | Origen por defecto | ¿Sobrescriturable por footer? |
|---|---|---|---|
| `site.site_name` | Site | Global | No |
| `site.site_description` | Site | Global | No |
| `site.logo_url` | Site | Global | No |
| `site.favicon_url` | Site | Global | No |
| `site.default_language` | Site | Global | No |
| `site.timezone` | Site | Global | No |
| `menu.header_logo_url` | Menu | Global | No |
| `menu.scroll_menu_background_color` | Menu | Global | No |
| `menu.scroll_menu_text_color` | Menu | Global | No |
| `menu.scroll_menu_icon_color` | Menu | Global | No |
| `menu.scroll_menu_logo_tint_enabled` | Menu | Global | No |
| `menu.scroll_menu_logo_tint_color` | Menu | Global | No |
| `contact.email` | Contact | Global | **Sí** (si tiene texto) |
| `contact.phone` | Contact | Global | No |
| `contact.whatsapp` | Contact | Global | **Sí** (si tiene texto) |
| `contact.address` | Contact | Global | **Sí** (si tiene texto) |
| `contact.city` | Contact | Global | No |
| `contact.country` | Contact | Global | No |
| `contact.map_url` | Contact | Global | **Sí** (si tiene texto) |
| `social.instagram_url` | Social | Global | **Sí** (si tiene URL) |
| `social.tiktok_url` | Social | Global | **Sí** (si tiene URL) |
| `social.facebook_url` | Social | Global | **Sí** (si tiene URL) |
| `social.youtube_url` | Social | Global | **Sí** (si tiene URL) |
| `social.pinterest_url` | Social | Global | **Sí** (si tiene URL) |
| `footer.footer_logo_url` | Footer | Global | No |
| `footer.footer_text` | Footer | Global | No |
| `footer.legal_text` | Footer | Global | **Sí** (si tiene texto) |
| `footer.show_social_links` | Footer | Global | No |
| `footer.show_contact_info` | Footer | Global | No |
| `seo.default_seo_title` | SEO | Global | No |
| `seo.default_seo_description` | SEO | Global | No |
| `seo.default_og_image_url` | SEO | Global | No |
| `seo.robots_index` | SEO | Global | No |
| `seo.robots_follow` | SEO | Global | No |
| `system.maintenance_mode` | System | Global | No |
| `system.updated_at` | System | Global | No |

### Reglas de prioridad

- **Global** (defecto): el campo es controlado exclusivamente por la Configuración global.
- **Footer-override**: el editor del footer puede sobrescribir este campo. El CMS lo señala con una nota y permite volver al valor global borrando el campo del footer.
- **Page-override**: el SEO específico de cada página prevalece sobre los valores SEO generales.

### Campos sobrescriturables por footer (9)

| Campo | Condición |
|---|---|
| `contact.email` | `footer.contact_email` tiene texto |
| `contact.whatsapp` | `footer.whatsapp` tiene texto |
| `contact.address` | `footer.address` tiene texto |
| `contact.map_url` | `footer.map_url` tiene texto |
| `footer.legal_text` | `footer.legal_text` tiene texto |
| `social.instagram_url` | footer tiene enlace de Instagram con URL |
| `social.facebook_url` | footer tiene enlace de Facebook con URL |
| `social.tiktok_url` | footer tiene enlace de TikTok con URL |
| `social.youtube_url` | footer tiene enlace de YouTube con URL |
| `social.pinterest_url` | footer tiene enlace de Pinterest con URL |

---

## Resumen de Cambios

### Archivos nuevos creados (16)

| Archivo | Descripción |
|---|---|
| `src/lib/cms/settings-types.ts` | Interfaz `SiteSettings` + `DEFAULT_SETTINGS` + `SETTINGS_SECTIONS` |
| `src/lib/cms/settings-schema.ts` | Validación pura de payloads (`validateSettingsPayload`) |
| `src/lib/cms/settings-persist.ts` | Lógica de persistencia pura (inyectable, sin Supabase) |
| `src/lib/cms/settings-overrides.ts` | Mapeo de campos → origen (global/footer-override) |
| `src/lib/cms/settings-cache.ts` | Invalidación de cachés |
| `src/lib/cms/maintenance.ts` | Modo mantenimiento (decisión de rutas, HTML 503) |
| `src/lib/cms/maintenance-mode.ts` | Lectura de snapshot de mantenimiento desde Supabase |
| `src/lib/seo/site-timezone.ts` | `resolveSiteTimeZone`, `formatSiteDate`, `formatSiteDateBadge` |
| `src/lib/seo/site-language.ts` | `normalizeSiteLanguage`, `siteHtmlLang`, `siteOpenGraphLocale` |
| `src/lib/seo/site-robots.ts` | `resolveSiteRobots`, `robotsContent`, `resolveRobotsMetadata` |
| `src/components/layout/SiteTimeZoneProvider.tsx` | React Context + hook `useSiteTimeZone` |
| `tests/settings-schema.test.ts` | Tests de validación |
| `tests/settings-persistence.test.ts` | Tests de persistencia |
| `tests/settings-overrides.test.ts` | Tests de overrides |
| `tests/site-robots.test.ts` | Tests de robots |
| `tests/site-timezone.test.ts` | Tests de timezone |
| `tests/site-language.test.ts` | Tests de idioma |
| `tests/maintenance.test.ts` | Tests de modo mantenimiento |

### Archivos reescritos/modificados (44)

| Archivo | Cambio principal |
|---|---|
| `src/lib/cms/settings.ts` | Persistencia única, `updateSettings()` lanza `SettingsPersistenceError`, sin falso éxito |
| `src/app/api/admin/settings/route.ts` | Validación con `validateSettingsPayload`, errores 422/500 con `saved`/`failed` |
| `src/app/api/admin/menu/publish/route.ts` | Guardado secuencial, `validateSettingsPayload`, `invalidateSettingsCaches` |
| `src/lib/cms/public-footer.ts` | Corregido `legal_text` (era `footer_text`), campos de brand/logo/social |
| `src/lib/cms/public-footer-model.ts` | Modelo con `brandText`, `logoUrl`, `showContactInfo`, `showSocialLinks` |
| `src/components/layout/footer/PublicFooterContent.tsx` | Logo+brandText, contact/social gating |
| `src/components/layout/footer/FooterContactInfo.tsx` | Render condicional de `contactTitle` |
| `src/app/layout.tsx` | Favicon, lang, robots independientes, OG locale |
| `src/lib/seo/structured-data.ts` | `organizationJsonLd()` con `description`/`logoUrl` opcionales |
| `src/components/layout/scroll-nav/resolveEditorialScrollMenu.ts` | Prioridad logo (`header_logo_url` → `logo_url`), sin sustituciones de color |
| `src/components/layout/HeaderHome.tsx` | Pasa `settings.site` a `resolveEditorialScrollMenu()` |
| `src/components/layout/HeaderInterno.tsx` | Igual que HeaderHome |
| `src/proxy.ts` | Gate de modo mantenimiento (503 para públicas, fail-open) |
| `src/lib/utils.ts` | `formatDate(value, timeZone?)` con `resolveSiteTimeZone()` |
| `src/features/blog/lib/formatBlogDateBadge.ts` | Delega a `formatSiteDateBadge()` |
| `src/features/blog/components/index/BlogFeaturedCarousel.tsx` | `timeZone` + `useSiteTimeZone()` |
| `src/features/blog/components/index/BlogFeaturedSlide.tsx` | Prop `timeZone` |
| `src/features/blog/components/index/BlogFeaturedSlideCard.tsx` | Prop `timeZone` |
| `src/features/blog/components/index/BlogFeedSection.tsx` | Prop `timeZone` |
| `src/features/blog/components/index/BlogFeedList.tsx` | Prop `timeZone` |
| `src/features/blog/components/index/BlogFeedPostCard.tsx` | Prop `timeZone` |
| `src/features/blog/components/index/BlogFeedDateBadge.tsx` | Prop `timeZone` |
| `src/features/blog/BlogIndexPage.tsx` | Pasa `settings.site.timezone` a secciones |
| `src/features/legal/PrivacyPolicyPage.tsx` | Pasa `siteSettings.site.timezone` a `formatDate()` |
| `src/app/admin/settings/page.tsx` | Pasa `footer` a `SettingsForm` para override indicators |
| `src/components/admin/SettingsForm.tsx` | Guardado confiable, `OverrideNote` para campos footer, mensajes precisos |
| `src/components/admin/PublicMenuEditor.tsx` | Corregido `<fieldset>` sin cerrar + `</div>` órfano |
| `src/app/api/admin/menu/publish/route.ts` | Escritura secuencial settings+menu |
| `src/lib/cms/footer-contact-sync.ts` | Patch-only en `updateContactSettings()` |
| `src/lib/cms/settings-schema.ts` | Imports relativos para compatibilidad `--experimental-strip-types` |
| `tests/settings-persistence.test.ts` | Import tipo, expectativas corregidas |
| `tests/settings-overrides.test.ts` | Uso de `makeFooter()` en lugar de casts incorrectos |
| `tests/site-timezone.test.ts` | Fecha que cruza medianoche para test UTC |
| `tests/maintenance.test.ts` | Eliminada aserción `503` en HTML (es status code, no contenido) |
| `package.json` | `test:backend` incluye todos los nuevos test files |

### Estado de verificación

- ✅ **Tipo-check**: limpio (0 errores TS)
- ✅ **Lint**: limpio (0 errores ESLint)
- ✅ **Tests**: 74/74 pasando (0 fallos)
- ✅ **Build**: exitoso (Next.js compila todos los rutas)
- ✅ **Cambios locales preservados**: `FooterContactInfo.tsx` y `offering-detail-redesign.css`
- ✅ **Error pre-existente corregido**: `PublicMenuEditor.tsx` `<fieldset>` sin cerrar
