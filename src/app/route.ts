import { negotiateLocale, readLocaleCookie } from "@/i18n/negotiate";

// "/" no tiene página: lleva a /es o /en (ADR-0004). No hay middleware; la decisión
// se toma aquí, en cada petición, y por eso la respuesta no se puede cachear.
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const locale = negotiateLocale({
    cookie: readLocaleCookie(request.headers.get("cookie")),
    acceptLanguage: request.headers.get("accept-language"),
  });

  return new Response(null, {
    status: 307,
    headers: {
      // Relativa: vale sea cual sea el host con el que el Worker ve la petición. Conserva
      // la consulta (?utm_source=…) para no perder el origen de una campaña.
      Location: `/${locale}${new URL(request.url).search}`,
      "Cache-Control": "private, no-store",
      Vary: "Accept-Language, Cookie",
    },
  });
}
