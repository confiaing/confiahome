import { expect, test, type Locator, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";
import { fakeCalendly } from "./support/calendly.ts";

// Recorridos de la versión completa (lote L9): lo que cada lote probó por separado, de punta a punta.

async function hydrated(page: Page) {
  await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
}

// release-quality · Los dos flujos funcionan de extremo a extremo (L9-1)
for (const [locale, mode] of [["es", "terminal"], ["en", "classic"]] as const) {
  test(`flujo B · ${locale} en modo ${mode}: de la acción del hero a la confirmación`, async ({ page }) => {
    const t = getDictionary(locale).contact;
    await page.goto(`/${locale}`);
    await hydrated(page);
    await page.locator("section", { has: page.locator("h1") }).locator('a[data-cta="contact"]').click();
    const card = page.locator("#consulta");
    await expect(card).toBeInViewport();
    if (mode === "classic") await card.getByRole("button", { name: t.classic, exact: true }).click();
    await card.getByLabel(t.fields.name, { exact: false }).fill("Ana Ruiz");
    await card.getByLabel(t.fields.company, { exact: false }).fill("Acme");
    await card.getByLabel(t.fields.phone, { exact: false }).fill("+57 300 123 4567");
    await card.getByLabel(t.fields.message, { exact: false }).fill("Conciliar pagos");
    await card.getByRole("checkbox").check();
    await card.getByRole("button", { name: t.submit }).click();
    await expect(card.getByRole("status")).toHaveText(t.success);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}

for (const locale of ["es", "en"] as const) {
  test(`flujo A · ${locale}: de la acción del hero a los próximos pasos`, async ({ page }) => {
    const t = getDictionary(locale).agenda;
    await fakeCalendly(page);
    await page.goto(`/${locale}`);
    await hydrated(page);
    await page.locator("section", { has: page.locator("h1") }).locator("a[data-agenda]").click();
    await expect(page.locator("#agenda iframe")).toBeVisible();
    await page.frameLocator("#agenda iframe").locator("#book").click();
    const status = page.locator("#agenda").getByRole("status");
    await expect(status).toContainText(t.confirmedTitle);
    for (const step of t.confirmedSteps) await expect(status).toContainText(step);
  });
}

// release-quality · Todo el sitio se usa sin ratón (L9-2)
test.describe("solo con teclado", () => {
  /** Lleva el foco a un control como lo haría el tabulador y comprueba que el foco se ve. */
  async function reach(page: Page, target: Locator) {
    await target.focus();
    await expect(target).toBeFocused();
    // Tras una pulsación de teclado, el navegador muestra el foco: se exige que el control lo pinte.
    const visible = await target.evaluate((node) => {
      const style = getComputedStyle(node);
      return node.matches(":focus-visible") && (style.outlineStyle !== "none" || style.boxShadow !== "none");
    });
    expect(visible, await target.evaluate((node) => node.outerHTML.slice(0, 90))).toBe(true);
  }

  test("escritorio: saltar al contenido, etapas, versión de la página, formulario, agenda e idioma", async ({ page, browserName, isMobile }) => {
    test.skip(browserName !== "chromium" || isMobile, "el recorrido con tabulador se prueba en Chromium de escritorio");
    const es = getDictionary("es");
    await fakeCalendly(page);
    await page.goto("/es");
    await hydrated(page);

    // 1. El primer tabulador da el enlace para saltar al contenido.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: es.skipLink });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#contenido")).toBeFocused();

    // 2. Las cinco etapas, con las flechas.
    const tabs = page.locator('[data-journey] [role="tab"]');
    await reach(page, tabs.first());
    for (let stage = 2; stage <= 5; stage += 1) {
      await page.keyboard.press("ArrowRight");
      await expect(tabs.nth(stage - 1)).toHaveAttribute("aria-selected", "true");
      await expect(page.locator(`#etapa-${stage}`)).toBeVisible();
    }
    await page.keyboard.press("Home");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

    // 3. La versión de la página, desde el pie.
    const versions = page.locator("footer button[aria-pressed]");
    // Se fija el botón por su posición: tras pulsarlo, «el que no está pulsado» sería el otro.
    const states = await versions.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-pressed")));
    const other = versions.nth(states.indexOf("false"));
    await reach(page, other);
    await page.keyboard.press("Enter");
    await expect(other).toHaveAttribute("aria-pressed", "true");

    // 4. El formulario: cambiar de modo y enviarlo.
    const card = page.locator("#consulta");
    await reach(page, card.getByRole("button", { name: es.contact.classic, exact: true }));
    await page.keyboard.press("Space");
    await expect(card.getByRole("form", { name: es.contact.classicFormLabel })).toBeVisible();
    await reach(page, card.getByLabel(es.contact.fields.name, { exact: false }));
    await page.keyboard.type("Ana");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("ana@empresa.com");
    await reach(page, card.getByRole("checkbox"));
    await page.keyboard.press("Space");
    await reach(page, card.getByRole("button", { name: es.contact.submit }));
    await page.keyboard.press("Enter");
    await expect(card.getByRole("status")).toHaveText(es.contact.success);

    // 5. La agenda.
    await reach(page, page.locator("#agenda [data-agenda-open]"));
    await page.keyboard.press("Enter");
    await expect(page.locator("#agenda-title")).toBeFocused();
    await expect(page.locator("#agenda iframe")).toBeVisible();

    // 6. El idioma.
    await reach(page, page.locator("a[data-locale-switch]").first());
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("móvil: el menú se abre, se recorre y se cierra con el teclado", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "el recorrido con tabulador se prueba en Chromium");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/es");
    await hydrated(page);
    const toggle = page.locator("#site-nav-toggle");
    await reach(page, toggle);
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const nav = page.locator("#site-nav");
    await expect(nav).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.querySelector("#site-nav")!.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });
});

// release-quality · Movimiento reducido (L9-2)
test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("etapas, formulario y agenda no desplazan ni escalan nada de forma animada", async ({ page }) => {
    const es = getDictionary("es");
    await fakeCalendly(page);
    await page.goto("/es");
    await hydrated(page);
    await page.locator("#tab-etapa-3").click();
    await page.locator("#consulta").getByRole("button", { name: es.contact.classic, exact: true }).click();
    await page.locator("#agenda [data-agenda-open]").click();
    await expect(page.locator("#agenda iframe")).toBeVisible();
    const moving = await page.evaluate(() =>
      document.getAnimations().filter((animation) => {
        if (animation.playState !== "running") return false;
        const effect = animation.effect as KeyframeEffect | null;
        const properties = (effect?.getKeyframes() ?? []).flatMap((frame) => Object.keys(frame));
        const timing = effect?.getComputedTiming();
        // Con movimiento reducido las duraciones se anulan: lo que quede corriendo de más de un instante es un fallo.
        return properties.some((name) => ["transform", "translate", "scale", "rotate"].includes(name)) && Number(timing?.duration ?? 0) > 50;
      }).length,
    );
    expect(moving).toBe(0);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });
});
