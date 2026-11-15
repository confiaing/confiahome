import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

const CALENDAR = "https://calendly.com/confiaing/30min";
const isCalendly = (url: string) => /^https:\/\/([a-z0-9-]+\.)*calendly\.com\//.test(url);
const card = (page: Page) => page.locator("#agenda");
const frame = (page: Page) => card(page).locator("iframe");

// Un Calendly de mentira servido en sus direcciones reales: el origen de sus mensajes es
// el verdadero (https://calendly.com) y ninguna prueba sale a la red.
const WIDGET = `window.Calendly = { initInlineWidget: function (o) {
  var f = document.createElement("iframe");
  f.src = o.url + "?embed_domain=" + location.hostname + "&embed_type=Inline";
  f.title = "Select a Date & Time - Calendly";
  f.width = "100%"; f.height = "100%"; f.frameBorder = "0";
  o.parentElement.appendChild(f);
} };`;
const bookingPage = (delay: number) => `<!doctype html><html lang="en"><title>Calendly</title><body>
<h1>30 Minute Meeting</h1><button id="book">Schedule Event</button>
<script>
  var say = function (event) { parent.postMessage({ event: event, payload: {} }, "*"); };
  setTimeout(function () { say("calendly.page_height"); say("calendly.event_type_viewed"); }, ${delay});
  document.getElementById("book").addEventListener("click", function () { say("calendly.event_scheduled"); });
</script></body></html>`;

/** `delay`: cuánto tarda el calendario en dar su primera señal, como el real (varios segundos). */
async function fakeCalendly(page: Page, delay = 0) {
  await page.route("https://assets.calendly.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: WIDGET }));
  await page.route("https://calendly.com/**", (route) => route.fulfill({ contentType: "text/html", body: bookingPage(delay) }));
}

async function ready(page: Page, locale: "es" | "en" = "es") {
  const t = getDictionary(locale).agenda;
  await page.goto(`/${locale}`);
  // El botón del bloque solo responde una vez hidratado; se espera a ello con un atributo propio.
  await expect(card(page).locator("[data-agenda-panel]")).toHaveAttribute("data-state", "idle");
  await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
  return t;
}

// scheduling · El calendario se carga solo a petición (L6-1)
for (const locale of ["es", "en"] as const) {
  test(`${locale}: al cargar y recorrer la página no se pide nada a Calendly`, async ({ page, request }) => {
    const requested: string[] = [];
    page.on("request", (item) => {
      if (isCalendly(item.url())) requested.push(item.url());
    });
    await page.goto(`/${locale}`);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 40));
      }
    });
    await card(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    expect(requested).toEqual([]);
    const html = await (await request.get(`/${locale}`)).text();
    expect(html).not.toMatch(/<iframe/i);
    expect(html).not.toMatch(/<script[^>]+calendly/i);
    expect(html).not.toMatch(/rel="(preconnect|dns-prefetch|preload)"[^>]+calendly/i);
  });
}

const ACTIONS = [
  ["hero", (page: Page) => page.locator("section", { has: page.locator("h1") }).locator("a[data-agenda]")],
  ["cierre", (page: Page) => page.locator("section[aria-labelledby='closing-title'] a[data-agenda]").first()],
  ["cabecera", (page: Page) => page.locator("[data-site-header] a[data-agenda]").first()],
] as const;

for (const [name, locate] of ACTIONS) {
  test(`la acción de agenda de ${name} carga el calendario en su bloque, en la misma pestaña`, async ({ page, context, isMobile }) => {
    test.skip(name === "cabecera" && isMobile, "en móvil la acción de la cabecera vive en el menú plegado; se cubre en escritorio");
    await fakeCalendly(page);
    const t = await ready(page);
    await locate(page).click();
    await expect(frame(page)).toBeVisible();
    await expect(frame(page)).toHaveAttribute("title", t.frameTitle);
    await expect(frame(page)).toHaveAttribute("src", new RegExp(`^${CALENDAR}`));
    await expect(card(page).locator("[data-agenda-panel]")).toHaveAttribute("data-state", "ready");
    // El calendario, no solo el borde de su tarjeta, queda a la vista.
    await expect(page.locator("#agenda-title")).toBeInViewport();
    await expect(frame(page)).toBeInViewport();
    expect(context.pages()).toHaveLength(1);
    expect(new URL(page.url()).pathname).toBe("/es");
  });
}

