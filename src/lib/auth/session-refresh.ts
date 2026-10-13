import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { copySessionState, type SessionTarget } from "./session-state";

/**
 * Refresco de sesión de Supabase en el proxy.
 *
 * Los Server Components no pueden escribir cookies: cuando el JWT caduca, el
 * cliente de `supabase-auth.ts` intenta refrescar dentro de un `try/catch` que
 * se traga el error, y el token renovado se pierde. El proxy es el único punto
 * que puede devolver esas cookies al navegador, tal como documenta Supabase.
 *
 * El refresco se limita a las rutas que usan autenticación para no añadir
 * llamadas a Auth en el sitio público.
 *
 * Las APIs administrativas quedan fuera a propósito: el matcher del proxy
 * excluye `/api`, y no lo necesitan porque un Route Handler sí puede escribir
 * cookies con `cookies().set()`, de modo que `requireAdminApi()` ya renueva el
 * token en la respuesta.
 */

function hasSupabaseAuthEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Crea un cliente de Supabase ligado a la petición y expone `applyTo`, que
 * transfiere el estado de sesión a la respuesta que el proxy decida devolver.
 */
export function createSessionRefresher(request: NextRequest) {
  if (!hasSupabaseAuthEnv()) {
    return {
      refresh: async () => undefined,
      applyTo: <T extends SessionTarget>(target: T) => target,
    };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          for (const [key, value] of Object.entries(headers)) {
            supabaseResponse.headers.set(key, value);
          }
        },
      },
    },
  );

  return {
    /**
     * Verifica el token y, si está por caducar, lo renueva. `getClaims()`
     * valida la firma en cada llamada, a diferencia de `getSession()`, que solo
     * lee la cookie. Nunca lanza: un fallo de Auth no debe tumbar el CMS.
     */
    async refresh() {
      try {
        await supabase.auth.getClaims();
      } catch (error) {
        // Log sanitario: solo el tipo de fallo, nunca el token ni la cookie.
        console.error(
          "Fallo al refrescar la sesion de Supabase:",
          error instanceof Error ? error.name : "desconocido",
        );
      }
    },
    applyTo: <T extends SessionTarget>(target: T) => copySessionState(target, supabaseResponse),
  };
}
