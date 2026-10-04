# Correccion segura de contenido SEO

Fecha: 2026-10-04.
Evidencia de navegador y APIs: TEST_SEO_CONTENT_2026-10-04.json.

## Cambios

- Normalizacion compartida de metadatos a texto plano: HTML, Markdown,
  entidades, espacios y saltos de linea. Conserva puntuacion literal.
- Las descripciones de respaldo se resumen hasta 160 caracteres, sin cortar
  palabras ni modificar el resumen o cuerpo almacenado.
- El SEO explicito se limpia al renderizar pero conserva su longitud editorial.
  70/160 son recomendaciones, no restricciones de Google.
- Avisos compartidos visibles en blog, productos, editor de clases/ofertas,
  ofertas genericas, landings, ajustes globales y Marketing.
- Contadores, preview orientativo y avisos de formato, longitud, campos SEO
  propios vacios y duplicados con otro contenido publicado.
- GET /api/admin/seo-review protegido por sesion CMS y Cache-Control: no-store.
  Consulta solo lectura, paginada y con verificacion de conteos; excluye
  borradores, eliminados y ofertas caducadas.
- Las APIs conservan sus contratos y anaden warnings en guardados y cambios de
  publicacion. Los clientes muestran esos avisos sin impedir guardar/publicar.
- Si no se pueden comprobar duplicados, se informa explicitamente; un guardado
  exitoso no se transforma en fallo por esa consulta auxiliar.
- El backend rechaza tipos SEO incorrectos y entradas de mas de 50.000
  caracteres por seguridad, sin imponer los limites editoriales de 70/160.
- Eliminados maxLength y recortes SEO del editor compartido; no se cambiaron
  limites de otros campos ni validaciones de precio, stock o contenido requerido.
- El auditor SEO incorpora avisos y duplicados; no marca como correctos los
  contenidos con avisos, ni como indexables durante noindex o mantenimiento.

## Verificacion

| Comprobacion | Resultado |
| --- | --- |
| npm.cmd run test:backend | 147/147 correctos, incluyendo 28 nuevos tests |
| npm.cmd run build | Correcto, con TypeScript; 157 paginas generadas |
| npm.cmd run lint | Cero errores; un warning preexistente |
| scripts/test-menu-database.mjs --test | PASS |
| git diff --check | Correcto |
| Metadatos de 20 fichas publicadas | Description coincide con el texto limpio esperado |
| Siete formularios en movil | Avisos visibles, sin recortes en inputs ni overflow horizontal |
| Editor de experiencia existente | Duplicado publicado detectado y visible |
| GET seo-review | 200 con sesion, 401 sin sesion, 20 peers publicados |
| Campos SEO con tipos incorrectos | Rechazados por APIs antes de guardar |
| Guardado simulado de producto | Aviso visible tras exito; titulo de 90 y descripcion de 200 conservados |
| Comparacion de datos antes/despues | Sin diferencias en blog_posts, products, offerings y landing_pages |

El guardado simulado se intercepto exclusivamente en navegador. No prueba un
guardado real en Supabase ni publica un producto. Los tests de backend usan
dependencias simuladas para comprobar persistencia de texto y fallos de lectura.

Warning de lint previo: ensureDefaultSocialGalleryInSupabase sin uso en
src/lib/cms/social-galleries.ts:215. Node tambien emite un warning de tipado de
modulos al ejecutar scripts TS fuera del bundler; no impide las pruebas.

## Ejemplos comprobados

- /blog/hacer-ceramica-en-pareja-en-barcelona: description de respaldo de 159
  caracteres en lugar del texto introductorio completo.
- /blog/no-es-falta-de-talento-es-miedo-a-crear: description de respaldo limpia
  de 159 caracteres, sin Markdown/HTML escapado.
- /cursos/coworking-de-investigacion-tecnica-de-esmaltes-y-engobes: description
  limpia de 66 caracteres, sin ### ni **.

Los articulos conservan su contenido completo en Supabase y en el render publico
del cuerpo: la normalizacion se aplica a los campos SEO del modelo publico.

## Proteccion y pendientes editoriales

El servidor de pruebas se inicio temporalmente en localhost:4051, con sesion
bootstrap efimera y bloqueo de escrituras salientes. Los eventos de Marketing
tambien se interceptaron. No hubo escrituras salientes reales durante el test.
No se modificaron variables de entorno persistidas ni se aplicaron migraciones.

No se corrigieron automaticamente los nombres/textos de prueba del producto
/shop/ggrdgr-er, ni se inventaron descripciones de actividades, ni se cambiaron
estados de publicacion. Esa revision editorial sigue pendiente. Los avisos
permiten identificar y corregir metadatos duplicados desde el CMS.

Tampoco se ejecutaron guardados/publicaciones reales, autosave real, pruebas de
login/password ni un despliegue a produccion. Las mejoras llegaran al sitio
publicado cuando se desplieguen; este informe no acredita ese despliegue.

## Revision previa a versionado

- Unificados los respaldos entre frontend, auditor y revision del CMS. Productos
  incluyen el nombre real del sitio y la descripcion SEO global cuando procede.
- Las previsualizaciones de ofertas usan el resumen que se guardara y las de
  landings respetan la prioridad del subtitulo del hero.
- La revision de ofertas excluye fechas invalidas sin depender de cambios de
  caducidad ajenos a este conjunto de archivos.
- Agregadas dos pruebas de consistencia de respaldos y duplicados. La verificacion
  final se realizo en un worktree aislado con solo los archivos destinados al
  commit y dependencias instaladas desde package-lock.json.
- Conjunto aislado: 140/140 tests, lint sin errores y build de produccion correcto
  con TypeScript. El workspace completo pasa 149 tests; nueve pertenecen a cambios
  previos ajenos de sesion/caducidades que se dejan fuera de estos commits.
- Repetida la prueba de navegador en ese conjunto aislado: 20 metadatos publicos,
  siete formularios, duplicados y guardado simulado correctos, sin cambiar datos.
- La evidencia JSON corresponde a esta ultima prueba aislada.
