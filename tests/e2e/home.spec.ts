import { devices, expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const NARROW = { width: 375, height: 812 };
const WIDE = { width: 1280, height: 800 };
const es = getDictionary("es").home;

/** Fondo que realmente se ve detrás de un elemento: sube hasta encontrar uno opaco. */
async function backgrounds(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        const color = getComputedStyle(node).backgroundColor;
        const [r, g, b, alpha = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
        if (alpha !== 0) return "#" + [r!, g!, b!].map((value) => value.toString(16).padStart(2, "0")).join("");
      }
      return "none";
    }),
  );
}

// home-page · Ritmo de secciones (L3-8)
for (const locale of ["es", "en"] as const) test(`/${locale}: las secciones alternan crema y banda de color`, async ({ page }) => {
  await page.goto(`/${locale}`);
  expect(await backgrounds(page, "main > section")).toEqual([
    "#fbf5ea", // hero · crema
    "#bfd8c2", // dónde empezamos · salvia
    "#fbf5ea", // etapas · crema
    "#ff8566", // lo que ofrecemos · coral claro
    "#fbf5ea", // por qué confiar · crema
    "#d9dbf0", // cierre · índigo claro
  ]);
  expect(await backgrounds(page, "main .theme-warm")).toEqual(["#ffd979"]);
  expect(await backgrounds(page, '[data-offer="main"]')).toEqual(["#1b1f4b"]);
  expect(await backgrounds(page, "footer")).toEqual(["#1b1f4b"]);
});

for (const [name, viewport] of [["375 px", NARROW], ["1280 px", WIDE]] as const) {
  test(`a ${name} las bandas no tocan los bordes y tienen esquinas redondeadas`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/es");
    const bands = await page.locator("main > section[data-band]").evaluateAll((sections) =>
      sections.map((section) => {
        const box = section.getBoundingClientRect();
        return {
          left: box.left,
          right: document.documentElement.clientWidth - box.right,
          radius: parseFloat(getComputedStyle(section).borderTopLeftRadius),
        };
      }),
    );
    expect(bands).toHaveLength(3);
    for (const band of bands) {
      expect(band.left).toBeGreaterThanOrEqual(8);
      expect(band.right).toBeGreaterThanOrEqual(8);
      expect(band.radius).toBeGreaterThanOrEqual(28);
    }
    const plain = await page.locator("main > section:not([data-band])").evaluateAll((sections) =>
      sections.map((section) => parseFloat(getComputedStyle(section).borderTopLeftRadius)),
    );
    expect(plain).toEqual([0, 0, 0]);
  });
}

// home-page · Servicios con jerarquía (L3-3)
test("la tarjeta del servicio principal domina a las demás", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es");
  const cards = await page.locator("main article").filter({ has: page.locator("h3") }).evaluateAll((articles) =>
    articles
      .filter((article) => article.closest('[data-band="coral"]'))
      .map((article) => {
        const box = article.getBoundingClientRect();
        return {
          main: article.getAttribute("data-offer") === "main",
          area: box.width * box.height,
          title: parseFloat(getComputedStyle(article.querySelector("h3")!).fontSize),
          top: box.top,
        };
      }),
  );
  expect(cards).toHaveLength(5);
  const [main, ...rest] = cards as [(typeof cards)[number], ...typeof cards];
  expect(main.main).toBe(true);
  for (const card of rest) {
    expect(main.area).toBeGreaterThan(card.area * 2);
    expect(main.title).toBeGreaterThan(card.title * 2);
    expect(main.top).toBeLessThan(card.top);
  }
  // Los cuatro subordinados comparten fila: ninguno destaca sobre otro.
  expect(new Set(rest.map((card) => Math.round(card.top))).size).toBe(1);
});

