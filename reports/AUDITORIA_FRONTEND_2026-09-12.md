# Auditoría integral del frontend

Fecha: 12 de septiembre de 2026  
Proyecto: Casa Rosier Cerámica  
Rama auditada: `main`  
Commit base: `33d2948`

## 1. Resumen ejecutivo

El proyecto compila y su estructura principal funciona, pero no está listo para considerarse limpio ni libre de incidencias.

Resultados generales:

- TypeScript: correcto, 0 errores.
- Build de producción de Next.js: correcto, 154 páginas generadas.
- Pruebas backend: 21 aprobadas, 0 fallidas.
- ESLint: 0 errores y 59 advertencias.
- Rastreo público local: 28 páginas, 29 enlaces internos y 114 recursos; no se encontraron respuestas 404 en los enlaces navegables.
- Rutas inexistentes: responden correctamente con 404.
- Alias antiguos: `/home`, `/gift-card` y `/reservas-privadas` redirigen correctamente.
- HTML: las páginas públicas revisadas contienen un solo H1 y las imágenes renderizadas tienen texto alternativo.
- Responsive: las rutas principales revisadas a 1440 px y 390 px no presentan desbordamiento horizontal.
- Fallos visibles: dos imágenes de Shop, una tarjeta destacada de la portada y el vídeo Vimeo de la portada fallan al cargar.
- Supabase: 11 URLs únicas de Storage devuelven HTTP 400; algunas están en campos heredados que pueden no mostrarse actualmente.
- Seguridad de dependencias: `npm audit` informa 1 vulnerabilidad crítica, 3 altas y 29 moderadas.
- Código sin uso: 44 archivos candidatos, 83 exports candidatos, 17 tipos exportados candidatos y 2 exports duplicados.
- CSS: 26 archivos, aproximadamente 625 KB de fuente y una alta superposición de reglas.

## 2. Incidencias prioritarias

### P0 — Dependencias con vulnerabilidades conocidas

`npm audit --omit=dev` informa 33 incidencias: 1 crítica, 3 altas y 29 moderadas.

Dependencias raíz afectadas:

- `next@16.2.12`: avisos críticos, incluida ejecución remota en determinadas configuraciones alojadas en Windows y un problema en optimización AVIF. Versión corregida disponible: `16.3.3` o superior.
- `@tiptap/*@3.28.0`: avisos de XSS/prototype pollution y ReDoS. Actualización disponible: `3.31.3`; los avisos citan correcciones desde `3.30.5`.
- `sharp@0.35.3`: vulnerabilidades de `libheif`. Corrección disponible: `0.35.4`.
- `nanoid` y `baseline-browser-mapping`: incidencias transitivas que deben resolverse al actualizar el árbol de dependencias.

Recomendación: actualizar en una rama separada, mantener todas las versiones Tiptap alineadas y repetir typecheck, lint, pruebas, build y pruebas del editor CMS.

### P1 — Imágenes rotas visibles en Shop

En escritorio y móvil, `/shop` intenta mostrar dos imágenes que devuelven `400 application/json` desde Supabase Storage:

- Producto `mostro1`: `1783852099876-53bb743a.jpeg`.
- Producto `Serie mineral 01`: `1783972138331-b393a969.jpg`.

Además, el producto `mostro1` contiene el valor inválido `???` en `gallery[0]`.

Consecuencia: tarjetas sin imagen y una entrada inválida al abrir la galería.

Recomendación: sustituir las imágenes desde el CMS y eliminar `???`. El campo `main_image_id` está almacenando una URL completa, pese a que su nombre indica que debería contener un identificador; conviene normalizar este contrato más adelante.

### P1 — Otras referencias rotas en Supabase Storage

Se analizaron ocho tablas públicas, 140 usos de Storage y 72 URLs únicas. Once URLs únicas devuelven HTTP 400.

Referencias afectadas:

- Cuatro Offerings de clases comparten una imagen rota de tarjeta Home: `1784630001053-066536c9.webp`.
- Los mismos cuatro Offerings comparten un póster roto: `1784219987271-e9a788a4.webp`.
- Los mismos cuatro Offerings comparten dos imágenes rotas de galería: `1784185411695-77bcc113.webp` y `1783959952196-71a86bb3.webp`.
- Gift Card `totoro interna`: imagen de tarjeta Home rota `1785773080693-51c100bf.webp`. Esta sí se observó rota en la portada móvil.
- Shop y Gift Card `clase xiaomi`: referencia incorrecta a `media/img/1766778567125-t8t5rt.png`.
- Producto `Jarron de gres blanco`: dos imágenes de galería rotas, `1783708798890-a4c953c0.jpg` y `1783847686135-864b855b.jpg`.
- Estudio y SEO del producto `Jarron de gres blanco`: `1783102086026-8aa47972.png`.
- Productos `Serie mineral 01` y `mostro1`: las dos imágenes principales indicadas en el apartado anterior.

Parte de las referencias de Offerings están dentro de `details.class.class`, una estructura heredada. Deben limpiarse después de confirmar que el frontend y el editor usan únicamente `details.class`.

### P1 — Vídeo principal de Vimeo no disponible

La portada solicita el vídeo `1222945239` mediante el reproductor de Vimeo y recibe HTTP 401. La página también activa solicitudes de desafío de Cloudflare que fallan en el navegador automatizado.

Consecuencias:

- El fondo de vídeo puede no mostrarse.
- La portada no alcanza estado `networkidle` en las pruebas.
- Se generan errores de consola/red y trabajo innecesario en el navegador.

Recomendación: comprobar privacidad, permisos de inserción y dominios permitidos en Vimeo, o reemplazar el vídeo por uno que permita reproducción embebida.

### P1 — Dominio SEO no configurado por entorno

`NEXT_PUBLIC_SITE_URL` no está definido en el entorno local auditado. El código usa como respaldo `https://casarosierceramica.com`, por lo que:

- `sitemap.xml` publica ese dominio.
- `robots.txt` apunta al sitemap de ese dominio.
- Las etiquetas canonical y Open Graph usan ese dominio.

Esto es coherente solo si ese será el dominio final. Mientras se utilice `oficialwebcasarosierdiamanda.vercel.app`, los metadatos apuntarán a otro host.

Recomendación: definir `NEXT_PUBLIC_SITE_URL` por entorno y cambiarlo únicamente cuando se decida el dominio canónico final.

## 3. Enlaces rotos o incorrectos

### Enlaces internos

No se encontraron enlaces internos con HTTP 404 en el rastreo de las páginas públicas actuales.

Se verificó también que rutas inexistentes en `/`, `/clases`, `/blog` y `/shop` devuelven 404, por lo que no existe un problema general de soft-404.

### Enlaces externos

Los enlaces renderizados hacia WhatsApp, Facebook, Glazy y el dominio temporal de Vercel respondieron con HTTP 200.

Problemas semánticos encontrados:

1. Los enlaces predeterminados de Instagram apuntan a Facebook en:
   - `src/lib/cms/footer-defaults.ts`
   - `src/lib/cms/footers.ts`
2. El bloque social predeterminado de varias páginas dice Instagram, pero `sourceHref` apunta a Facebook en `src/features/shared/contextual-sections/ideaPromptContent.ts`.
3. El CTA “Ver más” de la portada apunta de forma absoluta a `https://oficialwebcasarosierdiamanda.vercel.app/clases`. Funciona, pero debería ser `/clases` para no acoplar el contenido a un dominio temporal.
4. Existe un slug publicado anómalo: `/workshops/https-www-casarosierceramica-com-workshops-formulacion-esmaltes-barcelona`. Devuelve 200, pero parece haberse creado pegando una URL completa en el campo slug. Es un defecto SEO y de legibilidad.
5. El producto `mostro1` contiene `???` en la galería.

## 4. Código basura o sin uso

### Candidatos detectados por el grafo de imports

Knip detectó 44 archivos sin consumidores. Tres son scripts manuales y no deben eliminarse automáticamente:

- `scripts/audit-typography-mobile.mjs`
- `scripts/audit-typography.mjs`
- `scripts/check-shop.mjs`

Los scripts de tipografía usan `playwright-core`; por ello, el aviso de Knip que clasifica `playwright-core` como dependencia sin uso es un falso positivo.

Los siguientes 41 archivos de `src` son candidatos a eliminación o consolidación:

#### Árbol administrativo antiguo o desconectado