test("el botón del bloque carga el calendario, una sola vez", async ({ page }) => {
  await fakeCalendly(page);
  const t = await ready(page);
  await card(page).getByRole("button", { name: t.open }).click();
  await expect(frame(page)).toBeVisible();
  await page.locator("section[aria-labelledby='closing-title'] a[data-agenda]").first().click();
  await expect(frame(page)).toHaveCount(1);
});

// scheduling · Accesibilidad del bloque: Foco al abrir (L6-4)
test("con teclado, la acción lleva el foco al título del bloque y Tab entra en su contenido", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "en WebKit el tabulador no recorre enlaces por defecto");
  await fakeCalendly(page);
  await ready(page);
  await page.locator("section", { has: page.locator("h1") }).locator("a[data-agenda]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#agenda-title")).toBeFocused();
  await expect(frame(page)).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector("#agenda")!.contains(document.activeElement))).toBe(true);
});

// scheduling · Estados anunciados: mientras Calendly no da señales, el bloque dice que está cargando
test("mientras carga se anuncia; al llegar el calendario el aviso se retira", async ({ page }) => {
  await fakeCalendly(page, 1500);
  const t = await ready(page);
  await card(page).getByRole("button", { name: t.open }).click();
  const panel = card(page).locator("[data-agenda-panel]");
  await expect(panel).toHaveAttribute("data-state", "loading");
  await expect(card(page).getByRole("status")).toHaveText(t.loading);
  await expect(page.locator("#agenda-title")).toBeFocused();
  const violations = (await new AxeBuilder({ page }).include("#agenda").exclude("#agenda iframe").analyze()).violations;
  expect(violations).toEqual([]);
  await expect(panel).toHaveAttribute("data-state", "ready");
  await expect(card(page).getByRole("status")).toBeEmpty();
});

// scheduling · Idioma del calendario: el evento de Calendly está en inglés
test("en español se avisa de que el calendario está en inglés; en inglés no hay aviso", async ({ page }) => {
  const es = await ready(page, "es");
  await expect(card(page).getByText(es.languageNote)).toBeVisible();
  const en = await ready(page, "en");
  await expect(card(page).getByText(en.provider)).toBeVisible();
  await expect(card(page).getByText(en.languageNote)).toHaveCount(0);
});

