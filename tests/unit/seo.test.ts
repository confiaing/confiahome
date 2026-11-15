import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { AI_CRAWLERS } from "@/lib/server/seo/ai-crawlers";
import { llmsText } from "@/lib/server/seo/llms";
import { pageMetadata } from "@/lib/server/seo/metadata";
import { robotsRules } from "@/lib/server/seo/robots";
import { sitemapEntries } from "@/lib/server/seo/sitemap";
import { homeStructuredData, serializeJsonLd } from "@/lib/server/seo/structured-data";
import { stripEmphasis } from "@/lib/emphasis";
import { readPublicEnv } from "@/lib/public-env";
import { findViolations } from "../support/claims";

const SITE = "https://confia.ing";
const LOCALES = ["es", "en"] as const;

// search-and-agent-discovery · Metadatos por idioma; Vista previa al compartir (L8-3, L8-6)
describe("metadatos", () => {
  const home = (locale: "es" | "en") => {
    const meta = getDictionary(locale).meta;
    return pageMetadata({ siteUrl: SITE, locale, routeId: "home", title: meta.homeTitle, description: meta.homeDescription, imageAlt: meta.ogAlt });
  };

  it.each(LOCALES)("home en %s: título, descripción, canónica y alternos", (locale) => {
    const meta = getDictionary(locale).meta;
    const metadata = home(locale);
    expect(metadata.title).toBe(meta.homeTitle);
    expect(metadata.description).toBe(meta.homeDescription);
    expect(metadata.alternates).toEqual({
      canonical: `${SITE}/${locale}`,
      languages: { es: `${SITE}/es`, en: `${SITE}/en`, "x-default": `${SITE}/es` },
    });
    expect(metadata.robots).toBeUndefined();
  });

  it("título y descripción son distintos en cada idioma", () => {
    expect(home("es").title).not.toBe(home("en").title);
    expect(home("es").description).not.toBe(home("en").description);
  });

  it.each(LOCALES)("en %s las descripciones miden entre 70 y 160 caracteres y no afirman nada prohibido", (locale) => {
    const meta = getDictionary(locale).meta;
    for (const key of ["homeDescription", "privacyDescription", "termsDescription"] as const) {
      expect(meta[key].length, key).toBeGreaterThanOrEqual(70);
      expect(meta[key].length, key).toBeLessThanOrEqual(160);
    }
    expect(findViolations(Object.entries(meta).map(([key, text]): [string, string] => [`meta.${key}`, text]))).toEqual([]);
  });

  it.each([
    ["es", "es_CO", "en_US"],
    ["en", "en_US", "es_CO"],
  ] as const)("home en %s: vista previa completa para redes", (locale, ogLocale, alternate) => {
    const meta = getDictionary(locale).meta;
    const metadata = home(locale);
    expect(metadata.openGraph).toEqual({
      type: "website",
      siteName: "Confia.ing",
      title: meta.homeTitle,
      description: meta.homeDescription,
      url: `${SITE}/${locale}`,
      locale: ogLocale,
      alternateLocale: [alternate],
      images: [{ url: `${SITE}/brand/og-${locale}.png`, width: 1200, height: 630, alt: meta.ogAlt, type: "image/png" }],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: meta.homeTitle,
      description: meta.homeDescription,
      images: [{ url: `${SITE}/brand/og-${locale}.png`, alt: meta.ogAlt }],
    });
  });

  it("una página legal en borrador pide no indexarse; vigente, no lo pide", () => {
    const base = { siteUrl: SITE, locale: "es" as const, routeId: "privacy" as const, title: "t", description: "d", imageAlt: "a" };
    expect(pageMetadata({ ...base, legalStatus: "draft" }).robots).toEqual({ index: false, follow: true });
    expect(pageMetadata({ ...base, legalStatus: "in-force" }).robots).toEqual({ index: true, follow: true });
    expect(pageMetadata({ ...base, legalStatus: "draft" }).alternates!.canonical).toBe(`${SITE}/es/privacidad`);
  });
});

