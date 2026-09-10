# ADVERTENCIA: dominio público pendiente

## Estado actual

- Proyecto actual de Vercel: `oficialwebcasarosierdiamanda`.
- Equipo actual de Vercel: `elektrorates-projects`.
- Repositorio conectado: `elektrorate/oficialwebcasarosierdiamanda`.
- URL temporal que debe utilizarse durante el desarrollo:
  `https://oficialwebcasarosierdiamanda.vercel.app`.
- Dominio público antiguo:
  `https://www.casarosierceramica.com`.

## Problema detectado

El dominio `casarosierceramica.com` no aparece entre los dominios administrados
por la cuenta o el equipo de Vercel actualmente conectado. Por este motivo, no
es posible desvincularlo desde el proyecto actual.

El DNS de `www.casarosierceramica.com` continúa apuntando a infraestructura de
Vercel, pero aparentemente está asociado a otra cuenta, equipo o proyecto. La
web que entrega ese dominio no corresponde a la versión actual de la aplicación.

## Decisión temporal

Hasta que el proyecto esté terminado:

1. Trabajar y comprobar los despliegues con
   `https://oficialwebcasarosierdiamanda.vercel.app`.
2. Mantener conectado el repositorio de GitHub al proyecto actual.
3. No intentar añadir, eliminar ni forzar `casarosierceramica.com` desde el
   proyecto actual.
4. No eliminar el dominio en el registrador ni borrar sus registros DNS sin
   identificar antes quién administra la vinculación antigua.

## Resolución pendiente

Cuando se vaya a publicar la versión definitiva:

1. Acceder a la cuenta o equipo de Vercel que actualmente controla
   `casarosierceramica.com`, o acceder al panel del registrador del dominio.
2. Identificar el proyecto antiguo y retirar de él tanto el dominio raíz
   `casarosierceramica.com` como `www.casarosierceramica.com`.
3. Añadir ambos dominios al proyecto actual
   `oficialwebcasarosierdiamanda`.
4. Actualizar los registros DNS siguiendo exactamente los valores indicados por
   Vercel.
5. Configurar el dominio definitivo como dominio principal y redirigir la otra
   variante (`www` o dominio raíz) hacia él.
6. Verificar HTTPS, rutas internas, sitemap, etiquetas canonical y redirecciones.
7. Confirmar que los nuevos `push` de la rama de producción se publican en el
   dominio definitivo.

## Precaución

No crear otro repositorio ni clonar el proyecto para resolver este problema. El
repositorio y el proyecto actual pueden conservarse; únicamente hay que corregir
la propiedad o asignación del dominio cuando se tenga acceso a la cuenta antigua
o al registrador.

Última comprobación: 10 de septiembre de 2026.
