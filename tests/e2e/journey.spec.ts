import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const NARROW = { width: 375, height: 812 };
const WIDE = { width: 1280, height: 800 };
const es = getDictionary("es").home.journey;

const visiblePanels = (page: Page) =>
  page.locator('[data-journey] [role="tabpanel"]').evaluateAll((panels) =>
    panels.filter((panel) => getComputedStyle(panel).display !== "none").map((panel) => panel.id),
  );

// journey-navigation · Una etapa a la vez
test("se ve una etapa a la vez y al elegir otra cambia el panel", async ({ page }) => {
  await page.goto("/es");
  expect(await visiblePanels(page)).toEqual(["etapa-1"]);
  await page.getByRole("tab", { name: /Roadmap/ }).click();
  expect(await visiblePanels(page)).toEqual(["etapa-3"]);
  await expect(page.getByRole("tabpanel", { name: /Roadmap/ })).toContainText(es.stages[2]!.next);
  await expect(page).toHaveURL(/#etapa-3$/);
});

// journey-navigation · Las etapas no dependen de JavaScript (L4-3)
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("las cinco etapas se ven en orden y no hay pestañas", async ({ page }) => {
    await page.goto("/es");
    expect(await visiblePanels(page)).toEqual(["etapa-1", "etapa-2", "etapa-3", "etapa-4", "etapa-5"]);
    for (const stage of es.stages) {
      await expect(page.locator("#como").getByRole("heading", { level: 3, name: stage.name })).toBeVisible();
      await expect(page.locator("#como").getByText(stage.next)).toBeVisible();
    }
    await expect(page.locator('#como [role="tablist"]')).toBeHidden();
  });
});

test("el HTML servido trae el texto completo de las cinco etapas", async ({ request }) => {
  const html = await (await request.get("/es")).text();
  for (const stage of es.stages) {
    expect(html).toContain(stage.name);
    expect(html).toContain(stage.does.replace(/'/g, "&#x27;"));
    expect(html).toContain(stage.next);
  }
});

test("con el ancla de la etapa 4 en la dirección se muestra la etapa 4", async ({ page }) => {
  await page.goto("/es#etapa-4");
  expect(await visiblePanels(page)).toEqual(["etapa-4"]);
  await expect(page.getByRole("tab", { name: /Piloto/ })).toHaveAttribute("aria-selected", "true");
});

// Antes de hidratar, o si el script falla, la dirección sigue eligiendo el panel.
test("si el JavaScript de la página no llega a cargar, cada pestaña sigue llevando a su etapa", async ({ page }) => {
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/es");
  await expect(page.locator("[data-journey]")).not.toHaveAttribute("data-ready", "");
  expect(await visiblePanels(page)).toEqual(["etapa-1"]);
  await page.locator('[role="tab"]').nth(2).click();
  await expect(page).toHaveURL(/#etapa-3$/);
  expect(await visiblePanels(page)).toEqual(["etapa-3"]);
});

test("si el JavaScript no llega a cargar, las etapas también se alcanzan con teclado", async ({ page, browserName }) => {
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/es");
  const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
  // Sin el componente en marcha cada pestaña es un enlace más: se recorren con el tabulador.
  await page.locator("#tab-etapa-1").focus();
  await page.keyboard.press(tab);
  await expect(page.locator("#tab-etapa-2")).toBeFocused();
  await page.keyboard.press(tab);
  await page.keyboard.press(tab);
  await expect(page.locator("#tab-etapa-4")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#etapa-4$/);
  expect(await visiblePanels(page)).toEqual(["etapa-4"]);
});

test("si la dirección cambia después de cargar, la etapa la sigue", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("tab", { name: /Diagnóstico/ }).click();
  await page.evaluate(() => (window.location.hash = "#etapa-5"));
  expect(await visiblePanels(page)).toEqual(["etapa-5"]);
  await expect(page.getByRole("tab", { name: /Escala y transferencia/ })).toHaveAttribute("aria-selected", "true");
});

test("elegir una etapa no desplaza la página", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es");
  // La última pestaña queda cortada por el borde inferior de la ventana.
  await page.locator("#tab-etapa-5").evaluate((tab) => {
    window.scrollTo(0, tab.getBoundingClientRect().bottom + window.scrollY - window.innerHeight - 20);
  });
  const before = await page.evaluate(() => window.scrollY);
  await page.locator("#tab-etapa-5").click({ position: { x: 20, y: 5 } });
  await expect(page.locator("#tab-etapa-5")).toHaveAttribute("aria-selected", "true");
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.keyboard.press("Home");
  await expect(page.locator("#tab-etapa-1")).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

// journey-navigation · Patrón de pestañas accesible
test("un solo punto de tabulación: se entra por la pestaña seleccionada y se pasa a su panel", async ({ page, browserName }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es");
  const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.getByRole("tab", { name: /Roadmap/ }).click();
  // Desde el último elemento enfocable anterior al recorrido: la acción secundaria del hero.
  await page.locator('main section:first-of-type a[href="#consulta"]').focus();
  await page.keyboard.press(tab);
  await expect(page.locator("#tab-etapa-3")).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator("#etapa-3")).toBeFocused();
});

test("desde lg la lista de pestañas se anuncia vertical; en estrecho, horizontal", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto("/es");
  await expect(page.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  await page.setViewportSize(NARROW);
  await expect(page.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
});

test("las flechas recorren las etapas y el foco sigue a la selección", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("tab", { name: /Conversación inicial/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Diagnóstico/ })).toBeFocused();
  expect(await visiblePanels(page)).toEqual(["etapa-2"]);
  await page.keyboard.press("End");
  expect(await visiblePanels(page)).toEqual(["etapa-5"]);
  await page.keyboard.press("ArrowRight");
  expect(await visiblePanels(page)).toEqual(["etapa-1"]);
});

for (const [name, viewport] of [["375 px", NARROW], ["1280 px", WIDE]] as const) {
  test(`a ${name}: axe sin infracciones con cada etapa seleccionada`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/es");
    for (let stage = 0; stage < 5; stage += 1) {
      await page.locator('[role="tab"]').nth(stage).click();
      const results = await new AxeBuilder({ page }).include("#como").analyze();
      expect(results.violations, `etapa ${stage + 1}`).toEqual([]);
    }
  });
}

// journey-navigation · Recorrido usable en móvil (L4-5)
for (const locale of ["es", "en"] as const) {
  test(`/${locale} a 375 px: pestañas de 44 px, sin desplazamiento horizontal y la seleccionada a la vista`, async ({ page }) => {
    await page.setViewportSize(NARROW);
    await page.goto(`/${locale}`);
    const tabs = page.locator('[role="tab"]');
    for (let stage = 0; stage < 5; stage += 1) {
      const tab = tabs.nth(stage);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      const box = (await tab.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(NARROW.width + 0.5);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

// journey-navigation · Cambio de etapa sin movimiento
// El cambio de panel no se anima nunca, así que esto vale con y sin la preferencia.
test("el panel cambia sin transición, también con movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");
  await page.getByRole("tab", { name: /Piloto/ }).click();
  const motion = await page.locator("#etapa-4").evaluate((panel) => {
    const style = getComputedStyle(panel);
    return { animation: style.animationName, opacity: style.opacity, translate: style.translate };
  });
  expect(motion).toEqual({ animation: "none", opacity: "1", translate: "none" });
});
