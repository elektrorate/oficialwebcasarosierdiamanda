# Implementación SEO — 5 de octubre de 2026

Se excluyó el módulo genérico `/admin/pages`: no se modificaron su formulario, APIs, persistencia ni conexión al frontend.

## Cambios

- Las colecciones cursos, workshops, experiencias y gift cards usan `src/lib/seo/collection-metadata.ts`, con textos en español y etiquetas Open Graph/Twitter propias, canonical según las rutas publicadas del menú e imagen social global.
- Las landing pages usan sus campos SEO del CMS en título, descripción, canonical, Open Graph y Twitter. Prioridad de imagen: propia, global, imagen local de respaldo. No había landing publicada en el sitemap; esta ruta se verificó mediante prueba con datos simulados.
- Portada, blog, estudio y tienda disponen de imagen social de respaldo.
- Guardar ajustes globales o de Marketing invalida la página pública, robots y sitemap. Se comprobó el código de guardado; no se simuló una sesión administrativa ni un guardado por la interfaz autenticada.
- `.env.local` define `NEXT_PUBLIC_SITE_URL=http://localhost:9898`. Las respuestas locales ahora usan ese origen.
- El dominio de producción asociado al proyecto, confirmado con la API de Vercel, es `oficialwebcasarosierdiamanda.vercel.app`. Las respuestas públicas actuales de portada, robots y sitemap usan ese dominio correctamente. La API de variables devolvió 403; no fue necesario cambiar las variables remotas.
- Los conversores Vimeo conservan el hash de vídeos no listados y rechazan enlaces de administración. El CMS tenía enlaces `/manage/videos/...` en escritorio y móvil. Se muestra la imagen de fondo existente y se explica en el editor cómo introducir el enlace de Compartir. No se cambiaron permisos en Vimeo ni se recuperó un enlace privado: para reproducir esos vídeos se necesitan enlaces válidos y permisos de inserción.

## Datos reales del CMS

Se actualizaron ocho ofertas y seis artículos publicados: títulos específicos, descripciones diferenciadas y corrección del título en inglés de la tarjeta regalo. También se corrigió `20206` a `2026` en el extracto del workshop y se asignó la imagen existente de portada como imagen social global.

Los cambios están guardados en el Supabase compartido por los entornos. Los valores anteriores y nuevos están en `seo-content-before-after-1791183809053.json`. Cada actualización se limitó a una fila y a los campos incluidos en ese respaldo; se verificaron los valores devueltos y se protegió contra ediciones concurrentes en esos campos. Una segunda ejecución de comprobación devolvió cero diferencias.

El script `scripts/repair-seo-content.mjs` muestra diferencias sin escribir por defecto; `--apply` aplica sus textos editoriales. No programar su ejecución: los textos quedan editables por el usuario y no deben sobrescribirse automáticamente.

## Validación

- 29/29 URLs del sitemap: HTTP 200, título, descripción, canonical correcto y un H1.
- 33 enlaces internos; ninguno roto.
- Cero títulos duplicados y cero descripciones duplicadas en las 29 URLs.
- 14/14 textos guardados coinciden con título y descripción públicos.
- Página inexistente: HTTP 404 y noindex. Alias `/clases`: redirección permanente a `/cursos`.
- Portada renderizada: canonical en 9898, imagen OG presente, imagen de fondo presente, ningún iframe Vimeo inválido y cero errores de consola observados.
- 171/171 pruebas automáticas, TypeScript y ESLint de archivos modificados correctos; `git diff --check` correcto.
- Evidencia HTTP: `SEO_IMPLEMENTACION_2026-10-05.json`. Comando reproducible: `node scripts/verify-seo.mjs http://localhost:9898`.

## Pendientes externos

El código permanece en el workspace, sin commit, push ni nuevo despliegue. Los cambios editoriales sí están guardados en la base compartida; producción puede reflejarlos al regenerar sus páginas en caché.

Search Console no tiene propiedad configurada en el CMS; la función de sincronización existente es un placeholder que devuelve que la integración no está configurada. No se envió el sitemap ni se comprobó la indexación real en Google. Se necesita acceso a la propiedad verificada para hacerlo. El sitemap público está accesible en `https://oficialwebcasarosierdiamanda.vercel.app/sitemap.xml`.

Referencia: [Google: información sobre sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview). Publicar un sitemap facilita el descubrimiento, pero no garantiza indexación.
