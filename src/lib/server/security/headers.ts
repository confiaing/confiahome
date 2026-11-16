// Cabeceras de seguridad de todas las respuestas del sitio (ADR-0016). Funciones puras:
// las aplica la entrada del Worker (worker/index.ts), que es por donde pasa todo lo que
// no es un archivo estático.

const NONCE = /^[A-Za-z0-9+/]{22,86}={0,2}$/;

/** Código aleatorio de un solo uso (128 bits) que autoriza los scripts de una respuesta. */
export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Política de contenido de una página. Los scripts solo se ejecutan si son del propio
 * sitio, llevan el código de esta respuesta o vienen de un tercero declarado. No hay
 * 'unsafe-inline' ni 'unsafe-eval': un script insertado en la página no se ejecuta.
 */
export function contentSecurityPolicy(nonce: string): string {
  if (!NONCE.test(nonce)) throw new Error("El código de la política de contenido no es válido.");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // Calendly (agenda, tras el clic), Turnstile (antispam) y Cloudflare Insights (visitas).
    `script-src 'self' 'nonce-${nonce}' https://assets.calendly.com https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "frame-src https://calendly.com https://challenges.cloudflare.com",
    "connect-src 'self' https://cloudflareinsights.com https://challenges.cloudflare.com",
    "img-src 'self' data:",
    "font-src 'self'",
    // Sin estilos en línea: el HTML servido no lleva atributos style ni bloques <style>.
    "style-src 'self'",
  ].join("; ");
}

type Options = { html: true; nonce?: string } | { html: false };

/** Cabeceras de una respuesta. El HTML lleva la política completa, con su código. */
export function securityHeaders(options: Options): Record<string, string> {
  const common = {
    // Un año, con subdominios: todo confia.ing va por HTTPS (confirmado por el fundador).
    // Sin precarga: es un compromiso aparte, difícil de deshacer.
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    // Dentro del sitio viaja la ruta (el cambio de idioma la necesita, ADR-0012); hacia fuera, solo el origen.
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  };
  if (!options.html) {
    // JSON, texto o XML: nada que cargar ni dónde incrustarse.
    return { ...common, "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" };
  }
  if (!options.nonce) throw new Error("Una respuesta HTML necesita su código para la política de contenido.");
  return {
    ...common,
    "Content-Security-Policy": contentSecurityPolicy(options.nonce),
    // Respaldo de frame-ancestors para navegadores antiguos.
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

/**
 * La misma dirección por HTTPS si el visitante llegó por HTTP, o null si no hay que
 * redirigir. HSTS solo protege a partir de la primera visita por HTTPS; esto cubre esa
 * primera visita. Se decide por la cabecera `cf-visitor`, que pone la red de Cloudflare:
 * en local no existe (y el preview reescribe el host), así que allí nunca se redirige.
 */
export function httpsRedirect(requestUrl: string, cfVisitor: string | null): string | null {
  let scheme: unknown;
  try {
    scheme = (JSON.parse(cfVisitor ?? "") as { scheme?: unknown }).scheme;
  } catch {
    return null;
  }
  if (scheme !== "http" || !URL.canParse(requestUrl)) return null;
  const url = new URL(requestUrl);
  url.protocol = "https:";
  return url.href;
}
