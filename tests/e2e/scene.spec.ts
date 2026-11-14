import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const KINDS = ["hero", "journey", "closing"] as const;

/** Estado visible de cada tramo de la ilustración del recorrido. */
const journeyState = (page: Page) =>
  page.evaluate(() => {
    const slot = document.querySelector('[data-scene="journey"]')!;
    const each = <T>(selector: string, read: (style: CSSStyleDeclaration) => T) =>
      [0, 1, 2, 3, 4].map((segment) => read(getComputedStyle(slot.querySelector(selector.replace("N", String(segment)))!)));
    return {
      // En silueta: las caras no tienen relleno.
      ghost: each('[data-role="segment"][data-segment="N"] use', (style) => style.getPropertyValue("--face-top").trim() === "none"),
      fragments: each('[data-role="fragment"][data-segment="N"]', (style) => style.opacity !== "0"),
      companions: each('[data-role="companions"][data-segment="N"]', (style) => style.opacity !== "0"),
    };
  });

// scene-rendering · Versión ligera en el HTML (L4-7)
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("las tres ilustraciones son visibles y tienen tamaño", async ({ page }) => {
    await page.goto("/es");
    for (const kind of KINDS) {
      const svg = page.locator(`[data-scene="${kind}"] svg`);
      await svg.scrollIntoViewIfNeeded();
      await expect(svg).toBeVisible();
      const box = (await svg.boundingBox())!;
      expect(box.width, kind).toBeGreaterThan(200);
      expect(box.height, kind).toBeGreaterThan(150);
    }
  });
});

test("el HTML servido ya trae las tres ilustraciones", async ({ request }) => {
  const html = await (await request.get("/es")).text();
  for (const kind of KINDS) expect(html).toContain(`data-scene="${kind}"`);
  // Cada forma se define una vez por ilustración: el HTML no repite la geometría de cada bloque.
  expect(html.match(/<polygon/g)!.length).toBe(36);
  expect(html.match(/<svg[^>]*data-scene-svg/g)).toHaveLength(3);
});

test("la ilustración del recorrido sigue a la etapa elegida", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");
  // Etapa 1: solo el primer tramo construido.
  expect(await journeyState(page)).toEqual({
    ghost: [false, true, true, true, true],
    fragments: [false, true, true, true, true],
    companions: [true, false, false, false, false],
  });
  // Con movimiento reducido el cambio no se anima.
  const duration = await page
    .locator('[data-scene="journey"] [data-role="fragment"]')
    .first()
    .evaluate((group) => parseFloat(getComputedStyle(group).transitionDuration));
  expect(duration).toBeLessThan(0.001);

  await page.getByRole("tab", { name: /Roadmap/ }).click();
  // Etapa 3: tramos 1 a 3 construidos, 4 y 5 en silueta.
  await expect.poll(() => journeyState(page)).toEqual({
    ghost: [false, false, false, true, true],
    fragments: [false, false, false, true, true],
    companions: [false, false, true, false, false],
  });
  await page.getByRole("tab", { name: /Escala y transferencia/ }).click();
  await expect.poll(async () => (await journeyState(page)).ghost).toEqual([false, false, false, false, false]);
});

test("la ilustración toma los colores del tema que la contiene", async ({ page }) => {
  await page.goto("/es");
  const top = (kind: string) =>
    page
      .locator(`[data-scene="${kind}"] :is([data-role="static"], [data-segment="0"]) use[data-tone="stone"]`)
      .first()
      .evaluate((block) => getComputedStyle(block).getPropertyValue("--face-top").trim().toLowerCase());
  // Blanco sobre crema en el hero; crema sobre índigo en la tarjeta del recorrido.
  expect(["#fff", "#ffffff"]).toContain(await top("hero")); // el CSS minificado lo abrevia
  expect(await top("journey")).toBe("#fbf5ea");

  // Y las caras se pintan de verdad con ese color: se comprueba en la forma compartida.
  const painted = await page
    .locator('[data-scene="hero"] symbol [data-face="top"]')
    .first()
    .evaluate((face) => getComputedStyle(face).fill);
  expect(painted).toBe("rgb(255, 255, 255)");
});

// ---------------------------------------------------------------------------
// Versión completa (3D). Chromium sin cabeza dibuja WebGL por software; en WebKit
// móvil se verifica la versión ligera.
// ---------------------------------------------------------------------------
const es = getDictionary("es").scene;
const WIDE = { width: 1280, height: 800 };
const THREE_MARK = "isWebGLRenderer";

const canvas = (page: Page) => page.locator("canvas[data-scene-canvas]");

/** Carga la home en versión completa y espera a que la escena esté dibujando. */
async function openFull(page: Page, path = "/es") {
  await page.setViewportSize(WIDE);
  await page.goto(path);
  await expect(canvas(page)).toHaveAttribute("data-rendering", "true", { timeout: 15_000 });
}

