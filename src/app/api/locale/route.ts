import { TAG_PATTERN } from "@/domain/analytics/events";
import { isLocale } from "@/i18n/locales";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/i18n/negotiate";
import { equivalentPath } from "@/i18n/routes";

// Cambio manual de idioma (ADR-0012): guarda la preferencia y lleva a la página
// equivalente. Es un enlace normal, así que funciona sin JavaScript, y la cookie la
// pone el servidor para que dure el año completo.
export const dynamic = "force-dynamic";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** La página desde la que se cambió de idioma, si es de este mismo sitio. */
function originPage(request: Request): URL | null {
  const referer = request.headers.get("referer");
  if (!referer || !URL.canParse(referer)) return null;
  const from = new URL(referer);
  // Tras un proxy, el host de request.url puede no ser el público: vale también Host.
  const hosts = [new URL(request.url).host, request.headers.get("host")];
  return hosts.includes(from.host) ? from : null;
}

/**
 * Las etiquetas de campaña de la página de origen, para que la visita siga contando para
 * su canal tras cambiar de idioma. Solo las tres conocidas y solo si son una etiqueta
 * limpia (letras, números y . _ ~ -): nada más de la dirección de origen se copia.
 */
function campaignQuery(from: URL | null): string {
  if (!from) return "";
  const kept = new URLSearchParams();
  for (const name of CAMPAIGN_PARAMS) {
    const value = from.searchParams.get(name);
    if (value && TAG_PATTERN.test(value)) kept.set(name, value);
  }
  const query = kept.toString();
  return query ? `?${query}` : "";
}

function redirect(request: Request, path: string, cookie?: string): Response {
  const headers = new Headers({
    // Relativo: la ruta sale siempre de la tabla de rutas; de la petición, solo etiquetas de campaña saneadas.
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
  const from = originPage(request);
  return redirect(request, equivalentPath(from?.pathname ?? "", to) + campaignQuery(from), cookie);
}
