import { describe, expect, it } from "vitest";
import { verifySite } from "../../scripts/lib/verify-site";

const NONCE = "dGVzdC1ub25jZS0xMjM0NTY=";
const CSP = `default-src 'self'; script-src 'self' 'nonce-${NONCE}'; frame-ancestors 'none'`;
const SECURE = { "strict-transport-security": "max-age=31536000; includeSubDomains", "x-content-type-options": "nosniff" };
const html = (extra: Record<string, string> = {}, body = `<html><script nonce="${NONCE}">1</script><script src="/a.js" nonce="${NONCE}"></script></html>`) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "content-security-policy": CSP, ...SECURE, ...extra } });
const text = (body: string, type = "text/plain") => new Response(body, { status: 200, headers: { "content-type": type, ...SECURE } });

const BASE = "https://confia.ing";
function site(overrides: Record<string, () => Response> = {}) {
  const routes: Record<string, () => Response> = {
    "GET /es": () => html(),
    "GET /en": () => html(),
    "GET /es/privacidad": () => html(),
    "GET /robots.txt": () => text(`User-Agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`),
    "GET /sitemap.xml": () => text(`<urlset><url><loc>${BASE}/es</loc></url></urlset>`, "application/xml"),
    "GET /llms.txt": () => text(`# Confia.ing\n[x](${BASE}/es)\n`),
    "GET /": () => new Response(null, { status: 307, headers: { location: "/es", ...SECURE } }),
    "POST /api/contact": () => Response.json({ status: "spam-rejected" }, { status: 403, headers: SECURE }),
    "POST /api/events": () => Response.json({ status: "invalid" }, { status: 400, headers: SECURE }),
    // Zona: fuera del origen base, las rutas van con la dirección completa.
    "GET http://confia.ing/es?verificacion=1": () => moved("https://confia.ing/es?verificacion=1"),
    "GET https://www.confia.ing/es?verificacion=1": () => moved("https://confia.ing/es?verificacion=1"),
    "GET http://www.confia.ing/es": () => moved("https://www.confia.ing/es"),
    "GET https://www.confia.ing/es": () => moved("https://confia.ing/es"),
    ...overrides,
  };
  return (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? "GET";
    if (url.origin !== BASE) {
      const route = routes[`${method} ${url.href}`];
      // Un host sin ruta simulada es como un DNS que no resuelve.
      if (!route) throw new TypeError("fetch failed");
      return route();
    }
    const key = `${method} ${url.pathname}`;
    return (routes[key] ?? (() => new Response("no", { status: 404 })))();
  }) as typeof fetch;
}
const moved = (location: string) => new Response(null, { status: 301, headers: { location } });
const failed = async (overrides: Record<string, () => Response>) => (await verifySite(BASE, site(overrides))).filter((item) => !item.ok).map((item) => item.name);

// production-release · Verificación tras el despliegue (L10-3)
describe("verificación de un sitio desplegado", () => {
  it("un sitio correcto pasa todas las comprobaciones", async () => {
    const results = await verifySite(BASE, site());
    expect(results.filter((item) => !item.ok)).toEqual([]);
    expect(results).toHaveLength(24);
  });

  it("detecta una página que no responde", async () => {
    expect(await failed({ "GET /en": () => new Response("x", { status: 500 }) })).toContain("GET /en responde 200");
  });

  it("detecta una página sin política de contenido o sin HSTS", async () => {
    expect(await failed({ "GET /es": () => html({ "content-security-policy": "" }) })).toContain("/es lleva política de contenido con código");
    expect(await failed({ "GET /es": () => html({ "strict-transport-security": "" }) })).toContain("/es lleva HSTS y nosniff");
  });

  it("detecta un HSTS que perdió los subdominios", async () => {
    expect(await failed({ "GET /en": () => html({ "strict-transport-security": "max-age=31536000" }) })).toEqual(["/en lleva HSTS y nosniff"]);
  });

  it("detecta un script sin el código de la respuesta", async () => {
    expect(await failed({ "GET /es": () => html({}, `<html><script nonce="${NONCE}">1</script><script>2</script></html>`) })).toContain("/es: todos los scripts llevan el código");
  });

  it("detecta direcciones locales en robots, sitemap o llms.txt", async () => {
    expect(await failed({ "GET /sitemap.xml": () => text("<urlset><url><loc>http://localhost:3000/es</loc></url></urlset>", "application/xml") })).toContain("/sitemap.xml usa la dirección pública");
  });

  it("detecta un servidor que acepta una consulta sin verificación antispam", async () => {
    expect(await failed({ "POST /api/contact": () => Response.json({ status: "accepted" }, { status: 201, headers: SECURE }) })).toContain("una consulta sin verificación antispam se rechaza");
  });

  it("nunca envía una consulta que pudiera guardarse: la de prueba no lleva token ni aceptación válida de contacto real", async () => {
    const bodies: string[] = [];
    const base = site();
    const spy = (async (input: string | URL | Request, init: RequestInit = {}) => {
      if (init.method === "POST") bodies.push(String(init.body));
      return base(input, init);
    }) as typeof fetch;
    await verifySite(BASE, spy);
    const contact = JSON.parse(bodies.find((body) => body.includes("formMode"))!) as Record<string, unknown>;
    expect(contact.turnstileToken).toBe("");
    expect(String(contact.email)).toMatch(/@example\.com$/);
  });
});

