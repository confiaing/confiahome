import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const MODES = ["terminal", "classic"] as const;
const LOCALES = ["es", "en"] as const;
type Mode = (typeof MODES)[number];
type Labels = ReturnType<typeof getDictionary>["contact"];

const card = (page: Page) => page.locator("#consulta");

/** Abre la home, espera a que el formulario responda y deja el modo pedido. */
async function open(page: Page, locale: "es" | "en", mode: Mode) {
  const t = getDictionary(locale).contact;
  await page.goto(`/${locale}`);
  await expect(card(page).getByRole("button", { name: t.submit })).toBeEnabled();
  if (mode === "classic") await card(page).getByRole("button", { name: t.classic, exact: true }).click();
  await expect(card(page).getByRole("form", { name: mode === "terminal" ? t.terminalFormLabel : t.classicFormLabel })).toBeVisible();
  return t;
}

const field = (page: Page, t: Labels, name: keyof Labels["fields"]) => card(page).getByLabel(t.fields[name], { exact: false });

for (const locale of LOCALES) {
  for (const mode of MODES) {
    // contact-form · Recorrido completo (L5-1, L5-4, L5-10)
    test(`${locale} · ${mode}: nombre, correo y aceptación llevan a la confirmación`, async ({ page }) => {
      const t = await open(page, locale, mode);
      await field(page, t, "name").fill("Ana Ruiz");
      await field(page, t, "email").fill("ana@empresa.com");
      await card(page).getByRole("checkbox").check();
      const sent = page.waitForResponse((response) => response.url().endsWith("/api/contact"));
      await card(page).getByRole("button", { name: t.submit }).click();
      expect((await sent).status()).toBe(201);
      const status = card(page).getByRole("status");
      await expect(status).toHaveText(t.success);
      await expect(status).toBeFocused();
      await expect(card(page).getByRole("checkbox")).toHaveCount(0);
      // Lo escrito no acaba en la dirección de la página.
      expect(new URL(page.url()).search).toBe("");
    });
  }
}

for (const mode of MODES) {
  // contact-form · Solo teclado (L5-1)
  test(`${mode}: se completa y envía solo con teclado`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "en WebKit el tabulador no recorre enlaces ni casillas por defecto");
    const t = await open(page, "es", mode);
    await field(page, t, "name").focus();
    await page.keyboard.type("Ana");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Acme");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("300 123 4567");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Conciliar pagos");
    await page.keyboard.press("Tab");
    await expect(card(page).getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(card(page).getByRole("button", { name: t.submit })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(card(page).getByRole("status")).toHaveText(t.success);
  });

  // contact-form · Errores junto al campo (L5-3)
  test(`${mode}: sin medio de contacto se ve el error y el foco va al primer campo con error`, async ({ page }) => {
    const t = await open(page, "es", mode);
    let requests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/contact")) requests += 1;
    });
    await field(page, t, "name").fill("Ana");
    await card(page).getByRole("checkbox").check();
    await card(page).getByRole("button", { name: t.submit }).click();
    await expect(card(page).getByText(t.errors.contactRequired)).toBeVisible();
    await expect(field(page, t, "email")).toBeFocused();
    await expect(field(page, t, "email")).toHaveAttribute("aria-invalid", "true");
    await expect(field(page, t, "name")).toHaveValue("Ana");
    expect(requests).toBe(0);
  });

  // contact-form · Fallo del servicio (L5-9)
  test(`${mode}: si el servidor responde 503 se ve el aviso con el correo y se conserva lo escrito`, async ({ page }) => {
    const t = await open(page, "es", mode);
    await page.route("**/api/contact", (route) => route.fulfill({ status: 503, json: { status: "unavailable" } }));
    await field(page, t, "name").fill("Ana");
    await field(page, t, "email").fill("ana@empresa.com");
    await field(page, t, "message").fill("Conciliar pagos");
    await card(page).getByRole("checkbox").check();
    await card(page).getByRole("button", { name: t.submit }).click();
    const alert = card(page).getByRole("alert");
    await expect(alert).toContainText(t.failures.unavailable);
    await expect(alert.getByRole("link", { name: "hola@confia.ing" })).toHaveAttribute("href", "mailto:hola@confia.ing");
    await expect(field(page, t, "name")).toHaveValue("Ana");
    await expect(field(page, t, "message")).toHaveValue("Conciliar pagos");
    await expect(card(page).getByRole("checkbox")).toBeChecked();
  });
}

