import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const NARROW = { width: 375, height: 812 };
const WIDE = { width: 1280, height: 800 };

// site-navigation · Enlace para saltar al contenido (L2-4)
test("el primer tabulador lleva a «Saltar al contenido» y Enter, al contenido", async ({ page, browserName }) => {
  await page.goto("/es");
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#contenido")).toBeFocused();
});

// site-navigation · Marco accesible en todas las páginas
for (const path of ["/es", "/en/privacy", "/es/terminos"]) {
  test(`${path}: un solo banner, main y contentinfo`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });
}

// site-navigation · Menú desplegable en pantallas estrechas (L2-4)
test.describe("menú en 375 px", () => {
  test.use({ viewport: NARROW });

  test("cerrado, sus enlaces no reciben foco; abierto, Escape lo cierra y devuelve el foco", async ({ page, browserName }) => {
    await page.goto("/es");
    const toggle = page.getByRole("button", { name: "Menú" });
    const agenda = page.getByRole("banner").getByRole("link", { name: /Agenda 30 minutos/ });
    await expect(toggle).toBeVisible();
    await expect(agenda).toBeHidden();

    // Recorrido con tabulador: tras el logo y el botón se sale de la cabecera.
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    const visited: string[] = [];
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press(tab);
      visited.push(await page.evaluate(() => (document.activeElement?.closest("#site-nav") ? "nav" : "otro")));
    }
    expect(visited).not.toContain("nav");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(agenda).toBeVisible();
    await expect(page.getByRole("link", { name: "Dónde empezamos" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(agenda).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("al ensanchar la ventana con el menú abierto, deja de estar «abierto»", async ({ page }) => {
    await page.goto("/es");
    const toggle = page.getByRole("button", { name: "Menú" });
    await toggle.click();
    await page.setViewportSize(WIDE);
    await expect(toggle).toBeHidden();
    await page.setViewportSize(NARROW);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("el menú aparece sin animación ni desplazamiento, también con movimiento reducido", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await page.getByRole("button", { name: "Menú" }).click();
    const motion = await page.locator("#site-nav").evaluate((nav) => {
      const style = getComputedStyle(nav);
      return { animation: style.animationName, transform: style.transform, translate: style.translate };
    });
    expect(motion).toEqual({ animation: "none", transform: "none", translate: "none" });
  });
});

test("en 1280 px la navegación está a la vista y no hay botón de menú", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/en");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: /Book 30 minutes/ })).toBeVisible();
  await expect(banner.getByRole("link", { name: "Where we start" })).toBeVisible();
  await expect(banner.getByRole("group", { name: "Language" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
});

test("la cabecera sigue visible al desplazarse", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/es");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole("banner")).toBeInViewport();
});

// site-navigation · Sin JavaScript
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: NARROW });

  test("anclas, selector y agenda están visibles en 375 px", async ({ page }) => {
    await page.goto("/es");
    const banner = page.locator("header");
    await expect(banner.getByRole("link", { name: "Dónde empezamos" })).toBeVisible();
    await expect(banner.getByRole("link", { name: /Agenda 30 minutos/ })).toBeVisible();
    await expect(banner.getByRole("group", { name: "Idioma" })).toBeVisible();
    await expect(page.locator("#site-nav-toggle")).toBeHidden();
    // Desplegada ocupa media pantalla: no debe quedarse fija al desplazarse.
    expect(await page.locator("header").evaluate((header) => getComputedStyle(header).position)).toBe("static");
  });

  test("la página 404 se lee completa", async ({ page }) => {
    await page.goto("/es/no-existe");
    await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
  });

  // locale-routing · Cambio manual de idioma, sin JavaScript
  test("cambiar de idioma funciona y se recuerda", async ({ page, context }) => {
    await page.goto("/es/privacidad");
    await page.locator("header").getByRole("link", { name: /EN/ }).click();
    await expect(page).toHaveURL(/\/en\/privacy$/);
    const cookie = (await context.cookies()).find((item) => item.name === "locale");
    expect(cookie?.value).toBe("en");
  });
});

// site-navigation · Sin infracciones
for (const [name, viewport] of [["375 px", NARROW], ["1280 px", WIDE]] as const) {
  for (const path of ["/es", "/en"]) {
    test(`${path} en ${name}: axe sin infracciones, menú cerrado y abierto`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      const toggle = page.locator("#site-nav-toggle");
      if (await toggle.isVisible()) {
        await toggle.click();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
    });
  }
}

// locale-routing · La URL manda, cambio manual y persistencia (L2-1, L2-2)
test("cambiar de idioma lleva a la página equivalente y se recuerda al volver a /", async ({ page, context }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es/privacidad");
  await page.getByRole("banner").getByRole("link", { name: /EN/ }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  const cookie = (await context.cookies()).find((item) => item.name === "locale");
  expect(cookie).toMatchObject({ value: "en", path: "/", sameSite: "Lax", httpOnly: true });
  expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(360 * 24 * 3600);

  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("el selector del pie también cambia de idioma", async ({ page }) => {
  await page.goto("/en/terms");
  await page.getByRole("contentinfo").getByRole("link", { name: /ES/ }).click();
  await expect(page).toHaveURL(/\/es\/terminos$/);
});

test("entrar directo a /en nunca redirige, diga lo que diga la cookie o el navegador", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-CO", baseURL: test.info().project.use.baseURL });
  await context.addCookies([{ name: "locale", value: "es", url: test.info().project.use.baseURL! }]);
  const page = await context.newPage();
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await context.close();
});

test("la raíz sigue el idioma del navegador cuando no hay cookie", async ({ browser }) => {
  for (const [locale, expected] of [["en-US", /\/en$/], ["fr-FR", /\/es$/], ["es-CO", /\/es$/]] as const) {
    const context = await browser.newContext({ locale, baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(expected);
    await context.close();
  }
});

// locale-routing · Metadatos por idioma
test("cada página declara canónica y alternos hacia su equivalente", async ({ page }) => {
  const alternates = async (path: string) => {
    await page.goto(path);
    return page.evaluate(() => ({
      canonical: new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).pathname,
      languages: Object.fromEntries(
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map((link) => [
          link.hreflang,
          new URL(link.href).pathname,
        ]),
      ),
    }));
  };
  expect(await alternates("/en")).toEqual({ canonical: "/en", languages: { es: "/es", en: "/en", "x-default": "/es" } });
  expect(await alternates("/es/privacidad")).toEqual({
    canonical: "/es/privacidad",
    languages: { es: "/es/privacidad", en: "/en/privacy", "x-default": "/es/privacidad" },
  });
});

// legal-pages (L2-7)
for (const [path, lang, title, draft] of [
  ["/es/privacidad", "es", "Política de privacidad", /borrador pendiente de revisión legal/],
  ["/en/privacy", "en", "Privacy policy", /draft pending legal review/],
  ["/es/terminos", "es", "Términos y condiciones", /borrador pendiente de revisión legal/],
  ["/en/terms", "en", "Terms and conditions", /draft pending legal review/],
] as const) {
  test(`${path} responde 200 con título, aviso de borrador y noindex`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText(draft)).toBeVisible();
    await expect(page).toHaveTitle(`${title} · Confia.ing`);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

for (const path of ["/es/privacy", "/en/terminos"]) {
  test(`${path} (idioma y slug cruzados) responde 404`, async ({ request }) => {
    expect((await request.get(path)).status()).toBe(404);
  });
}

// not-found-page (L2-6): una sola página 404, bilingüe, completa en el HTML.
const NOT_FOUND_PATHS = ["/en/no-existe", "/es/no-existe", "/es/a/b/c", "/es/privacy", "/fr", "/cualquier-cosa"];

for (const path of NOT_FOUND_PATHS) {
  test(`${path}: 404 con el HTML completo, sin depender de JavaScript`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('<html lang="es"');
    expect(html).toContain("No encontramos esta página");
    expect(html).toContain("We couldn&#x27;t find this page");
    expect(html).toContain('href="/es"');
    expect(html).toContain('href="/en"');
    expect(html.match(/<meta name="robots" content="[^"]*noindex/g)).toHaveLength(1);
  });
}

for (const path of ["/en/no-existe", "/fr"]) {
  test(`${path}: cada mensaje va marcado con su idioma y enlaza a su home`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const spanish = page.locator('section[lang="es"]');
    const english = page.locator('section[lang="en"]');
    await expect(spanish.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    await expect(english.getByRole("heading", { name: "We couldn't find this page" })).toBeVisible();
    await expect(spanish.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/es");
    await expect(english.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    await expect(page.getByRole("link", { name: "Confia.ing" })).toHaveAttribute("href", "/");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

// translations · Ningún texto en español en la versión inglesa.
// Las frases salen de los diccionarios: toda la que difiere entre idiomas.
const SPANISH_ONLY = (() => {
  const leaves = (value: unknown): string[] =>
    typeof value === "string" ? [value] : Object.values(value as object).flatMap(leaves);
  const english = new Set(leaves(getDictionary("en")));
  return leaves(getDictionary("es")).filter((phrase) => !english.has(phrase));
})();

for (const path of ["/en", "/en/privacy", "/en/terms"]) {
  test(`${path} no muestra frases del diccionario español`, async ({ page }) => {
    expect(SPANISH_ONLY.length).toBeGreaterThan(15);
    await page.goto(path);
    const text = await page.locator("body").innerText();
    for (const phrase of SPANISH_ONLY) expect(text, phrase).not.toContain(phrase);
  });
}

// site-navigation · El marco no rompe los presupuestos
test("CLS < 0,1 en móvil simulado con el marco", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "layout-shift y la limitación de red solo existen en Chromium");
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  await context.close();
  console.log(`CLS de /es con el marco, móvil simulado: ${cls.toFixed(4)}`);
  expect(cls).toBeLessThan(0.1);
});
