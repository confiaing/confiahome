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
    ...overrides,
  };
  return (async (input: string | URL | Request, init: RequestInit = {}) => {
    const key = `${init.method ?? "GET"} ${new URL(String(input)).pathname}`;
    return (routes[key] ?? (() => new Response("no", { status: 404 })))();
  }) as typeof fetch;
}
const failed = async (overrides: Record<string, () => Response>) => (await verifySite(BASE, site(overrides))).filter((item) => !item.ok).map((item) => item.name);

// production-release · Verificación tras el despliegue (L10-3)
describe("verificación de un sitio desplegado", () => {
  it("un sitio correcto pasa todas las comprobaciones", async () => {
    const results = await verifySite(BASE, site());
    expect(results.filter((item) => !item.ok)).toEqual([]);
    expect(results).toHaveLength(21);
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