for (const [width, columns] of [[639, 1], [700, 2], [1099, 2], [1100, 4], [1280, 4]] as const) {
  test(`a ${width} px los servicios subordinados van en ${columns} columna(s)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/es");
    const lefts = await page
      .locator('[data-band="coral"] ul > li')
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().left)));
    expect(lefts).toHaveLength(4);
    expect(new Set(lefts).size).toBe(columns);
  });
}

// typography · La cursiva de títulos es la fuente cursiva real, no la recta inclinada
test("los textos en cursiva de títulos usan el archivo cursivo de Fraunces", async ({ page }) => {
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);
  const families = await page.evaluate(() => {
    const first = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontFamily.split(",")[0]!.trim();
    return {
      heroEmphasis: first("h1 em"),
      question: first("#donde-empezamos .theme-warm li"),
      nextStep: first("#como article dl > div:last-child dd"),
      email: first("#consulta > p:last-of-type"),
      upright: first("h1"),
    };
  });
  const principle = await page
    .locator("section[aria-labelledby='trust-title'] ul")
    .last()
    .locator("li")
    .nth(1)
    .evaluate((item) => getComputedStyle(item).fontFamily.split(",")[0]!.trim());
  expect(families.upright).toMatch(/^"?fraunces"?$/i);
  for (const family of [families.heroEmphasis, families.question, families.nextStep, principle, families.email]) {
    expect(family).toMatch(/frauncesItalic/i);
  }
});

// home-page · Las anclas llegan a su sección; la acción de consulta, a su bloque
test("las anclas de la cabecera dejan el título de su sección visible bajo la cabecera", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es");
  const header = page.getByRole("banner");
  for (const [link, title] of [
    ["Dónde empezamos", es.start.title],
    ["Cómo lo hacemos realidad", "Un recorrido que hacemos juntos."],
  ] as const) {
    await header.getByRole("link", { name: link }).click();
    const heading = page.getByRole("heading", { level: 2, name: title });
    await expect(heading).toBeInViewport();
    const headerBottom = (await header.boundingBox())!.height;
    await expect.poll(async () => (await heading.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom);
    // La sección empieza justo bajo la cabecera: no asoma una franja de la anterior.
    const section = page.locator("main > section", { has: heading });
    await expect.poll(async () => (await section.boundingBox())!.y - headerBottom).toBeLessThanOrEqual(24);
    await expect.poll(async () => (await section.boundingBox())!.y - headerBottom).toBeGreaterThanOrEqual(0);
  }
});

for (const [name, viewport] of [["375 px", NARROW], ["1280 px", WIDE]] as const) {
  test(`a ${name} la acción de consulta lleva al bloque con el correo`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/es");
    await page.getByRole("link", { name: es.actions.inquire }).first().click();
    const block = page.locator("#consulta");
    await expect(block).toBeInViewport();
    const headerBottom = (await page.getByRole("banner").boundingBox())!.height;
    await expect.poll(async () => (await block.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom);
    // Queda pegado a la cabecera, salvo que la página ya no pueda desplazarse más.
    await expect
      .poll(async () => {
        const gap = (await block.boundingBox())!.y - headerBottom;
        const atEnd = await page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1);
        return gap <= 32 || atEnd;
      })
      .toBe(true);
    await expect(block.getByRole("link", { name: "hola@confia.ing" })).toBeVisible();
  });
}

// home-page · Hero sin JavaScript (L3-1)
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el hero está completo y las dos acciones llevan a su destino", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(es.hero.lede)).toBeVisible();
    const hero = page.locator("section", { has: page.locator("h1") });
    const schedule = hero.getByRole("link", { name: new RegExp(es.actions.schedule) });
    const inquire = hero.getByRole("link", { name: es.actions.inquire });
    await expect(schedule).toBeVisible();
    await expect(inquire).toBeVisible();
    await expect(schedule).toHaveAttribute("href", "https://calendly.com/confiaing/30min");
    await expect(inquire).toHaveAttribute("href", "#consulta");
    await expect(page.locator("#consulta")).toContainText("hola@confia.ing");
    await expect(page.locator("#agenda").getByRole("link")).toHaveAttribute("href", "https://calendly.com/confiaing/30min");
  });
});

// home-page · Las cinco etapas, presentes en el HTML servido
for (const locale of ["es", "en"] as const) {
  test(`/${locale}: el HTML servido trae las cinco etapas y las seis secciones`, async ({ request }) => {
    const html = await (await request.get(`/${locale}`)).text();
    const home = getDictionary(locale).home;
    for (const stage of home.journey.stages) expect(html).toContain(stage.name);
    for (const id of ["hero-title", "start-title", "journey-title", "offer-title", "trust-title", "closing-title"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
}

// home-page · La home se lee en móvil y sin esperar
for (const locale of ["es", "en"] as const) for (const width of [320, 375]) {
  test(`/${locale} a ${width} px: nada se sale ni se recorta, y las acciones miden 44 px o más`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(`/${locale}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    // Las bandas recortan lo que se sale: se comprueba elemento a elemento que nada lo hace.
    const clipped = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth + 0.5;
      return [...document.querySelectorAll("main h1, main h2, main h3, main p, main li, main a, main dt, main dd")]
        // La fila de pestañas del recorrido se desplaza de lado a propósito.
        .filter((element) => !element.closest('[role="tablist"]'))
        .filter((element) => element.getBoundingClientRect().right > limit || element.scrollWidth > element.clientWidth + 1)
        .map((element) => `${element.tagName}: ${element.textContent?.slice(0, 40)}`);
    });
    expect(clipped).toEqual([]);

    const heights = await page.locator("main a.rounded-full").evaluateAll((links) =>
      links.map((link) => link.getBoundingClientRect().height),
    );
    expect(heights.length).toBeGreaterThanOrEqual(5);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  });
}

