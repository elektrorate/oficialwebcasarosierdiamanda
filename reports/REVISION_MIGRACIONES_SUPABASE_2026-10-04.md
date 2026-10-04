# Revision previa de migraciones Supabase

Fecha: 2026-10-04.

Las secciones iniciales describen el estado previo. La correccion posterior
de permisos y nombres locales se documenta al final de este informe.

## Alcance

Consultas de solo lectura al proyecto Supabase vinculado y revision de los SQL
locales. No se aplicaron migraciones, no se modificaron datos, permisos ni el
historial remoto. Las pruebas de roles se ejecutaron dentro de transacciones
READ ONLY terminadas con ROLLBACK. No se probaron operaciones destructivas.

## Equivalencias entre versiones locales y remotas

| Archivo local | Version remota | Resultado |
| --- | --- | --- |
| 20260803153432_reset_successful_login_rate_limit.sql | 20260803153629 | Mismo SQL funcional por inspeccion. La funcion instalada coincide con el cuerpo registrado remotamente. |
| 20260803165243_optimize_foreign_key_indexes.sql | 20260803165619 | Mismos seis CREATE INDEX; el archivo local incluye comentarios adicionales. Los seis indices existen con las definiciones esperadas. |
| 20260928085241_coordinated_menu_publication.sql | 20260928160028 | Mismo SQL funcional por inspeccion. Ambas funciones instaladas coinciden con los cuerpos registrados remotamente. |

La comparacion de cuerpos de funciones ignoro diferencias de espacios y saltos
de linea. No se afirma igualdad byte a byte entre archivos e historial.

La funcion reset_api_rate_limit es SECURITY INVOKER, tiene search_path vacio,
no permite EXECUTE a anon/authenticated y si a service_role. Este ultimo tiene
DELETE sobre private.api_rate_limits.

Estas tres funciones/optimizaciones ya estan desplegadas. No deben ejecutarse
otra vez para resolver exclusivamente la diferencia de versiones.

## internal_links: riesgo confirmado

- La tabla existe y contiene dos registros.
- Coinciden las nueve columnas y sus tipos/defaults con el SQL local.
- RLS esta activo y el trigger set_updated_at esta habilitado.
- La politica authenticated_all_internal_links es FOR ALL TO authenticated
  USING (true) WITH CHECK (true). No comprueba perfiles admin/editor.
- anon y authenticated tienen permisos SELECT, INSERT, UPDATE, DELETE,
  TRUNCATE, REFERENCES y TRIGGER sobre la tabla.
- Prueba READ ONLY como authenticated, sin identidad JWT/perfil CMS: dos
  registros visibles.
- Prueba READ ONLY como anon: cero registros visibles por RLS.
- Los permisos TRUNCATE no quedan restringidos por RLS en acceso SQL; no se
  probo TRUNCATE ni se afirma que PostgREST exponga esa operacion.

El backend de enlaces usa createAdminClient y las APIs /api/admin/links y
/api/admin/links/[id] exigen requireAdminApi. Estas comprobaciones de la API
no protegen el acceso directo de un usuario autenticado a la API de Supabase.

Accion recomendada: una nueva migracion aditiva de endurecimiento que retire
la politica amplia y los permisos de PUBLIC/anon/authenticated, preservando
el CRUD de service_role mediante las APIs CMS autenticadas. Antes de aplicarla,
verificar la credencial server-only del entorno y probar que el CMS mantiene
lectura, creacion, edicion y borrado. No modificar la migracion historica ni
borrar enlaces. Si se necesita acceso directo con JWT de admin/editor, usar
politicas de perfil explicitas en lugar de acceso a todos los autenticados.

## Publicacion coordinada del menu

Existen:

- menu_items.url_auto: boolean NOT NULL DEFAULT true.
- public_section_routes con sus columnas, primary key, unique y checks.
- menu_publication_history con sus columnas y primary key.
- menu_publication_snapshot(uuid).
- publish_menu_revision(uuid,text,jsonb,jsonb,text).

RLS esta activo en ambas tablas. anon/authenticated no tienen SELECT, INSERT,
UPDATE, DELETE ni TRUNCATE sobre ellas ni EXECUTE sobre las dos funciones.
service_role puede ejecutar las funciones.

Las seis rutas estan presentes: clases, workshops, experiencias, giftcards,
estudio y shop. La ruta actual de clases es /cursos, no /clases; existen aliases
historicos. No deben reinicializarse las rutas con los valores del SQL original.

La migracion local no es completamente idempotente: CREATE TABLE sin IF NOT
EXISTS e INSERT inicial de rutas. Reejecutarla fallaria con el esquema existente.

## Estado de las nueve migraciones locales

| Version local | Estado observado | Accion segura |
| --- | --- | --- |
| 20260803120227 | No registrada con esta version. No se hizo un barrido de referencias a medios antiguos en esta revision. | Comprobar referencias restantes y existencia de los archivos en Storage antes de sustituir URLs. |
| 20260803153432 | Cubierta por 20260803153629; funcion y permisos confirmados. | Reconciliar la identidad local con la remota, sin reejecutar SQL. |
| 20260803165243 | Cubierta por 20260803165619; seis indices confirmados. | Reconciliar la identidad local con la remota, sin crear duplicados. |
| 20260818090000 | Las tres columnas PostHog ya existen. Cero filas con configuracion no vacia o activada. | Revisar el historial y evitar tratarla como un cambio de esquema ausente. |
| 20260818120000 | Tabla, trigger y politica ya existen. Permisos demasiado amplios. | Endurecer con una nueva migracion; no volver a crear la politica amplia. |
| 20260819000000 | Las columnas que eliminaria siguen presentes. | No aplicada al esquema actual. Confirmar retirada de PostHog antes de una operacion que borra columnas. |
| 20260906120000 | Tres columnas, check e indice de caducidad ya existen. Cero ofertas con caducidad habilitada sin fecha. | Reconciliar historial tras revisar el SQL; no confundirlo con cron ejecutado. |
| 20260907000000 | El check solo admite 301/302. /home sigue con una redireccion activa 301. | Cambio 308 realmente pendiente en el esquema actual. |
| 20260928085241 | Cubierta por 20260928160028; esquema y cuerpos de funciones confirmados. | Reconciliar versiones sin recrear tablas ni rutas. |

