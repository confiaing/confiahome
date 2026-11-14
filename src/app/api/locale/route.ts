import { isLocale } from "@/i18n/locales";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/i18n/negotiate";
import { equivalentPath } from "@/i18n/routes";

// Cambio manual de idioma (ADR-0012): guarda la preferencia y lleva a la página
// equivalente. Es un enlace normal, así que funciona sin JavaScript, y la cookie la
// pone el servidor para que dure el año completo.
export const dynamic = "force-dynamic";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Ruta de la página desde la que se cambió de idioma, si es de este mismo sitio. */
function originPath(request: Request): string {
  const referer = request.headers.get("referer");
  if (!referer || !URL.canParse(referer)) return "";
  const from = new URL(referer);
  // Tras un proxy, el host de request.url puede no ser el público: vale también Host.
  const hosts = [new URL(request.url).host, request.headers.get("host")];
  return hosts.includes(from.host) ? from.pathname : "";
}

function redirect(request: Request, path: string, cookie?: string): Response {
  const headers = new Headers({
    // Relativo y sacado siempre de la tabla de rutas, nunca de un dato de la petición.
    Location: path,
    "Cache-Control": "private, no-store",
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 307, headers });
}

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "";
  if (!isLocale(to)) return redirect(request, "/");

  // Secure siempre, salvo en la máquina de desarrollo: tras el proxy de Cloudflare el
  // protocolo de request.url no es fiable, así que no se decide por él.
  const local = LOCAL_HOSTS.has(url.hostname);
  const secure = local ? "" : "; Secure";
  const cookie = `${LOCALE_COOKIE}=${to}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;
  return redirect(request, equivalentPath(originPath(request), to), cookie);
}