// search-and-agent-discovery · Mapa del sitio (L8-4)
describe("mapa del sitio", () => {
  it("con las legales en borrador lista las dos homes con sus alternativas", () => {
    expect(sitemapEntries(SITE, "draft")).toEqual([
      { url: `${SITE}/es`, alternates: { languages: { es: `${SITE}/es`, en: `${SITE}/en`, "x-default": `${SITE}/es` } } },
      { url: `${SITE}/en`, alternates: { languages: { es: `${SITE}/es`, en: `${SITE}/en`, "x-default": `${SITE}/es` } } },
    ]);
  });

  it("con las legales vigentes lista las seis rutas públicas", () => {
    const entries = sitemapEntries(`${SITE}/`, "in-force");
    expect(entries.map((entry) => entry.url)).toEqual([
      `${SITE}/es`, `${SITE}/en`, `${SITE}/es/privacidad`, `${SITE}/en/privacy`, `${SITE}/es/terminos`, `${SITE}/en/terms`,
    ]);
    expect(entries[3]!.alternates!.languages).toEqual({ es: `${SITE}/es/privacidad`, en: `${SITE}/en/privacy`, "x-default": `${SITE}/es/privacidad` });
  });
});

// search-and-agent-discovery · Reglas de rastreo (L8-4, L8-7)
describe("robots", () => {
  const robots = robotsRules(SITE);
  const rules = { ...robots, rules: robots.rules as { userAgent: string | string[]; allow: string; disallow: string }[] };

  it("permite todo salvo la API y referencia el mapa con su dirección absoluta", () => {
    expect(rules.rules[0]).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(rules.sitemap).toBe(`${SITE}/sitemap.xml`);
  });

  it("nombra a los rastreadores de IA y no bloquea a ninguno", () => {
    const named = rules.rules[1]!;
    expect(named.userAgent).toEqual(AI_CRAWLERS);
    expect(named).toMatchObject({ allow: "/", disallow: "/api/" });
    for (const name of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended"]) {
      expect(AI_CRAWLERS).toContain(name);
    }
    expect(new Set(AI_CRAWLERS).size).toBe(AI_CRAWLERS.length);
    for (const rule of rules.rules) expect(rule.disallow).not.toBe("/");
  });
});