La version SEO 20261004000000 si consta en el historial remoto como
global_sitemap_setting.

## Orden recomendado para continuar

1. Guardar una copia del historial remoto y de los datos relevantes antes de
   cualquier cambio posterior.
2. Alinear los tres nombres/versiones locales equivalentes con las identidades
   remotas verificadas, preservando el SQL y el historial de despliegues. Revisar
   referencias a esos archivos en scripts antes de renombrarlos.
3. Revisar por separado los efectos ya presentes de internal_links, PostHog y
   caducidad antes de registrar versiones como aplicadas. No marcar cambios de
   datos como aplicados basandose solo en la presencia de columnas.
4. Preparar y validar la nueva migracion de seguridad de internal_links.
5. Evaluar por separado la limpieza de URLs antiguas, la retirada de columnas
   PostHog y el soporte 308. No agruparlos en un push ciego.
6. Ejecutar db push --dry-run despues de reconciliar historial, comprobar la
   lista exacta de SQL a ejecutar y solo entonces aplicar los cambios aprobados.

No se ejecuto migration repair, db pull, db push ni ALTER/GRANT/REVOKE/DDL
durante la revision inicial. Solo se creo este informe local, sin commit ni push.

## Implementacion posterior autorizada

Se renombraron los tres archivos locales para utilizar las versiones existentes
en remoto, sin cambiar su SQL:

- 20260803153432 -> 20260803153629 (reset_successful_login_rate_limit).
- 20260803165243 -> 20260803165619 (optimize_foreign_key_indexes).
- 20260928085241 -> 20260928160028 (coordinated_menu_publication).

Se actualizo la referencia del script scripts/test-menu-database.mjs. No se
recrearon tablas, funciones, rutas ni indices en Supabase para estas equivalencias.
No se alteraron ni eliminaron las tres versiones del historial remoto.

Se creo y aplico exclusivamente la nueva migracion:

supabase/migrations/20261004001000_secure_internal_links.sql

Esta migracion es transaccional, limita el tiempo de espera de bloqueos y:

- Conserva RLS habilitado.
- Elimina la politica authenticated_all_internal_links.
- Revoca todos los permisos de PUBLIC, anon y authenticated sobre internal_links.
- Conserva SELECT, INSERT, UPDATE y DELETE para service_role.
- No modifica registros ni la migracion historica de internal_links.

Debido a las seis migraciones historicas no reconciliadas, se ejecuto solo este
archivo con db query --linked --file. Tras probar sus efectos, se registro
exclusivamente 20261004001000 como applied mediante migration repair. No se
marcaron como aplicadas las otras seis versiones.

### Verificacion de datos y permisos

- La credencial server-only local accede al proyecto hhxftxxshwgmfxuyrjmz.
- Permanecen los dos enlaces anteriores.
- La huella de todos los registros de internal_links coincide antes y despues:
  11297b0b15391978a3e794188423df9d.
- La huella de las rutas del menu tambien coincide:
  ebd6f2c7e60e67129c715875eb243c36.
- anon/authenticated ya no tienen lectura, creacion, edicion, borrado ni TRUNCATE.
- No quedan politicas en internal_links; el acceso server-only usa service_role.
- Prueba SQL supabase/tests/internal_links_roles.smoke.sql: PASS. Comprueba
  permisos, denegacion real de lectura/escritura y CRUD con un registro temporal
  de service_role; la transaccion termina con ROLLBACK.
- Prueba real de API Supabase: la clave publica recibe HTTP 401, codigo 42501;
  la credencial server-only conserva lectura de los dos enlaces.

No se realizaron operaciones sobre enlaces reales para probar escrituras, ni
se probaron operaciones destructivas como TRUNCATE. No se verifico una sesion
interactiva del CMS ni las variables de un despliegue Vercel de produccion.

### Validacion local

- npm.cmd run typecheck: correcto.
- npm.cmd run test:backend: 119/119 tests correctos.
- npm.cmd run lint: cero errores; un warning previo en social-galleries.ts.
- node --experimental-strip-types scripts/test-menu-database.mjs --test: PASS.
  Publicacion atomica, rollback, concurrencia, permisos, movimientos y redirects.

### Pendientes despues de reconciliar

db push --dry-run --linked --include-all enumera exactamente estas seis
migraciones historicas. El comando fue solo una simulacion:

1. 20260803120227_migrate_legacy_media_urls.sql.
2. 20260818090000_add_marketing_posthog_settings.sql.
3. 20260818120000_internal_links.sql.
4. 20260819000000_remove_marketing_posthog_settings.sql.
5. 20260906120000_offering_expiration.sql.
6. 20260907000000_redirect_type_308.sql.

No ejecutar include-all sin revisar esas seis. En especial, internal_links ya
existe y el SQL antiguo recrearia una politica amplia que se acaba de retirar;
debe reconciliarse su historial, no reintroducir esa politica. La eliminacion
PostHog y la sustitucion de URLs requieren evaluacion independiente.

La aplicacion en Supabase se realizo antes de versionar estos cambios locales.
Este informe no acredita un despliegue de la aplicacion ni un push a Git.
