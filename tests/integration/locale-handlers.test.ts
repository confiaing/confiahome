// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET as switchLocale } from "@/app/api/locale/route";
import { GET as root } from "@/app/route";

const ORIGIN = "https://confia.ing";

function request(path: string, headers: Record<string, string> = {}, origin = ORIGIN): Request {
  return new Request(origin + path, { headers });
}

// La redirección es relativa: se resuelve contra el sitio y se comprueba que no sale de él.
const target = (response: Response) => {
  const raw = response.headers.get("location")!;
  expect(raw.startsWith("/") && !raw.startsWith("//")).toBe(true);
  const location = new URL(raw, ORIGIN);
  return { origin: location.origin, path: location.pathname + location.search };
};

// locale-routing · La raíz lleva al idioma del visitante (L2-1)
describe("GET /", () => {
  it.each([
    ["navegador en inglés", { "accept-language": "en-US,en;q=0.9" }, "/en"],
    ["idioma no admitido", { "accept-language": "fr-FR" }, "/es"],
    ["la cookie manda sobre el navegador", { cookie: "locale=en", "accept-language": "es" }, "/en"],
    ["sin cabecera ni cookie", {}, "/es"],
    ["cookie con un valor no admitido", { cookie: "locale=fr", "accept-language": "en" }, "/en"],
  ] as const)("%s", async (_name, headers, expected) => {
    const response = await root(request("/", headers));
    expect(response.status).toBe(307);
    expect(target(response)).toEqual({ origin: ORIGIN, path: expected });
  });

  it("conserva la consulta de la URL y sigue siendo una ruta relativa", async () => {
    const response = await root(request("/?utm_source=boletin&x=%2F%2Fotro.sitio", { "accept-language": "en" }));
    expect(response.headers.get("location")).toBe("/en?utm_source=boletin&x=%2F%2Fotro.sitio");
  });

  it("con la cookie repetida vale el primer idioma admitido", async () => {
    const response = await root(request("/", { cookie: "locale=fr; locale=en", "accept-language": "es" }));
    expect(target(response).path).toBe("/en");
  });

  it("no se guarda en cachés compartidas y varía por idioma y cookie", async () => {
    const response = await root(request("/"));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")?.toLowerCase()).toContain("accept-language");
    expect(response.headers.get("vary")?.toLowerCase()).toContain("cookie");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

// locale-routing · Cambio manual de idioma (L2-2)
describe("GET /api/locale", () => {
  it.each([
    ["/es/privacidad", "en", "/en/privacy"],
    ["/en/terms", "es", "/es/terminos"],
    ["/es", "en", "/en"],
    ["/es/no-existe", "en", "/en"],
  ] as const)("desde %s a %s lleva a %s", async (from, to, expected) => {
    const response = await switchLocale(request(`/api/locale?to=${to}`, { referer: ORIGIN + from }));
    expect(response.status).toBe(307);
    expect(target(response)).toEqual({ origin: ORIGIN, path: expected });
  });

  it("guarda la elección un año, para todo el sitio y solo por HTTPS", async () => {
    const response = await switchLocale(request("/api/locale?to=en", { referer: `${ORIGIN}/es` }));
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toMatch(/^locale=en;/);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:3100"])("en local (%s) la cookie no lleva Secure", async (local) => {
    const response = await switchLocale(request("/api/locale?to=en", { referer: `${local}/es` }, local));
    expect(response.headers.get("set-cookie")).not.toContain("Secure");
  });

  it("fuera de local lleva Secure aunque el Worker vea la petición por HTTP", async () => {
    const response = await switchLocale(
      new Request("http://confia.ing/api/locale?to=en", { headers: { referer: "https://confia.ing/es" } }),
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("reconoce el origen por la cabecera Host cuando el Worker ve otro host", async () => {
    const response = await switchLocale(
      new Request("http://interno:8787/api/locale?to=en", {
        headers: { host: "confia.ing", referer: `${ORIGIN}/es/terminos` },
      }),
    );
    expect(target(response).path).toBe("/en/terms");
    expect(response.headers.get("set-cookie")).toMatch(/^locale=en;/);
  });

  it("sin origen conocido lleva a la home del idioma elegido", async () => {
    const response = await switchLocale(request("/api/locale?to=en"));
    expect(target(response)).toEqual({ origin: ORIGIN, path: "/en" });
  });

  // locale-routing · El cambio de idioma no redirige fuera del sitio
  it.each([
    "https://otro.sitio/es/privacidad",
    "//otro.sitio/es",
    "no es una url",
  ])("un origen ajeno (%s) nunca saca del sitio", async (referer) => {
    const response = await switchLocale(request("/api/locale?to=en", { referer }));
    expect(target(response)).toEqual({ origin: ORIGIN, path: "/en" });
  });

  it("ignora un destino indicado en la URL", async () => {
    const response = await switchLocale(
      request("/api/locale?to=en&from=https://otro.sitio/&next=//otro.sitio&redirect=https://otro.sitio"),
    );
    expect(target(response)).toEqual({ origin: ORIGIN, path: "/en" });
  });

  it.each(["fr", "", "EN", "en/../.."])("un idioma no admitido (%s) no guarda cookie y lleva a /", async (to) => {
    const response = await switchLocale(request(`/api/locale?to=${encodeURIComponent(to)}`, { referer: `${ORIGIN}/es` }));
    expect(response.status).toBe(307);
    expect(target(response)).toEqual({ origin: ORIGIN, path: "/" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
