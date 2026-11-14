import { devices, expect, test } from "@playwright/test";
import { contrastRatio } from "../support/contrast";

const LOCALES = ["es", "en"] as const;

function toHex(rgb: string): string {
  const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
  return "#" + [r!, g!, b!].map((value) => value.toString(16).padStart(2, "0")).join("");
}

// typography · Fuentes servidas desde el propio dominio (L1-3)
for (const locale of LOCALES) {
  test(`/${locale}: las fuentes salen del propio origen y ninguna de terceros`, async ({ page, baseURL }) => {
    const fonts: string[] = [];
    const all: string[] = [];
    page.on("request", (request) => {
      all.push(request.url());
      if (request.resourceType() === "font") fonts.push(request.url());
    });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);

    expect(fonts.length).toBeGreaterThanOrEqual(3);
    for (const url of fonts) expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
    expect(all.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
  });
}

// typography · Tres familias con respaldo declarado. Aquí se comprueba que la fuente
// declarada está cargada; que contiene cada acento lo comprueba tests/unit/fonts.test.ts.
test("título, texto y etiqueta usan Fraunces, Figtree y DM Mono, ya cargadas", async ({ page }) => {
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);

  const sample = "Capacitación · Diagnóstico · ¿Dónde?";
  const cases = [
    ["h1", /fraunces/i],
    ["#hero-title + p", /figtree/i], // el texto del hero
    ["main#contenido p", /dm.?mono/i], // el antetítulo del hero

  ] as const;

  for (const [selector, family] of cases) {
    const result = await page.locator(selector).first().evaluate(async (element, text) => {
      const stack = getComputedStyle(element).fontFamily.split(",").map((part) => part.trim().replace(/["']/g, ""));
      const loaded = await document.fonts.load(`1em "${stack[0]}"`, text);
      return { stack, loaded: loaded.map((face) => face.status) };
    }, sample);

    expect(result.stack[0], selector).toMatch(family);
    expect(result.stack.length, `${selector} declara respaldo`).toBeGreaterThanOrEqual(2);
    expect(result.loaded.length, `${selector} tiene la fuente declarada`).toBeGreaterThanOrEqual(1);
    expect(result.loaded.every((status) => status === "loaded")).toBe(true);
  }
});

// typography · Sin salto de diseño al cargar las fuentes
test("solo se precargan las dos fuentes del primer pantallazo", async ({ page }) => {
  await page.goto("/es");
  const preloads = await page
    .locator('link[rel="preload"][as="font"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href.split("/").pop()!));
  // Títulos y texto. La cursiva y DM Mono llegan después.
  expect(preloads).toHaveLength(2);
  expect(preloads.some((file) => file.startsWith("fraunces") && !file.includes("italic"))).toBe(true);
  expect(preloads.some((file) => file.startsWith("figtree"))).toBe(true);
});

test("el diseño no salta al cargar las fuentes (CLS < 0,1 en móvil simulado)", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "layout-shift y la limitación de red solo existen en Chromium");
  const context = await browser.newContext({ ...devices["Pixel 7"] });
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
  console.log(`CLS de /es en móvil simulado con red limitada: ${cls.toFixed(4)}`);
  expect(cls).toBeLessThan(0.1);
});

// brand-identity · Icono del sitio
for (const locale of LOCALES) {
  test(`/${locale}: los iconos declarados y /favicon.ico responden 200`, async ({ page, request }) => {
    await page.goto(`/${locale}`);
    const svgIcon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute("href");
    const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    expect(svgIcon).toBe("/brand/favicon.svg");
    expect(appleIcon).toBe("/brand/apple-touch-icon.png");
    for (const path of [svgIcon!, appleIcon!, "/favicon.ico"]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });
}

// brand-identity · Logo en la página
test("el logo se ve con sus cinco tramos y su nombre accesible", async ({ page }) => {
  await page.goto("/es");
  const logo = page.getByRole("banner").getByRole("img", { name: "Confia.ing, inicio" });
  await expect(logo).toBeVisible();
  await expect(logo.locator("[data-segment]")).toHaveCount(5);
});

// design-tokens · Un cambio de rol se refleja sin tocar el componente (L1-1)
test("cambiar --color-primary cambia el botón sin tocar su código", async ({ page }) => {
  await page.goto("/es");
  const cta = page.locator("main#contenido a").first();
  const before = toHex(await cta.evaluate((element) => getComputedStyle(element).backgroundColor));
  expect(before).toBe("#ff6b4a");
  await page.evaluate(() => document.body.style.setProperty("--color-primary", "var(--indigo-700)"));
  await page.waitForTimeout(350);
  const after = toHex(await cta.evaluate((element) => getComputedStyle(element).backgroundColor));
  expect(after).toBe("#2d3380");
});

// ui-components · Foco visible por teclado (L1-5)
test("el botón muestra un anillo de foco con contraste suficiente", async ({ page, browserName }) => {
  await page.goto("/es");
  // Se llega con teclado (en WebKit, como en Safari, los enlaces se recorren con Opción + Tab)
  // y el foco pasa al botón: así el navegador lo trata como foco de teclado.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await page.locator("main#contenido a").first().focus();
  const cta = page.locator("main#contenido a").first();
  await expect(cta).toBeFocused();
  const style = await cta.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      style: computed.outlineStyle,
      width: computed.outlineWidth,
      color: computed.outlineColor,
      page: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(style.style).toBe("solid");
  expect(style.width).toBe("3px");
  expect(contrastRatio(toHex(style.color), toHex(style.page))).toBeGreaterThanOrEqual(3);
});

// ui-components · Accesibilidad y movimiento de los componentes base
test("al pulsar, el botón se desplaza; con movimiento reducido, no", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "el estado :active con ratón se comprueba en escritorio");
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto("/es");
    const cta = page.locator("main#contenido a").first();
    await cta.scrollIntoViewIfNeeded();
    const box = (await cta.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    const translate = await cta.evaluate((element) => getComputedStyle(element).translate);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await context.close();
    if (reducedMotion === "reduce") expect(translate).toBe("none");
    else expect(translate).not.toBe("none");
  }
});

