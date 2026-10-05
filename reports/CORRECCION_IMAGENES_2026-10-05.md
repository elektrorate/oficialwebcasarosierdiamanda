# Correccion de entrega y cache de imagenes

Fecha: 2026-10-05. Validacion local sobre `3a6b538`, realizada antes del commit y la publicacion de estos cambios.

## Cambios

- `assetPath` resuelve rutas sin anadir `width`/`quality` ineficaces a Storage. Conserva queries, fragmentos y protocolos originales, incluidos esquemas en mayusculas.
- Fondos de HeaderInterno usan candidatos `image-set()` generados por Next, conservando las reglas CSS de cover, posicion, gradiente y seleccion de imagen movil. Se mantienen candidatos 1920/3840 a q85 para no limitar a 640 px los recortes altos en movil.
- Imagen principal, ghost y capa anterior de las galerias shop/class comparten calidad 85, dimensiones y sizes. Las miniaturas mantienen su configuracion independiente.
- Markdown y ampliaciones de galerias utilizan URLs de Next para fuentes admitidas, sin imponer atributos de dimensiones que inventen el ratio original.
- El modal shop usa una unica variante de alta resolucion, hasta 3840 px, con descriptor 1x y sin sizes: preserva el tamano intrinseco del CSS auto. Next no amplia originales pequenos. Esta eleccion conserva detalle y geometria del visor; no busca servir una miniatura en el modal.
- Patrones remotos compartidos entre Next y los consumidores: Supabase actual y solamente el bucket publico legacy necesario para contenido ya publicado. Otros embeds externos conservan sus URLs originales sin ampliar el acceso del optimizador.
- SVG, incluidos fragmentos y extension en mayusculas, conservan su URL sin pasar por el optimizador. No se habilita `dangerouslyAllowSVG`.
- `/img/:path*` anuncia cache finita de 24 horas y must-revalidate, no immutable. No se fuerzan cabeceras globales en `/_next/image`, APIs, HTML o URLs del CMS.
- El fallback de imagen elimina srcset/sizes antes de sustituir src, para que el navegador no vuelva a seleccionar la variante fallida.

## Resultado medido

Build de produccion ejecutado con `next start` en `http://localhost:9899`, no en Vercel. Se reutilizaron los seis recorridos de la auditoria anterior en escritorio 1440x900 DPR1 y movil 390x844 DPR2, con scroll progresivo y apertura de galerias.

- 12 navegaciones HTTP 200, sin fallos de peticiones de imagen observados.
- 97 variantes optimizadas comprobadas por GET: todas WebP y HTTP 200.
- Las 97 variantes comprobadas en el build local anuncian `public, max-age=86400, must-revalidate`.
- Original local `/img/social-2.jpg` y variante optimizada: cache de 24 horas verificada mediante dos peticiones; la variante respondio HIT.
- En `/shop` no se solicito el PNG original del fondo en ninguno de los dos perfiles. El fondo WebP q85 pesa **69,908 bytes / 68.3 KiB**, frente a **1,165,698 bytes / 1.11 MiB** del PNG: ahorro aproximado del **94%**.
- Las galerias shop/class tienen srcset y sizes iguales entre principal y ghost en ambos perfiles. Apertura/cierre por Escape e imagen principal cargada, verificados.
- La ampliacion shop conserva exactamente las dimensiones renderizadas de los originales en dos fixtures, horizontal y pequeno, en ambos perfiles. No introduce el tope anterior de 960 CSS px ni amplifica la imagen pequena por una densidad ficticia.

### Peso acumulado observado

Comparacion con la captura anterior de produccion. Incluye URLs de imagen solicitadas durante scroll y apertura del modal, no el peso completo de la pagina ni exclusivamente el primer viewport.

| Ruta / perfil | Antes | Despues local |
|---|---:|---:|
| Tienda, escritorio | 1385.6 KiB | 315.5 KiB |
| Tienda, movil | 1450.9 KiB | 380.8 KiB |
| Blog, movil | 1250.0 KiB | 827.7 KiB |
| Curso detalle con modal, escritorio | 593.5 KiB | 478.1 KiB |
| Producto mostro1 con modal, escritorio | 355.7 KiB | 268.3 KiB |
| Producto mostro1 con modal, movil | 403.0 KiB | 300.1 KiB |

Son observaciones de cuerpos binarios, no una comparativa controlada de LCP ni latencia entre Vercel y localhost. El lazy loading puede cambiar las peticiones observadas. Las originales remotas no se modificaron.

## Pruebas

- `npm.cmd run test:backend`: 193 aprobadas, 0 fallos; incluye 22 pruebas nuevas de imagenes.
- TypeScript correcto y build de produccion completado.
- ESLint dirigido a todos los archivos modificados: sin errores ni avisos.
- `git diff --check`: correcto; solo avisos de conversion LF/CRLF del repositorio.
- Revision estatica adicional: SVG con fragmentos, esquemas en mayusculas, nitidez del crop movil y geometria del visor atendidos.

Evidencia: [VALIDACION_IMAGENES_2026-10-05.json](VALIDACION_IMAGENES_2026-10-05.json). Contiene comparison, cacheVerification y galleryVerification, ademas de las mediciones de archivos.

## Limites

La politica de cache del optimizador nativo de Vercel se debe confirmar despues de publicar: `next start` no garantiza la traduccion del builder/CDN. El cambio se configura en las fuentes locales, conforme a la documentacion instalada de Next, no mediante un override de la ruta del optimizador.

Una URL local estable reemplazada puede conservar su version anterior en el navegador hasta 24 horas. No se uso immutable ni se cambiaron reglas de cache de medios remotos editables.

No se convirtieron todas las imagenes del sitio: el IntroSlider deliberadamente unoptimized y los SVG pequenos no forman parte de estos tres arreglos. Una panoramica extrema puede requerir una variante movil especifica; se evita la reduccion anterior a 640 px, pero no se inventan dimensiones que el CMS no proporciona.

No se cambiaron datos del CMS, imagenes en Storage ni configuracion remota. Se preservaron los cambios ajenos pendientes. El servidor temporal se cerro al finalizar.