- `src/components/admin/BlogTable.tsx`
- `src/components/admin/ClassModuleControls.tsx`
- `src/components/admin/FooterForm.tsx`
- `src/components/admin/FootersTable.tsx`
- `src/components/admin/MediaEditModal.tsx`
- `src/components/admin/MediaUploader.tsx`
- `src/components/admin/MenusTable.tsx`
- `src/components/admin/MessagesSummaryCards.tsx`
- `src/components/admin/RichTextField.tsx`
- `src/components/admin/ShopOverviewCards.tsx`
- `src/components/admin/SocialGalleriesTable.tsx`
- `src/components/admin/TestimonialForm.tsx`
- `src/components/admin/TestimonialsTable.tsx`
- `src/components/admin/class-edit/components/HomeCardPreview.tsx`
- `src/components/admin/class-edit/index.ts`
- `src/components/admin/class-edit/tabs/ClassEditBasicTab.tsx`
- `src/components/admin/class-edit/tabs/ClassEditDetailTab.tsx`
- `src/components/admin/marketing/DateRangeFilter.tsx`
- `src/components/admin/marketing/SearchQueriesTable.tsx`
- `src/components/admin/page-editor/utils/faqSelection.ts`
- `src/components/admin/product-form/index.ts`
- `src/components/admin/shared-hero-editor/index.ts`

#### Componentes públicos antiguos o reemplazados

- `src/components/blog/BlogGrid.tsx`
- `src/components/blog/FeaturedCarousel.tsx`
- `src/components/editor/index.ts`
- `src/components/home/TestimonialSlider.tsx`
- `src/components/layout/FooterContactForm.tsx`
- `src/components/shop/Cart.tsx`
- `src/components/shop/ShopDetail.tsx`
- `src/components/shop/components/ShopCategoryFilters.tsx`
- `src/components/studio/StudioGallery.tsx`
- `src/components/ui/Pagination.tsx`
- `src/features/cart/CartPage.tsx`
- `src/features/classes/hooks/useClassDetailEnroll.ts`
- `src/features/experiences/ExperienceDetailPage.tsx`
- `src/features/shop/components/catalog/ShopProductCardActions.tsx`
- `src/features/studio/components/studio-team-member/hooks/useStudioTeamMemberBioStyle.ts`

#### Librerías sin consumidores detectados

- `src/lib/metadata.ts`
- `src/lib/project-version.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`

No deben borrarse los 41 archivos en una sola operación. Recomendación: eliminar por familias, ejecutar todas las verificaciones y comprobar el CMS después de cada lote.

### Exports y tipos sin uso

Knip también detectó:

- 83 exports sin consumidores.
- 17 tipos exportados sin consumidores.
- 2 exports duplicados: `BlogPagePostsTable` y `FooterEditor` se exportan como named y default.

Muchos exports pertenecen a archivos activos y pueden limpiarse sin borrar el archivo completo. Los tipos generados de `src/lib/supabase/types.ts` no deben eliminarse solo porque Knip no los vea importados individualmente.

### Archivos que parecen antiguos pero sí están activos

Los nueve archivos de `src/app/legacy/*.css` están importados globalmente desde `src/app/layout.tsx`. No son archivos huérfanos y eliminarlos directamente rompería estilos.

Las páginas alias `/home`, `/gift-card` y `/reservas-privadas` tampoco son basura: conservan compatibilidad y redirigen correctamente.

## 5. Deuda CSS y rendimiento

### CSS global excesivo y superpuesto

Datos medidos:

- 26 archivos CSS.
- Aproximadamente 625 KB de CSS fuente.
- 3.785 reglas CSS analizadas.
- 3.442 selectores únicos.
- 1.103 selectores aparecen en más de una regla; parte de estas repeticiones es válida por media queries, pero el volumen confirma una fuerte superposición.
- En la portada se cargaron 3.284 reglas de estilo y solo 591 coincidían con algún elemento en ese momento; 2.693 no coincidían.
- `src/app/admin/admin.css`: 8.128 líneas y 203 KB.
- `src/app/globals.css`: 4.311 líneas y 130 KB.
- `src/features/classes/components/class-detail/offering-detail-redesign.css`: 49 KB y contiene neutralizaciones explícitas de reglas heredadas.

Esto explica por qué aparecen conflictos entre reglas antiguas, responsive y rediseños posteriores.

Recomendación:

1. Separar CSS público por ruta o feature.
2. Consolidar primero Offerings, luego Home, Blog, Shop y Estudio.
3. Mantener estilos administrativos fuera del layout público.
4. Eliminar reglas antiguas solo después de medir cobertura por cada ruta y viewport.