test.describe("versión completa", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "la escena 3D se verifica en Chromium");

  // scene-rendering · La escena 3D no retrasa la lectura (L4-8)
  test("Three.js se pide después de load, no está en el JS inicial y no hay errores de consola", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(String(error)));
    await openFull(page);

    const scripts = await page.evaluate(() => {
      const loadEnd = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).loadEventStart;
      return (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter((entry) => entry.name.endsWith(".js"))
        .map((entry) => ({ url: entry.name, afterLoad: entry.startTime >= loadEnd }));
    });
    const withThree: typeof scripts = [];
    for (const script of scripts) {
      if ((await (await request.get(script.url)).text()).includes(THREE_MARK)) withThree.push(script);
    }
    expect(withThree).toHaveLength(1);
    expect(withThree[0]!.afterLoad).toBe(true);

    const html = await (await request.get("/es")).text();
    const initial = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1]!);
    expect(initial.length).toBeGreaterThan(0);
    expect(initial).not.toContain(new URL(withThree[0]!.url).pathname);
    expect(errors).toEqual([]);
  });

  test("hay un solo lienzo, y se muda a la ranura que está a la vista", async ({ page }) => {
    await openFull(page);
    await expect(canvas(page)).toHaveCount(1);
    await expect(page.locator('[data-scene="hero"] canvas')).toHaveCount(1);
    await expect(page.locator('[data-scene="hero"]')).toHaveAttribute("data-has-canvas", "");

    await page.locator("#como").scrollIntoViewIfNeeded();
    await page.locator('[data-scene="journey"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-scene="journey"] canvas')).toHaveCount(1);
    await expect(page.locator('[data-scene="hero"]')).not.toHaveAttribute("data-has-canvas", "");

    await page.locator('[data-scene="closing"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-scene="closing"] canvas')).toHaveCount(1);
    await expect(canvas(page)).toHaveCount(1);
  });

  test("la ilustración queda bajo el lienzo y el pie indica la versión completa", async ({ page }) => {
    await openFull(page);
    await expect(page.locator("html")).toHaveAttribute("data-mode", "full");
    await expect.poll(() => page.locator('[data-scene="hero"] svg').evaluate((svg) => getComputedStyle(svg).opacity)).toBe("0");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("button", { name: es.full })).toHaveAttribute("aria-pressed", "true");
    await expect(footer.getByRole("status")).toHaveText(es.status.full);
  });

  // scene-rendering · La escena 3D sigue a la etapa y al desplazamiento (L4-6)
  test("al elegir una etapa, la escena la recibe como destino", async ({ page }) => {
    await openFull(page);
    await page.locator('[data-scene="journey"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-scene="journey"] canvas')).toHaveCount(1);
    // El destino de la escena es el final del tramo de la etapa elegida.
    await page.getByRole("tab", { name: /Piloto/ }).click();
    await expect(canvas(page)).toHaveAttribute("data-goal", "0.78");
    await page.getByRole("tab", { name: /Diagnóstico/ }).click();
    await expect(canvas(page)).toHaveAttribute("data-goal", "0.34");
  });

  test("el desplazamiento es del visitante: la rueda avanza lo pedido y nadie la cancela", async ({ page }) => {
    await openFull(page);
    await page.evaluate(() => {
      const state = { prevented: 0, events: 0 };
      (window as unknown as { __wheel: typeof state }).__wheel = state;
      window.addEventListener(
        "wheel",
        (event) => {
          state.events += 1;
          // Se mira al final del reparto: si alguien llamó a preventDefault, se nota aquí.
          setTimeout(() => event.defaultPrevented && (state.prevented += 1));
        },
        { passive: true },
      );
    });
    await page.mouse.move(640, 400);
    for (let step = 0; step < 6; step += 1) {
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 400);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(before + 390);
    }
    const wheel = await page.evaluate(() => (window as unknown as { __wheel: { prevented: number; events: number } }).__wheel);
    expect(wheel.events).toBe(6);
    expect(wheel.prevented).toBe(0);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe("hidden");
  });

  // scene-rendering · La escena 3D no consume recursos sin verse (L4-8)
  test("el dibujo se detiene con la pestaña oculta y se reanuda al volver", async ({ page }) => {
    await openFull(page);
    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
        document.dispatchEvent(new Event("visibilitychange"));
      }, hidden);
    await setHidden(true);
    await expect(canvas(page)).toHaveAttribute("data-rendering", "false");
    await setHidden(false);
    await expect(canvas(page)).toHaveAttribute("data-rendering", "true");
  });

  test("el dibujo se detiene cuando ninguna ranura está a la vista", async ({ page }) => {
    await openFull(page);
    // «Lo que ofrecemos» ocupa más que la ventana y no tiene escena.
    await page.locator('[data-offer="main"]').evaluate((card) => card.scrollIntoView({ block: "start" }));
    await expect(canvas(page)).toHaveAttribute("data-rendering", "false");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(canvas(page)).toHaveAttribute("data-rendering", "true");
  });

  // scene-rendering · La escena falla hacia la versión ligera (L4-8)
  test("si Three.js no carga, la página queda en ligera y el pie lo comunica", async ({ page }) => {
    let loaded = false;
    page.once("load", () => (loaded = true));
    // Todo lo que se pida después de load es la escena: se corta ahí.
    await page.route("**/_next/static/chunks/**/*.js", (route) => (loaded ? route.abort() : route.continue()));
    await page.setViewportSize(WIDE);
    await page.goto("/es");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("status")).toHaveText(es.status.loadFailed, { timeout: 15_000 });
    await expect(page.locator("html")).toHaveAttribute("data-mode", "lite");
    await expect(canvas(page)).toHaveCount(0);
    await expect(footer.getByRole("button", { name: es.lite })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-scene="hero"] svg')).toBeVisible();
  });

  test("si se pierde el contexto gráfico, la página pasa a ligera y lo comunica", async ({ page }) => {
    await openFull(page);
    await canvas(page).evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext("webgl2") ?? (element as HTMLCanvasElement).getContext("webgl");
      context!.getExtension("WEBGL_lose_context")!.loseContext();
    });
    await expect(page.locator("html")).toHaveAttribute("data-mode", "lite");
    await expect(page.getByRole("contentinfo").getByRole("status")).toHaveText(es.status.contextLost);
    await expect(canvas(page)).toHaveCount(0);
    await expect.poll(() => page.locator('[data-scene="hero"] svg').evaluate((svg) => getComputedStyle(svg).opacity)).toBe("1");
  });

  // scene-rendering · Control de versión del visitante (L4-9)
  test("elegir «ligera» quita el lienzo al instante y se recuerda al recargar", async ({ page }) => {
    await openFull(page);
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("button", { name: es.lite }).click();
    await expect(canvas(page)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-mode", "lite");
    await expect(footer.getByRole("status")).toHaveText(es.status.chosen);

    const stored = await page.evaluate(() => Object.entries(window.localStorage));
    expect(stored).toEqual([["confia-modo", "ligera"]]);

    await page.reload();
    await expect(page.getByRole("contentinfo").getByRole("status")).toHaveText(es.status.chosen);
    await page.waitForTimeout(1500);
    await expect(canvas(page)).toHaveCount(0);

    await page.getByRole("contentinfo").getByRole("button", { name: es.full }).click();
    // Desde el pie no se ve ninguna ranura: el lienzo aparece al volver a una.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(canvas(page)).toHaveAttribute("data-rendering", "true", { timeout: 15_000 });
    expect(await page.evaluate(() => Object.entries(window.localStorage))).toEqual([["confia-modo", "completa"]]);
  });
});

