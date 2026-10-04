# Test general del CMS y frontend

Fecha: 2026-10-04.
Evidencia detallada: TEST_GENERAL_CMS_FRONT_2026-10-04.json.

## Resultado general

La aplicacion compila y las rutas y APIs examinadas funcionan. No se certifica
que todas las funciones del CMS esten libres de errores: la prueba fue de lectura,
navegacion, render y autorizacion, no un ciclo completo de escritura/publicacion.

La unica incidencia de recurso en el recorrido final es el video Vimeo del hero
de Inicio, que devuelve HTTP 401 tanto en la web publica como en el preview del
editor de Home. Las suites de auditoria publica terminan con exit 1 por este
recurso, aunque todas las paginas responden HTTP 200 y no hay enlaces rotos.

## Entorno y proteccion de datos

- Build de produccion y servidor next start temporal en http://localhost:4051.
- Servidor vinculado exclusivamente a localhost; no se cambio el servidor 4050.
- NEXT_PUBLIC_SITE_URL configurada temporalmente para la prueba, sin editar .env.
- Edge headless mediante playwright-core.
- Sesion bootstrap administrativa firmada con un secreto aleatorio temporal.
  No se almacenaron cookies ni secretos en los informes ni se uso login real.
- Bloqueo de peticiones de escritura del navegador; eventos Marketing simulados
  para no contaminar analiticas ni enviar formularios reales.
- Bloqueo de escrituras salientes del servidor. Solo se permitieron GET/HEAD y
  POST de lectura para listado Storage y snapshot del menu.
- En el recorrido final no hubo intentos de escritura saliente del servidor.
- La prueba SQL de internal_links utiliza un registro temporal y ROLLBACK.
- Los dos enlaces y las rutas del menu mantienen las huellas anteriores.
- No se modifico codigo de aplicacion para corregir incidencias, ni se hicieron
  commits, push o migraciones durante esta prueba.

## Comprobaciones automaticas

| Prueba | Resultado |
| --- | --- |
| npm.cmd run lint | 0 errores; 1 warning previo |
| npm.cmd run test:backend | 119 aprobados; 0 fallidos |
| npm.cmd run build | Correcto; 156 paginas generadas; incluye chequeo TypeScript |
| node --experimental-strip-types scripts/test-menu-database.mjs --test | PASS en PGlite local |
| supabase/tests/internal_links_roles.smoke.sql | PASS contra Supabase, con rollback |

Warning previo de lint: src/lib/cms/social-galleries.ts:215, funcion
ensureDefaultSocialGalleryInSupabase no utilizada.

La prueba PGlite emite el warning MODULE_TYPELESS_PACKAGE_JSON; no impide pasar.
Comprueba publicacion atomica, rollback, rechazo de revision obsoleta, permisos,
movimientos y redirecciones. No es una prueba de carga con escritores simultaneos.

## Frontend publico

- 29 rutas del sitemap recorridas en escritorio y movil.
- 29/29 responden HTTP 200, con contenido y sin overlay de error.
- 28/29 paginas sin incidencias de recurso por perfil. Inicio falla el chequeo
  por el mismo iframe Vimeo 401, no por una respuesta 500 de la aplicacion.
- 33 enlaces internos comprobados por perfil: ninguno roto.
- Auditoria de imagenes: 468 elementos img por perfil; cero incidencias de
  imagenes eager no cargadas, ALT ausente o srcset sin sizes.
- Responsive en 360x800, 390x844 y 430x932: menu movil abre y cierra correctamente.
- Inicio escritorio 1440x900: sin desplazamiento horizontal.
- Modales social y de offering en 390x844: apertura correcta, sin scroll interno
  inesperado y con imagen ocupando el area prevista.
- Cuatro rutas inexistentes: HTTP 404 correcto, incluida una ficha bajo /cursos.
- /home -> /, /clases -> /cursos y alias de una ficha: HTTP 301 correcto.

Las 29 paginas tienen title, description y canonical en HTML. Los bloques JSON-LD
examinados se parsean correctamente. Esto no sustituye Rich Results Test ni
inspeccion de indexacion del dominio real en Search Console.

## CMS

- 62 rutas distintas, incluyendo listados, ajustes, formularios vacios y varios
  editores de registros existentes.
- 124 renders: escritorio 1440x1000 y movil 390x844.
- Todos responden HTTP 200, tienen contenido y metadatos noindex.
- Cero errores JavaScript de pagina y cero desbordamientos horizontales.
- /admin/home registra el iframe Vimeo 401 en ambos perfiles; el editor carga.
- 37 APIs GET: HTTP 200 con sesion y HTTP 401 sin sesion.
- PUT settings, POST links, POST offerings y DELETE link sin sesion: HTTP 401.
- /admin/settings sin sesion redirige a /auth.