// production-release · Verificación tras el despliegue: la zona (L13-1, L13-2)
describe("verificación de la zona", () => {
  const HTTP = "http → https conserva ruta y parámetros";
  const WWW = "https://www lleva al dominio con ruta y parámetros";
  const WWW_HTTP = "http://www lleva a https del dominio";

  it("HTTP que sirve la página en vez de redirigir es un fallo", async () => {
    expect(await failed({ "GET http://confia.ing/es?verificacion=1": () => html() })).toEqual([HTTP]);
  });

  it("una redirección a HTTPS que pierde los parámetros es un fallo", async () => {
    expect(await failed({ "GET http://confia.ing/es?verificacion=1": () => moved("https://confia.ing/es") })).toEqual([HTTP]);
  });

  it("una redirección temporal no basta: se exige 301", async () => {
    expect(await failed({ "GET http://confia.ing/es?verificacion=1": () => new Response(null, { status: 302, headers: { location: "https://confia.ing/es?verificacion=1" } }) })).toEqual([HTTP]);
  });

  it("www que no resuelve es un fallo, con su detalle, sin lanzar excepción", async () => {
    const results = await verifySite(
      BASE,
      site({ "GET https://www.confia.ing/es?verificacion=1": () => { throw new TypeError("fetch failed"); }, "GET http://www.confia.ing/es": () => { throw new TypeError("fetch failed"); } }),
    );
    const bad = results.filter((item) => !item.ok);
    expect(bad.map((item) => item.name)).toEqual([WWW, WWW_HTTP]);
    expect(bad[0]!.detail).toMatch(/fetch failed/);
  });

  it("www que sirve la página en vez de redirigir es un fallo", async () => {
    expect(await failed({ "GET https://www.confia.ing/es?verificacion=1": () => html() })).toEqual([WWW]);
  });

  it("www que redirige a otra ruta es un fallo", async () => {
    expect(await failed({ "GET https://www.confia.ing/es?verificacion=1": () => moved("https://confia.ing/") })).toEqual([WWW]);
  });

  it("http://www admite ir directo al dominio, en un salto", async () => {
    expect(await failed({ "GET http://www.confia.ing/es": () => moved("https://confia.ing/es") })).toEqual([]);
  });

  it("http://www que se queda en www o da vueltas es un fallo", async () => {
    expect(await failed({ "GET https://www.confia.ing/es": () => html() })).toEqual([WWW_HTTP]);
    expect(await failed({ "GET https://www.confia.ing/es": () => moved("http://www.confia.ing/es") })).toEqual([WWW_HTTP]);
  });

  it("el detalle de un fallo de http://www señala el salto que se desvió", async () => {
    const results = await verifySite(BASE, site({ "GET https://www.confia.ing/es": () => moved("https://otro.example/es") }));
    const detail = results.find((item) => item.name === WWW_HTTP)!.detail!;
    expect(detail).toContain("https://www.confia.ing/es respondió 301 hacia https://otro.example/es");
    expect(detail).not.toContain("otro.example/es respondió");
  });

  it.each(["http://localhost:8787", "https://staging.confia.ing", "https://www.confia.ing"])("contra %s no comprueba la zona", async (base) => {
    const asked: string[] = [];
    const send = (async (input: string | URL | Request) => {
      asked.push(String(input));
      return new Response("no", { status: 404 });
    }) as typeof fetch;
    const results = await verifySite(base, send);
    expect(results.map((item) => item.name)).not.toContain(HTTP);
    expect(asked.every((url) => url.startsWith(base))).toBe(true);
  });
});