// scene-rendering · Elección automática de versión, en el navegador
test("con movimiento reducido la versión es ligera, el pie lo explica y Three.js no se pide", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");
  const footer = page.getByRole("contentinfo");
  // Sin WebGL el motivo es ese, que va antes; con WebGL, el movimiento reducido.
  const webgl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
  await expect(footer.getByRole("status")).toHaveText(webgl ? es.status.reducedMotion : es.status.noWebgl);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "lite");
  await page.waitForTimeout(1500);
  await expect(canvas(page)).toHaveCount(0);

  const scripts = await page.evaluate(() =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((entry) => entry.name).filter((name) => name.endsWith(".js")),
  );
  for (const url of scripts) expect((await (await request.get(url)).text()).includes(THREE_MARK), url).toBe(false);
});

test("en una página legal no aparece el control de versión", async ({ page }) => {
  await page.goto("/es/privacidad");
  await page.waitForTimeout(500);
  await expect(page.getByRole("contentinfo").getByRole("group", { name: es.label })).toHaveCount(0);
  await expect(page.getByRole("contentinfo").getByRole("group", { name: "Idioma" })).toHaveCount(1);
});

// Accesibilidad de la home en las dos versiones
for (const mode of ["completa", "ligera"] as const) {
  for (const [name, viewport] of [["375 px", { width: 375, height: 812 }], ["1280 px", WIDE]] as const) {
    test(`/es y /en a ${name}, versión ${mode}: axe sin infracciones`, async ({ page }) => {
      await page.addInitScript((value) => window.localStorage.setItem("confia-modo", value), mode);
      await page.setViewportSize(viewport);
      for (const path of ["/es", "/en"]) {
        await page.goto(path);
        await expect(page.getByRole("contentinfo").getByRole("status")).not.toBeEmpty();
        expect((await new AxeBuilder({ page }).analyze()).violations, path).toEqual([]);
      }
    });
  }
}
