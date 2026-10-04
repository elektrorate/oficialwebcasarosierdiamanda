# Correccion de superposicion del menu

Fecha: 2026-10-04. Entorno local: http://localhost:4050.
Evidencia E2E: TEST_MENU_DROPDOWNS_2026-10-04.json.

## Causa y correccion

Las entradas CMS Clases y CURSOS son registros distintos. /clases se
canonicaliza a /cursos, por lo que ambas terminan con el mismo destino.
El estado anterior abria los desplegables por href y los abria simultaneamente.

- Se conservan los IDs del CMS al construir NavigationItem.
- Los elementos generados tienen identidad propia; las vistas estaticas sin ID
  usan un fallback posicional, nunca la URL o etiqueta como control de apertura.
- Hero, barra fija y acordeon movil abren por identidad del elemento.
- Las claves React y los controles ARIA usan identidades independientes.
- La barra movil no duplica la navegacion de escritorio cuando esta activa.
- Los cambios de pagina/cabecera, Escape, clic fuera y cambio a movil cierran
  los paneles transitorios.
- Hover y foco mantienen el panel mientras exista alguna de esas interacciones.
  Solo el propietario puede programar/cancelar su cierre; el timer vuelve a
  comprobar la interaccion antes de ocultar el panel.
- El posicionamiento corrige solo el desplazamiento horizontal necesario para
  mantener 16 px dentro del viewport, respetando anchos y animaciones existentes.

No se cambiaron etiquetas, destinos, tipos de ofertas ni registros en Supabase.
No se deduplicaron automaticamente Clases y CURSOS: esa decision sigue siendo
editorial. Los dos enlaces pueden coexistir sin abrir ambos paneles.

## Resultado visual

- A 1440 px, Clases abre un solo panel de 316 px. Antes se abrian dos y se
  solapaban aproximadamente 218 px; ahora el solapamiento es cero.
- A 1100 px, Comunidad queda entre x=814 y x=1084: margen derecho de 16 px.
  Antes su panel sobresalia aproximadamente 76 px por el borde derecho.
- No se redujeron fuentes ni se cambio el logo, los colores o las etiquetas.

## Pruebas

| Comprobacion | Resultado |
| --- | --- |
| Tests backend y UI SSR | 168/168 correctos; 19 nuevos casos de navegacion |
| TypeScript | Correcto |
| Lint | Cero errores; un warning preexistente de social-galleries.ts |
| Build produccion | Correcto; 157 paginas generadas |
| E2E completo | 295 comprobaciones correctas; cero fallos; cinco omisiones previstas |
| Confirmacion rapida adicional | 25 comprobaciones correctas |
| Comparacion de menus, menu_items y public_section_routes | Sin diferencias antes/despues |

El E2E cubre Inicio, /cursos y una ficha de experiencia, con hero/barra fija,
hover, teclado, cambio entre raices con URL compartida, Escape, clic fuera,
retencion por foco/hover, cierre al navegar/volver y cambios de viewport.

Escritorio: 1025, 1100, 1280, 1440 y 1920 px. Movil: 360, 390 y 430 px.
Las cinco omisiones son el menu desktop del hero de Inicio, oculto por el
diseno existente; su barra fija si se comprueba.

Se interceptaron peticiones de escritura/Marketing en el navegador. La conexion
HMR propia de Next dev se permite para no impedir la hidratacion. El build se
ejecuto con un bloqueo de escrituras salientes y SITE_URL temporal, sin editar
las variables persistidas del proyecto.

## Limites y estado

Pruebas de navegador realizadas con Edge/Chromium. No se certifican todos los
navegadores ni ciclos de Activity de Cache Components, que no esta habilitado.
El clamp depende de los limites de ancho CSS existentes; no pretende encajar un
panel arbitrariamente mayor que el viewport.

No se realizaron guardados CMS ni se aplicaron migraciones durante las pruebas.
Este informe describe la validacion local y no acredita por si solo un despliegue.