// scheduling · Alternativa si el calendario no carga (L6-2)
test("con Calendly bloqueado aparece la alternativa: enlace directo y formulario", async ({ page }) => {
  await page.route(/calendly\.com/, (route) => route.abort());
  const t = await ready(page);
  await card(page).getByRole("button", { name: t.open }).click();
  const alert = card(page).getByRole("alert");
  await expect(alert).toContainText(t.unavailable);
  await expect(alert.getByRole("link", { name: new RegExp(t.openDirect) })).toHaveAttribute("href", CALENDAR);
  await alert.getByRole("link", { name: t.useForm }).click();
  await expect(page).toHaveURL(/#consulta$/);
  await expect(page.locator("#consulta")).toBeInViewport();
});

// scheduling · Confirmación con próximos pasos (L6-3)
for (const locale of ["es", "en"] as const) {
  test(`${locale}: al completarse la reserva se ven los próximos pasos`, async ({ page }) => {
    await fakeCalendly(page);
    const t = await ready(page, locale);
    await card(page).getByRole("button", { name: t.open }).click();
    await page.frameLocator("#agenda iframe").locator("#book").click();
    const status = card(page).getByRole("status");
    await expect(status).toContainText(t.confirmedTitle);
    for (const step of t.confirmedSteps) await expect(status).toContainText(step);
    await expect(status).toBeFocused();
    // El marco sigue ahí: Calendly muestra en él su propio resumen de la reserva.
    await expect(frame(page)).toBeVisible();
  });
}

test("un aviso de reserva que no viene de Calendly no muestra la confirmación", async ({ page }) => {
  await fakeCalendly(page);
  const t = await ready(page);
  await card(page).getByRole("button", { name: t.open }).click();
  await expect(frame(page)).toBeVisible();
  await page.evaluate(() => window.postMessage({ event: "calendly.event_scheduled", payload: {} }, "*"));
  await page.waitForTimeout(300);
  await expect(card(page).getByText(t.confirmedTitle)).toHaveCount(0);
});

// scheduling · Agenda sin JavaScript
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("las acciones son enlaces directos a Calendly y el bloque no ofrece el botón", async ({ page }) => {
    const t = getDictionary("es").agenda;
    await page.goto("/es");
    const actions = page.locator("a[data-agenda]");
    expect(await actions.count()).toBeGreaterThanOrEqual(3);
    for (const action of await actions.all()) {
      await expect(action).toHaveAttribute("href", CALENDAR);
      await expect(action).toHaveAttribute("target", "_blank");
    }
    await expect(card(page).locator("[data-agenda-open]")).toBeHidden();
    await expect(card(page).getByText(t.provider)).toBeHidden();
    await expect(card(page).getByRole("link", { name: new RegExp(t.openDirect) })).toBeVisible();
  });
});

// scheduling · Movimiento reducido
test.describe("con movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("la página llega al bloque sin desplazamiento animado", async ({ page }) => {
    await fakeCalendly(page);
    await ready(page);
    await page.locator("section", { has: page.locator("h1") }).locator("a[data-agenda]").click();
    // Sin animación, el bloque ya está en pantalla en el mismo instante del clic.
    const visibleNow = await page.evaluate(() => {
      const box = document.querySelector("#agenda-title")!.getBoundingClientRect();
      return box.top >= 0 && box.top < window.innerHeight;
    });
    expect(visibleNow).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });
});

// scheduling · Sin infracciones y dentro de presupuesto
for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]) {
  test(`a ${viewport.width} px: axe sin infracciones en reposo, con calendario, con reserva y sin servicio`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await fakeCalendly(page);
    const t = await ready(page);
    // El contenido del marco es de Calendly; se analiza lo nuestro.
    const scan = async () => (await new AxeBuilder({ page }).include("#agenda").exclude("#agenda iframe").analyze()).violations;
    const noOverflow = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    // Los cambios de color llevan una transición breve: se espera a que termine antes de medir.
    await expect.poll(scan).toEqual([]);

    await card(page).getByRole("button", { name: t.open }).click();
    await expect(frame(page)).toBeVisible();
    await expect.poll(scan).toEqual([]);
    await noOverflow();
    const box = (await frame(page).boundingBox())!;
    expect(box.height).toBeGreaterThan(400);

    await page.frameLocator("#agenda iframe").locator("#book").click();
    await expect(card(page).getByRole("status")).toContainText(t.confirmedTitle);
    await expect.poll(scan).toEqual([]);
    await noOverflow();

    await page.unroute("https://assets.calendly.com/**");
    await page.unroute("https://calendly.com/**");
    await page.route(/calendly\.com/, (route) => route.abort());
    await ready(page);
    await card(page).getByRole("button", { name: t.open }).click();
    await expect(card(page).getByRole("alert")).toBeVisible();
    await expect.poll(scan).toEqual([]);
    // Sin calendario no se reserva su hueco: la tarjeta no queda con un vacío.
    await expect(card(page).locator("[data-agenda-slot]")).toBeHidden();
    await noOverflow();
  });
}