Areas cubiertas: dashboard, Home, Studio, enlaces, medios, menu, offerings,
clases, workshops, experiencias, gift cards, blog, paginas, shop, categorias,
cupones, pedidos, envios, FAQ, headers, profesores, testimonios, promociones,
galerias, Marketing, formularios, mensajes, reservas, redirects, papelera,
usuarios, historial, legal/cookies y landings.

No se abrio el editor singleton de footer para evitar su creacion automatica si
faltaran datos. Su API de lectura si se comprobo. Un GET 200 no demuestra por
si solo ausencia de fallbacks internos ni validacion semantica de todo el payload.

## Incidencias y observaciones

### Video Vimeo: incidencia confirmada en local

https://player.vimeo.com/video/1222945239 devuelve HTTP 401 en escritorio y movil.
Sucede en Inicio y en el preview CMS de Home. Una consulta independiente a la
URL de incrustacion tambien devolvio 401.

Revisar permisos de privacidad/incrustacion, dominios permitidos y URL completa
del video. No se verifico su reproduccion en el dominio publicado; podria existir
una restriccion especifica de localhost. No se cambio contenido del hero.

Referencias: src/components/layout/HomeHeroView.tsx:11-20 y
src/components/admin/shared-hero-editor/utils.ts:12-21 generan la URL embed.

### Contenido SEO: requiere revision editorial

La conexion con el HTML funciona, pero algunos valores publicados necesitan
limpieza o revision:

- /shop/ggrdgr-er: titulo GGRDGR ER y descripcion WEFWEWFWEFWFWFWF.
- /cursos/coworking-de-investigacion-tecnica-de-esmaltes-y-engobes: description
  conserva marcadores Markdown como ### y **.
- /blog/hacer-ceramica-en-pareja-en-barcelona y
  /blog/no-es-falta-de-talento-es-miedo-a-crear: descripciones muy extensas; la
  segunda contiene Markdown y etiquetas HTML escapadas.
- Dos experiencias comparten el mismo titulo y descripcion SEO.
- Inicio e indices no emiten og:image con la configuracion actual vacia.

No son fallos de carga ni requisitos estrictos de longitud de Google, pero si
riesgos de calidad de snippets y contenido publicado. No se editaron estos datos.

### Arranque local con hostname incompatible

Las primeras pruebas usaron next start -H 127.0.0.1 y reprodujeron un bucle 301
en /cursos y sus fichas. La version instalada de Next normaliza el hostname del
rewrite a localhost; el origen distinto puede convertirlo en un proxy HTTP al
propio servidor y activar el redirect de /clases a /cursos.

Con next start -H localhost el bucle desaparece sin modificar codigo ni datos:
/cursos responde 200, las fichas cargan y los slugs inexistentes responden 404.
Es una incompatibilidad del arranque local observado, no evidencia de que el
dominio de produccion este en un bucle. Referencias: src/proxy.ts:68-85 y
node_modules/next/dist/server/web/next-url.js:15-20.

### Configuracion del dominio

NEXT_PUBLIC_SITE_URL no esta definida en el entorno local habitual. Para este
build se proporciono temporalmente http://localhost:4051. Un build de produccion
sin esa variable sigue estando bloqueado por la comprobacion existente.
No se revisaron las variables del despliegue Vercel.

## Limites de cobertura

- No se probaron login/password/MFA ni renovacion real de sesiones Supabase.
- La sesion temporal fue de administrador bootstrap, no de editor ni de cliente.
- No se guardaron formularios, subieron archivos, publicaron contenidos ni menus,
  borraron registros reales, restauraron papelera ni ejecutaron sincronizaciones.
- No se enviaron formularios publicos, realizaron compras, pagos o envios reales.
- Analiticas y conversiones reales quedaron fuera por la proteccion de escritura.
- La auditoria de img no comprueba fondos CSS ni calidad semantica de los ALT.
- No se midieron Lighthouse/Core Web Vitals, carga concurrente, accesibilidad
  completa, cobertura instrumental ni compatibilidad en todos los navegadores.
- Los scripts de la prueba general quedaron en el directorio temporal aprobado;
  los scripts existentes del proyecto no se modificaron para esta prueba.

## Prioridades

1. Verificar la autorizacion de Vimeo para reproducir el video del hero.
2. Limpiar valores SEO de prueba y descripciones con contenido extenso/markup.
3. Confirmar NEXT_PUBLIC_SITE_URL del dominio real y mantener localhost coherente
   en futuros arranques de prueba.
4. Completar CRUD, publicacion, login real y compras en una base de staging aislada.