test("al pasar el puntero se mueven tarjetas y flecha; con movimiento reducido, nada se mueve", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "el puntero se comprueba en escritorio");
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const context = await browser.newContext({ reducedMotion, viewport: WIDE, baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await page.goto("/es");
    const card = page.locator("#donde-empezamos ol").first().locator("li").first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.evaluate((element) => getComputedStyle(element).rotate);
    await card.hover();
    await page.waitForTimeout(700);
    const after = await card.evaluate((element) => getComputedStyle(element).rotate);

    // La flecha de la acción principal avanza al pasar el puntero.
    const action = page.locator("main a[data-agenda]").first();
    await action.scrollIntoViewIfNeeded();
    await action.hover();
    await page.waitForTimeout(400);
    const arrow = await action.locator("span[aria-hidden]").evaluate((element) => getComputedStyle(element).translate);
    await context.close();

    expect(before).not.toBe("none");
    if (reducedMotion === "reduce") {
      expect(after).toBe(before);
      expect(arrow).toBe("none");
    } else {
      expect(after).not.toBe(before);
      expect(arrow).not.toBe("none");
    }
  }
});

for (const mode of ["completa", "ligera"] as const) test(`LCP < 2,5 s y CLS < 0,1 en móvil simulado, versión ${mode}`, async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "las métricas y la limitación de red solo existen en Chromium");
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.addInitScript((value) => window.localStorage.setItem("confia-modo", value), mode);
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
    const metrics = { lcp: 0, cls: 0 };
    (window as unknown as { __metrics: typeof metrics }).__metrics = metrics;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) metrics.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);
  // En versión completa se espera a que la escena esté lista: su llegada no debe mover nada.
  await page.locator('[data-scene="hero"]').scrollIntoViewIfNeeded();
  if (mode === "completa") await page.locator("canvas[data-scene-canvas]").waitFor({ state: "attached", timeout: 20_000 });
  await page.waitForTimeout(1000);
  await expect(page.locator("html")).toHaveAttribute("data-mode", mode === "completa" ? "full" : "lite");
  const metrics = await page.evaluate(() => (window as unknown as { __metrics: { lcp: number; cls: number } }).__metrics);
  await context.close();
  console.log(`Home /es en móvil simulado, versión ${mode}: LCP ${(metrics.lcp / 1000).toFixed(2)} s, CLS ${metrics.cls.toFixed(4)}`);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.cls).toBeLessThan(0.1);
});

// home-page · Cierre: el título se parte por frases, igual en cualquier ancho
for (const width of [375, 768, 1280, 1440, 1920]) {
  test(`a ${width} px el título del cierre va frase por frase y no se desborda`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/es");
    await page.evaluate(() => document.fonts.ready);
    const lines = await page.locator("#closing-title > span").evaluateAll((spans) =>
      spans.map((span) => {
        const box = span.getBoundingClientRect();
        return { lines: Math.round(box.height / parseFloat(getComputedStyle(span).lineHeight)), right: box.right, top: box.top };
      }),
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]!.top).toBeGreaterThan(lines[0]!.top);
    // En pantallas de ordenador, cada frase cabe en una línea.
    if (width >= 1280) expect(lines.map((line) => line.lines)).toEqual([1, 1]);
    for (const line of lines) expect(line.right).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

