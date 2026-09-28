/**
 * Invalidación de cachés dependientes de la Configuración global.
 *
 * Se invoca SOLO después de un guardado confirmado: así nunca se re-publica una
 * versión antigua por un guardado que no llegó a completarse.
 */

import { invalidateJsonCache } from "./local-storage";
import { invalidateSettingsCache } from "./settings";

/**
 * `invalidateSettingsCache` cubre la caché propia de `getSettings()` (15 s), que
 * es la que puede devolver ajustes antiguos dentro de la misma instancia.
 * `invalidateJsonCache` limpia la caché de lecturas JSON compartidas del CMS
 * para que ninguna vista derivada conserve datos previos al guardado.
 */export function invalidateSettingsCaches() {
  invalidateSettingsCache();
  invalidateJsonCache();
}