// contact-form · Dos modos sobre los mismos datos (L5-10)
test("cambiar de modo conserva lo escrito", async ({ page }) => {
  const t = await open(page, "es", "terminal");
  await field(page, t, "name").fill("Ana");
  await field(page, t, "phone").fill("3001234567");
  await card(page).getByRole("button", { name: t.classic, exact: true }).click();
  await expect(field(page, t, "name")).toHaveValue("Ana");
  await expect(field(page, t, "phone")).toHaveValue("3001234567");
  await expect(card(page).locator("[data-live-json]")).toContainText('"Ana"');
});

// contact-form · Detalles de cada modo: el comando se teclea, salvo con movimiento reducido
test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("el comando del terminal aparece completo desde el principio", async ({ page }) => {
    const t = await open(page, "es", "terminal");
    await expect(card(page).locator("[data-typed-command]")).toHaveText(t.command);
  });
});

test("sin movimiento reducido el comando termina de escribirse al llegar a él", async ({ page }) => {
  const t = await open(page, "es", "terminal");
  await card(page).scrollIntoViewIfNeeded();
  await expect(card(page).locator("[data-typed-command]")).toHaveText(t.command, { timeout: 10_000 });
});

// contact-form · Sin JavaScript queda el correo (L5-9)
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("no se ve el formulario y sí el correo", async ({ page }) => {
    await page.goto("/es");
    await expect(card(page).locator("[data-contact-form]")).toBeHidden();
    await expect(card(page).getByRole("link", { name: "hola@confia.ing" })).toBeVisible();
  });
});

// contact-form · Accesibilidad y tamaño de los controles
for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]) {
  for (const mode of MODES) {
    test(`${mode} a ${viewport.width} px: sin infracciones vacío, con errores y enviado; controles de 44 px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const t = await open(page, "es", mode);
      const scan = async () => (await new AxeBuilder({ page }).include("#consulta").analyze()).violations;
      // El control de modo cambia de color con una transición: se espera a que termine.
      await expect.poll(scan).toEqual([]);

      for (const control of await card(page).locator("[data-contact-form]").locator("button, input:not([tabindex='-1']), textarea").all()) {
        const box = (await control.boundingBox())!;
        const isCheckbox = (await control.getAttribute("type")) === "checkbox";
        // La casilla mide 24 px, pero su etiqueta —que también la marca— hace de área táctil.
        expect(box.height, await control.evaluate((node) => node.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(isCheckbox ? 24 : 44);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      await card(page).getByRole("button", { name: t.submit }).click();
      await expect(card(page).getByText(t.errors.required)).toBeVisible();
      expect(await scan()).toEqual([]);

      await field(page, t, "name").fill("Ana");
      await field(page, t, "email").fill("ana@empresa.com");
      await card(page).getByRole("checkbox").check();
      await card(page).getByRole("button", { name: t.submit }).click();
      await expect(card(page).getByRole("status")).toHaveText(t.success);
      expect(await scan()).toEqual([]);
    });
  }
}

// contact-form · Modo terminal: la pregunta abierta va sobre su respuesta, con ejemplos que se escriben solos
test("terminal: la pregunta abierta está encima de su respuesta y los ejemplos van cambiando", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const t = await open(page, "es", "terminal");
  const area = field(page, t, "message");
  await area.scrollIntoViewIfNeeded();
  const label = card(page).locator(`label[for="${await area.getAttribute("id")}"]`);
  const [labelBox, areaBox] = [(await label.boundingBox())!, (await area.boundingBox())!];
  expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(areaBox.y + 1);
  expect(areaBox.width).toBeGreaterThan(400);

  const full = t.examples.map((example) => `${t.examplePrefix} ${example}`);
  await expect.poll(() => area.getAttribute("placeholder"), { timeout: 15_000 }).toBe(full[0]);
  await expect.poll(() => area.getAttribute("placeholder"), { timeout: 15_000 }).toBe(full[1]);
});

test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("terminal: el ejemplo de la pregunta abierta está fijo", async ({ page }) => {
    const t = await open(page, "es", "terminal");
    const area = field(page, t, "message");
    await area.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await expect(area).toHaveAttribute("placeholder", `${t.examplePrefix} ${t.examples[0]}`);
  });
});