### Imágenes sin optimización de Next.js

`next.config.ts` tiene `images.unoptimized: true`. Esto evita la optimización de Next para todas las imágenes gestionadas por `next/image`.

El directorio `public` contiene 28 imágenes y aproximadamente 3,94 MB. Las más pesadas son:

- `public/img/social-5.png`: 1,11 MB.
- `public/img/hero-bg.jpg`: 718 KB.
- `public/img/1766778567125-t8t5rt.png`: 355 KB.
- `public/img/social-3.jpg`: 332 KB.

No se detectaron archivos binarios duplicados por hash.

Cinco imágenes no tienen referencias estáticas en el código y deben contrastarse con el CMS antes de eliminarlas:

- `public/img/CERAMICA REATIVA.png`
- `public/img/gift-1.jpg`
- `public/img/letra de cabecera de clases.png`
- `public/img/social-5.jpg`
- `public/img/workshop-1.jpg`

## 6. Calidad de código

ESLint informa 59 advertencias:

- Imports, parámetros y variables sin uso.
- Dos advertencias de dependencias de hooks React:
  - dependencia ausente en `useBasicInfoTypography.ts`;
  - dependencia innecesaria en `useClassEditPreviewItem.ts`.
- Siete directivas `eslint-disable` que ya no hacen falta.
- Código local heredado sin uso en `src/lib/cms/local-storage.ts`.

La advertencia de hook ausente debe revisarse antes que la limpieza cosmética, porque puede producir previews desactualizados en el editor de Offerings.

Archivos especialmente grandes que conviene dividir:

- `src/app/admin/admin.css`: 8.128 líneas.
- `src/app/globals.css`: 4.311 líneas.
- `src/lib/cms/types.ts`: 1.661 líneas.
- `src/components/admin/class-edit/utils.ts`: aproximadamente 61 KB.
- `src/lib/cms/offerings.ts`: aproximadamente 52 KB.

## 7. Aspectos verificados como correctos

- Build de producción completado.
- TypeScript sin errores.
- 21 pruebas backend aprobadas.
- ESLint sin errores bloqueantes.
- Las rutas públicas del sitemap local responden 200.
- Las rutas inexistentes responden 404.
- Las rutas heredadas redirigen correctamente.
- No se observaron desbordamientos horizontales en las rutas principales a 1440 px y 390 px.
- Las páginas revisadas tienen un único H1.
- No se detectaron imágenes sin atributo `alt` en el HTML público rastreado.
- No se detectaron archivos de imagen duplicados por contenido en `public`.
- Los enlaces externos renderizados comprobados responden, salvo el reproductor Vimeo.

## 8. Orden recomendado de corrección

1. Actualizar Next.js, Tiptap y Sharp en una rama separada.
2. Reemplazar las imágenes rotas visibles de Shop y la Gift Card destacada.
3. Corregir el vídeo Vimeo o retirarlo mientras no sea insertable.
4. Limpiar las 11 referencias rotas de Storage y el valor `???` del CMS.
5. Corregir los enlaces de Instagram que apuntan a Facebook.
6. Cambiar el CTA absoluto de la portada por `/clases`.
7. Corregir el slug del workshop y crear una redirección desde el slug antiguo.
8. Definir la estrategia de `NEXT_PUBLIC_SITE_URL` para preview y dominio final.
9. Resolver primero las dos advertencias de hooks React y después el resto de las 59 advertencias.
10. Eliminar código huérfano por familias, con build y pruebas tras cada lote.
11. Refactorizar CSS por features y rutas; no eliminar `legacy/*.css` directamente.
12. Activar o sustituir la optimización de imágenes y comprimir los archivos grandes.

## 9. Comandos y alcance utilizados

- `npm run typecheck`
- `npm run lint`
- `npm run test:backend`
- `npm run build`
- `npm audit --omit=dev`
- `npm outdated`
- `knip`
- Rastreo HTTP del sitemap y enlaces internos.
- Pruebas con navegador Edge headless en 1440 × 900 y 390 × 844.
- Revisión de consola, peticiones fallidas, H1, imágenes, alt y overflow.
- Lectura de ocho tablas CMS y comprobación HTTP de URLs públicas de Supabase Storage, sin modificar datos.

Esta auditoría no eliminó código, no modificó Supabase y no corrigió contenido. El único archivo nuevo es este informe.