// design-tokens · Temas por banda, en un navegador real
test("los temas cambian los colores, se anidan y ceden ante una utilidad", async ({ page }) => {
  await page.goto("/es");
  const colors = await page.evaluate(() => {
    const cta = document.querySelector("main#contenido a")!;
    const host = document.createElement("div");
    host.innerHTML = `
      <div class="theme-dark" id="dark">
        <span id="dark-link"></span>
        <div class="theme-light" id="nested"></div>
      </div>
      <div class="theme-coral" id="coral"></div>
      <div class="theme-dark bg-surface" id="override"></div>`;
    document.body.append(host);
    const anchor = document.createElement("a");
    anchor.href = "#";
    document.getElementById("dark-link")!.append(anchor);
    document.getElementById("coral")!.append(cta.cloneNode(true));
    const style = (element: Element) => getComputedStyle(element);
    return {
      darkBackground: style(document.getElementById("dark")!).backgroundColor,
      darkText: style(document.getElementById("dark")!).color,
      darkLink: style(anchor).color,
      nestedBackground: style(document.getElementById("nested")!).backgroundColor,
      nestedText: style(document.getElementById("nested")!).color,
      coralButton: style(document.querySelector("#coral a")!).backgroundColor,
      coralButtonText: style(document.querySelector("#coral a")!).color,
      override: style(document.getElementById("override")!).backgroundColor,
    };
  });
  expect(toHex(colors.darkBackground)).toBe("#1b1f4b");
  expect(toHex(colors.darkText)).toBe("#fbf5ea");
  expect(toHex(colors.darkLink)).toBe("#ffd979");
  expect(toHex(colors.nestedBackground)).toBe("#fbf5ea");
  expect(toHex(colors.nestedText)).toBe("#1b1f4b");
  // En la banda coral la acción principal pasa a índigo con texto crema.
  expect(toHex(colors.coralButton)).toBe("#1b1f4b");
  expect(toHex(colors.coralButtonText)).toBe("#fbf5ea");
  // Una utilidad en el mismo elemento puede más que el fondo del tema.
  expect(toHex(colors.override)).toBe("#2d3380");
});