// search-and-agent-discovery · Datos estructurados (L8-5)
describe("datos estructurados", () => {
  const graph = (locale: "es" | "en") => homeStructuredData(locale, getDictionary(locale), SITE)["@graph"] as Record<string, unknown>[];
  const byType = (locale: "es" | "en", type: string) => graph(locale).filter((node) => node["@type"] === type);

  it.each(LOCALES)("en %s describe la organización y el sitio", (locale) => {
    const [organization] = byType(locale, "Organization");
    expect(organization).toMatchObject({
      "@id": `${SITE}/#organization`,
      name: "Confia.ing",
      url: SITE,
      logo: `${SITE}/brand/logo.svg`,
      email: "hola@confia.ing",
    });
    expect(organization!.contactPoint).toMatchObject({ "@type": "ContactPoint", email: "hola@confia.ing", availableLanguage: ["es", "en"] });
    const [site] = byType(locale, "WebSite");
    expect(site).toMatchObject({ url: `${SITE}/${locale}`, inLanguage: locale, publisher: { "@id": `${SITE}/#organization` } });
  });

  it.each(LOCALES)("en %s los servicios son los de la página, con sus textos", (locale) => {
    const offer = getDictionary(locale).home.offer;
    const expected = [offer.main, ...offer.rest].map((item) => ({ name: stripEmphasis(item.title).replace(/\.$/, ""), description: item.text }));
    expect(byType(locale, "Service").map((service) => ({ name: service.name, description: service.description }))).toEqual(expected);
    for (const service of byType(locale, "Service")) expect(service.provider).toEqual({ "@id": `${SITE}/#organization` });
  });

  it.each(LOCALES)("en %s no hay nada que no esté aprobado", (locale) => {
    const data = homeStructuredData(locale, getDictionary(locale), SITE);
    const keys = new Set<string>();
    const strings: [string, string][] = [];
    const walk = (value: unknown, path: string): void => {
      if (typeof value === "string") strings.push([path, value]);
      else if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}.${index}`));
      else if (value && typeof value === "object") for (const [key, inner] of Object.entries(value)) {
        keys.add(key);
        walk(inner, `${path}.${key}`);
      }
    };
    walk(data, "jsonld");
    for (const banned of ["aggregateRating", "review", "award", "priceRange", "offers", "price", "address", "telephone", "sameAs", "areaServed", "founder", "numberOfEmployees", "foundingDate"]) {
      expect(keys.has(banned), banned).toBe(false);
    }
    const texts = strings.filter(([path]) => /\.(name|description)$/.test(path));
    expect(findViolations(texts)).toEqual([]);
    expect(JSON.stringify(data)).not.toContain("*");
  });

  it("un texto con marcado no puede cerrar la etiqueta ni alterar la página", () => {
    const html = serializeJsonLd({ name: "</script><script>alert(1)</script>", other: "a < b > c & d" });
    expect(html).not.toMatch(/<\/?script/i);
    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toEqual({ name: "</script><script>alert(1)</script>", other: "a < b > c & d" });
  });
});

// search-and-agent-discovery · Resumen en texto plano para agentes (L8-7)
describe("llms.txt", () => {
  const text = llmsText(SITE);

  it("empieza con el título y un resumen, y trae las dos lenguas", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("# Confia.ing");
    expect(lines.find((line) => line.startsWith("> "))).toBeTruthy();
    expect(text).toContain("## Español");
    expect(text).toContain("## English");
    expect(text.endsWith("\n")).toBe(true);
  });

  it.each(LOCALES)("en %s nombra cada servicio y cada etapa con el texto de la página, en orden", (locale) => {
    const { offer, journey } = getDictionary(locale).home;
    let cursor = 0;
    for (const item of [offer.main, ...offer.rest]) {
      const at = text.indexOf(stripEmphasis(item.title).replace(/\.$/, ""), cursor);
      expect(at, item.title).toBeGreaterThanOrEqual(0);
    }
    for (const stage of journey.stages) {
      const at = text.indexOf(stage.name, cursor);
      expect(at, stage.name).toBeGreaterThan(cursor);
      expect(text).toContain(stage.gets);
      cursor = at;
    }
    expect(journey.stages).toHaveLength(5);
  });

  it("da las dos vías de contacto y enlaza a las páginas de ambos idiomas", () => {
    expect(text).toContain("hola@confia.ing");
    expect(text).toContain(`${SITE}/es#agenda`);
    expect(text).toContain(`${SITE}/en#agenda`);
    expect(text).toContain(`${SITE}/es#consulta`);
    expect(text).toContain(`](${SITE}/es)`);
    expect(text).toContain(`](${SITE}/en)`);
  });

  it("describe la conversación de 30 minutos como exploratoria, igual que la página", () => {
    for (const locale of LOCALES) expect(text).toContain(getDictionary(locale).home.actions.note);
  });

  it("no afirma nada que la página no pueda afirmar, ni lleva marcas de énfasis", () => {
    const entries = text.split("\n").filter((line) => line.trim() !== "").map((line, index): [string, string] => [`llms.${index}`, line]);
    // Las etiquetas de etapa llevan su número, como en la página.
    const violations = findViolations(entries).filter((violation) => violation.rule !== "número fuera de la lista admitida");
    expect(violations).toEqual([]);
    expect(text).not.toMatch(/\*[^*\s][^*]*\*/);
  });
});

// search-and-agent-discovery · Dirección pública correcta
describe("dirección pública", () => {
  it("todas las direcciones generadas cuelgan de la dirección del sitio que reciben, con o sin barra final", () => {
    for (const site of ["https://ejemplo.test", "https://ejemplo.test/"]) {
      const urls = [
        ...sitemapEntries(site, "in-force").map((entry) => entry.url),
        String(robotsRules(site).sitemap),
        ...(homeStructuredData("es", getDictionary("es"), site)["@graph"] as { url?: string }[]).flatMap((node) => (node.url ? [node.url] : [])),
        ...[...llmsText(site).matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]!),
      ];
      expect(urls.length).toBeGreaterThan(12);
      for (const url of urls) expect(url).toMatch(/^https:\/\/ejemplo\.test(\/[^/]|$)/);
    }
  });

  it("la dirección definida en el entorno gana a la de por defecto", () => {
    expect(readPublicEnv({ NEXT_PUBLIC_SITE_URL: "https://otro.test" }).siteUrl).toBe("https://otro.test");
  });

  it("llms.txt abre con el resumen en los dos idiomas", () => {
    const quotes = llmsText(SITE).split("\n").filter((line) => line.startsWith("> "));
    expect(quotes).toEqual([`> ${getDictionary("es").meta.homeDescription}`, `> ${getDictionary("en").meta.homeDescription}`]);
  });
});
