import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, httpsRedirect, newNonce, securityHeaders } from "@/lib/server/security/headers";

const NONCE = "dGVzdC1ub25jZS0xMjM0NTY=";
const directives = (policy: string) =>
  Object.fromEntries(policy.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [name, ...values] = part.split(/\s+/);
    return [name!, values];
  }));
const external = (values: string[]) => values.filter((value) => value.startsWith("http"));

// security-headers · Política de contenido sin scripts en línea libres; Solo los terceros declarados (L9-5)
describe("política de contenido", () => {
  const policy = directives(contentSecurityPolicy(NONCE));

  it("script-src no admite scripts en línea libres, eval, comodines ni esquemas completos", () => {
    const script = policy["script-src"]!;
    for (const banned of ["'unsafe-inline'", "'unsafe-eval'", "*", "https:", "http:", "data:", "blob:"]) expect(script).not.toContain(banned);
    expect(script).toContain("'self'");
    expect(script).toContain(`'nonce-${NONCE}'`);
  });

  it("fija los valores base", () => {
    expect(policy["default-src"]).toEqual(["'self'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    // Sin upgrade-insecure-requests: la página no pide nada por HTTP, HSTS ya obliga a HTTPS,
    // y en WebKit esa directiva rompe el sitio servido en local por HTTP.
    expect(policy).not.toHaveProperty("upgrade-insecure-requests");
  });

  it("los únicos orígenes externos son Calendly, Turnstile y Cloudflare Insights, cada uno en su directiva", () => {
    expect(external(policy["script-src"]!).sort()).toEqual(
      ["https://assets.calendly.com", "https://challenges.cloudflare.com", "https://static.cloudflareinsights.com"].sort(),
    );
    expect(external(policy["frame-src"]!).sort()).toEqual(["https://calendly.com", "https://challenges.cloudflare.com"].sort());
    expect(external(policy["connect-src"]!).sort()).toEqual(["https://challenges.cloudflare.com", "https://cloudflareinsights.com"].sort());
    const others = Object.entries(policy).filter(([name]) => !["script-src", "frame-src", "connect-src"].includes(name));
    for (const [, values] of others) expect(external(values)).toEqual([]);
  });

  it("los estilos, las fuentes y las imágenes salen solo del propio sitio", () => {
    expect(policy["style-src"]).toEqual(["'self'"]);
    expect(policy["font-src"]).toEqual(["'self'"]);
    expect(policy["img-src"]).toEqual(["'self'", "data:"]);
  });

  it.each(["", "abc", "con espacio==", "x'; script-src *", "a".repeat(200)])("rechaza un código que no es base64 de 16 bytes o más: %j", (nonce) => {
    expect(() => contentSecurityPolicy(nonce)).toThrow();
  });
});

describe("código de un solo uso", () => {
  it("tiene al menos 128 bits y es distinto cada vez", () => {
    const seen = new Set(Array.from({ length: 200 }, () => newNonce()));
    expect(seen.size).toBe(200);
    for (const nonce of seen) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      expect(atob(nonce).length).toBeGreaterThanOrEqual(16);
    }
  });
});

// security-headers · Cabeceras en todas las respuestas; HTTPS persistente; Compatibilidad con el cambio de idioma
describe("cabeceras", () => {
  const html = securityHeaders({ html: true, nonce: NONCE });
  const other = securityHeaders({ html: false });

  it("toda respuesta lleva HSTS de un año con subdominios y sin precarga, nosniff, política de referente y de permisos", () => {
    for (const headers of [html, other]) {
      // El fundador confirmó el 2026-11-14 que todo el dominio va por HTTPS. La precarga es
      // un compromiso aparte, difícil de deshacer: no se pide.
      expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["Permissions-Policy"]).toMatch(/camera=\(\)/);
      expect(headers["Permissions-Policy"]).toMatch(/microphone=\(\)/);
      expect(headers["Permissions-Policy"]).toMatch(/geolocation=\(\)/);
    }
  });

  it("el HTML lleva además la política de contenido y la prohibición de incrustarse", () => {
    expect(html["Content-Security-Policy"]).toBe(contentSecurityPolicy(NONCE));
    expect(html["X-Frame-Options"]).toBe("DENY");
    expect(html["Cross-Origin-Opener-Policy"]).toBe("same-origin");
  });

  it("lo que no es HTML no lleva una política con código, pero tampoco se puede incrustar ni ejecutar nada", () => {
    expect(other["Content-Security-Policy"]).toBe("default-src 'none'; frame-ancestors 'none'");
  });

  it("pedir cabeceras de HTML sin código es un error, no una política abierta", () => {
    expect(() => securityHeaders({ html: true })).toThrow();
  });

  it("ninguna cabecera anuncia la tecnología del servidor", () => {
    for (const headers of [html, other]) expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain("x-powered-by");
  });
});

// security-headers · HTTPS persistente: la primera visita por HTTP también acaba en HTTPS
describe("redirección a HTTPS", () => {
  const HTTP = '{"scheme":"http"}';
  const HTTPS = '{"scheme":"https"}';

  it.each([
    ["http://confia.ing/es", "https://confia.ing/es"],
    ["http://confia.ing/es/privacidad?utm_source=x", "https://confia.ing/es/privacidad?utm_source=x"],
    ["https://confia.ing/", "https://confia.ing/"],
  ])("si Cloudflare dice que el visitante llegó por HTTP, %s lleva a %s", (from, to) => {
    expect(httpsRedirect(from, HTTP)).toBe(to);
  });

  it("si llegó por HTTPS no se redirige", () => {
    expect(httpsRedirect("https://confia.ing/es", HTTPS)).toBeNull();
  });

  // En local no hay red de Cloudflare delante: el preview sirve por HTTP y reescribe el
  // host al del dominio, así que la dirección de la petición no sirve para decidir.
  it.each([null, "", "no es json", "{}", '{"scheme":"ws"}'])("sin la señal de Cloudflare (%j) nunca se redirige", (visitor) => {
    expect(httpsRedirect("http://confia.ing/es", visitor)).toBeNull();
  });
});

// security-headers · Una respuesta «no modificado» no puede cambiar la política de la página guardada
describe("respuesta 304", () => {
  it("no lleva política de contenido: el navegador conserva la de la página que ya tiene", () => {
    const headers = securityHeaders({ html: false, notModified: true });
    expect(headers).not.toHaveProperty("Content-Security-Policy");
    expect(headers).not.toHaveProperty("X-Frame-Options");
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("la política de permisos solo nombra funciones que los navegadores reconocen", () => {
    expect(securityHeaders({ html: false })["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  });
});

