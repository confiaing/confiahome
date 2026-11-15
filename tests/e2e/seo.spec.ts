import { expect, test } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

// El build de las E2E no define la dirección pública: en producción es https://confia.ing.
const SITE = "https://confia.ing";
const LOCALES = ["es", "en"] as const;

// search-and-agent-discovery · Metadatos por idioma; Vista previa al compartir (L8-3, L8-6)
for (const locale of LOCALES) {
  test(`${locale}: el HTML servido trae título, descripción, canónica, alternos y vista previa`, async ({ page, request }) => {
    const meta = getDictionary(locale).meta;
    await page.goto(`/${locale}`);
    await expect(page).toHaveTitle(meta.homeTitle);
    const content = (selector: string) => page.locator(selector).getAttribute("content");
    expect(await content('meta[name="description"]')).toBe(meta.homeDescription);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`${SITE}/${locale}`);
    for (const [lang, path] of [["es", "/es"], ["en", "/en"], ["x-default", "/es"]] as const) {
      expect(await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href")).toBe(SITE + path);
    }
    expect(await content('meta[property="og:type"]')).toBe("website");
    expect(await content('meta[property="og:site_name"]')).toBe("Confia.ing");
    expect(await content('meta[property="og:title"]')).toBe(meta.homeTitle);
    expect(await content('meta[property="og:description"]')).toBe(meta.homeDescription);
    expect(await content('meta[property="og:url"]')).toBe(`${SITE}/${locale}`);
    expect(await content('meta[property="og:locale"]')).toBe(locale === "es" ? "es_CO" : "en_US");
    expect(await content('meta[property="og:image"]')).toBe(`${SITE}/brand/og-${locale}.png`);
    expect(await content('meta[property="og:image:width"]')).toBe("1200");
    expect(await content('meta[property="og:image:height"]')).toBe("630");
    expect(await content('meta[property="og:image:alt"]')).toBe(meta.ogAlt);
    expect(await content('meta[name="twitter:card"]')).toBe("summary_large_image");
    // La home se indexa: no lleva ninguna instrucción en contra.
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    // Todo esto está en el HTML servido, no lo pone un script.
    const html = await (await request.get(`/${locale}`)).text();
    expect(html).toContain(`<meta name="description" content="${meta.homeDescription}"`);
    expect(html).toContain('property="og:image"');
  });

  test(`${locale}: la imagen para redes existe y mide lo que declara`, async ({ request }) => {
    const response = await request.get(`/brand/og-${locale}.png`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const png = await response.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(png.byteLength).toBeLessThan(300_000);
  });

  // search-and-agent-discovery · Datos estructurados (L8-5)
  test(`${locale}: el JSON-LD de la home se puede analizar y describe organización, sitio y servicios`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks).toHaveLength(1);
    const data = JSON.parse(blocks[0]!) as { "@context": string; "@graph": Record<string, unknown>[] };
    expect(data["@context"]).toBe("https://schema.org");
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types.filter((type) => type === "Organization")).toHaveLength(1);
    expect(types.filter((type) => type === "WebSite")).toHaveLength(1);
    const offer = getDictionary(locale).home.offer;
    expect(types.filter((type) => type === "Service")).toHaveLength(1 + offer.rest.length);
    const organization = data["@graph"].find((node) => node["@type"] === "Organization")!;
    expect(organization).toMatchObject({ name: "Confia.ing", url: SITE, email: "hola@confia.ing" });
    // Lo que dice el JSON-LD se puede leer también en la página.
    for (const service of data["@graph"].filter((node) => node["@type"] === "Service")) {
      await expect(page.locator("main")).toContainText(String(service.description));
    }
  });
}

test("las páginas legales no llevan datos estructurados de la home", async ({ page }) => {
  await page.goto("/es/privacidad");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

// search-and-agent-discovery · Mapa del sitio; Reglas de rastreo (L8-4, L8-7)
test("sitemap.xml lista las dos homes con sus alternativas, y no las legales en borrador", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("xml");
  const xml = await response.text();
  expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toEqual([`${SITE}/es`, `${SITE}/en`]);
  for (const lang of ["es", "en", "x-default"]) expect(xml).toContain(`hreflang="${lang}"`);
  expect(xml).not.toMatch(/privacidad|privacy|terminos|terms|localhost/);
});

test("robots.txt permite el rastreo salvo la API, nombra a los rastreadores de IA y da el mapa", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const text = await response.text();
  const groups = text.trim().split(/\n\s*\n/);
  expect(groups[0]).toMatch(/^User-Agent: \*\nAllow: \/\nDisallow: \/api\/$/i);
  for (const name of ["GPTBot", "OAI-SearchBot", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended"]) {
    expect(text).toMatch(new RegExp(`User-Agent: ${name}\\b`, "i"));
  }
  expect(text).not.toMatch(/^Disallow: \/$/im);
  expect(text).toMatch(new RegExp(`Sitemap: ${SITE}/sitemap\\.xml`, "i"));
});

// search-and-agent-discovery · Resumen en texto plano para agentes (L8-7)
test("llms.txt resume el sitio en texto plano, en los dos idiomas", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const text = await response.text();
  expect(text.startsWith("# Confia.ing\n")).toBe(true);
  for (const locale of LOCALES) {
    const { journey, actions } = getDictionary(locale).home;
    for (const stage of journey.stages) expect(text).toContain(stage.name);
    expect(text).toContain(actions.note);
    expect(text).toContain(`${SITE}/${locale}#agenda`);
  }
  expect(text).toContain("hola@confia.ing");
  expect(text).not.toContain("localhost");
});
