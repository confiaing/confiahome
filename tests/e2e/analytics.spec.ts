import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";

type Sent = { name: string; locale: string; device: string; path: string; utmSource?: string; referrerHost?: string; formMode?: string } & Record<string, unknown>;

/**
 * Registra lo que la página envía a /api/events. Playwright no deja leer el cuerpo de un
 * sendBeacon, así que se copia en el navegador justo antes de entregarlo al de verdad;
 * el envío real sigue ocurriendo y su respuesta se comprueba aparte.
 */
async function watch(page: Page) {
  const events: Sent[] = [];
  const statuses: number[] = [];
  await page.exposeFunction("__recordEvent", (body: string) => void events.push(JSON.parse(body) as Sent));
  await page.addInitScript(() => {
    const record = (window as unknown as { __recordEvent(body: string): void }).__recordEvent;
    // El texto se toma al crear el Blob, de forma síncrona: leerlo después no da tiempo
    // cuando el evento se envía justo antes de salir de la página.
    const texts = new WeakMap<Blob, string>();
    const NativeBlob = window.Blob;
    window.Blob = class extends NativeBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (options?.type === "application/json" && typeof parts?.[0] === "string") texts.set(this, parts[0]);
      }
    };
    const original = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      const text = data instanceof NativeBlob ? texts.get(data) : undefined;
      if (String(url) === "/api/events" && text) record(text);
      return original(url, data);
    };
  });
  page.on("response", (response) => {
    if (new URL(response.url()).pathname === "/api/events") statuses.push(response.status());
  });
  const names = () => events.map((event) => event.name);
  return { events, statuses, names };
}

const hero = (page: Page) => page.locator("section", { has: page.locator("h1") });

// analytics-instrumentation · Qué se mide y cuándo; Contexto de cada evento (L7-4)
test("al cargar se envía una única vista de página, con su contexto, y el servidor la acepta", async ({ page, isMobile }) => {
  const seen = await watch(page);
  await page.goto("/en?utm_source=linkedin&utm_medium=social&utm_campaign=q4");
  await expect.poll(seen.names).toEqual(["page_view"]);
  expect(seen.events[0]).toEqual({
    name: "page_view",
    locale: "en",
    device: isMobile ? "mobile" : "desktop",
    path: "/en",
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "q4",
  });
  await expect.poll(() => seen.statuses).toEqual([204]);
  await page.waitForTimeout(500);
  expect(seen.names()).toEqual(["page_view"]);
});

test("las acciones de contacto envían su evento, uno por activación", async ({ page }) => {
  const seen = await watch(page);
  await page.goto("/es?utm_source=boletin");
  await expect.poll(seen.names).toEqual(["page_view"]);
  await hero(page).locator('a[data-cta="contact"]').click();
  await expect.poll(seen.names).toEqual(["page_view", "cta_contact_click"]);
  expect(seen.events[1]).toMatchObject({ locale: "es", path: "/es", utmSource: "boletin" });
  await page.locator("section[aria-labelledby='closing-title'] a[data-cta='contact']").click();
  await expect.poll(seen.names).toEqual(["page_view", "cta_contact_click", "cta_contact_click"]);
});

test("agendar: se cuenta el clic, la apertura del calendario y la reserva", async ({ page }) => {
  await page.route("https://assets.calendly.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.Calendly = { initInlineWidget: function (o) { var f = document.createElement("iframe"); f.src = o.url; o.parentElement.appendChild(f); } };`,
    }),
  );
  await page.route("https://calendly.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>x</title><button id="book">Book</button><script>
        parent.postMessage({ event: "calendly.event_type_viewed" }, "*");
        document.getElementById("book").onclick = function () { parent.postMessage({ event: "calendly.event_scheduled", payload: { invitee: { uri: "https://api.calendly.com/x" } } }, "*"); };
      </script>`,
    }),
  );
  const seen = await watch(page);
  await page.goto("/es");
  await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
  await hero(page).locator("a[data-agenda]").click();
  await expect.poll(seen.names).toEqual(["page_view", "cta_schedule_click", "calendar_opened"]);
  await page.frameLocator("#agenda iframe").locator("#book").click();
  await expect.poll(seen.names).toEqual(["page_view", "cta_schedule_click", "calendar_opened", "meeting_scheduled"]);
  // De la reserva solo se sabe que ocurrió.
  expect(JSON.stringify(seen.events)).not.toContain("calendly.com");
});

for (const mode of ["terminal", "classic"] as const) {
  test(`formulario en modo ${mode}: iniciado una vez y enviado, sin nada de lo escrito`, async ({ page }) => {
    const t = getDictionary("es").contact;
    const seen = await watch(page);
    await page.goto("/es");
    const card = page.locator("#consulta");
    await expect(card.getByRole("button", { name: t.submit })).toBeEnabled();
    if (mode === "classic") await card.getByRole("button", { name: t.classic, exact: true }).click();
    await card.getByLabel(t.fields.name, { exact: false }).fill("Ana Ruiz Secreta");
    await card.getByLabel(t.fields.email, { exact: false }).fill("ana.secreta@empresa.com");
    await card.getByLabel(t.fields.message, { exact: false }).fill("Texto confidencial del mensaje");
    await card.getByRole("checkbox").check();
    await card.getByRole("button", { name: t.submit }).click();
    await expect(card.getByRole("status")).toHaveText(t.success);
    await expect.poll(seen.names).toEqual(["page_view", "form_started", "form_submitted"]);
    expect(seen.events.slice(1).map((event) => event.formMode)).toEqual([mode, mode]);
    expect(JSON.stringify(seen.events)).not.toMatch(/Secreta|secreta|confidencial/);
  });
}

test("cambiar de idioma envía su evento antes de salir, y la página nueva cuenta su vista", async ({ page, isMobile }) => {
  test.skip(isMobile, "en móvil el selector de idioma vive en el menú plegado; se cubre en escritorio");
  const seen = await watch(page);
  await page.goto("/es");
  await expect.poll(seen.names).toEqual(["page_view"]);
  await page.locator("a[data-locale-switch]").first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect.poll(seen.names).toEqual(["page_view", "language_switched", "page_view"]);
  expect(seen.events.map((event) => event.locale)).toEqual(["es", "es", "en"]);
});

// analytics-instrumentation · Respeto de la preferencia de no rastreo
test("con Global Privacy Control no se envía ningún evento", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/events") requests.push(request.method());
  });
  await page.goto("/es");
  // Se espera a que la página esté activa: sin esto, «no envió nada» también sería verdad por no haber cargado.
  await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
  await hero(page).locator('a[data-cta="contact"]').click();
  await page.waitForTimeout(600);
  expect(requests).toEqual([]);
});

// analytics-instrumentation · La medición no afecta a la página
test("si el servidor de eventos falla, la página y el formulario funcionan igual", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/events", (route) => route.abort());
  const t = getDictionary("es").contact;
  await page.goto("/es");
  const card = page.locator("#consulta");
  await expect(card.getByRole("button", { name: t.submit })).toBeEnabled();
  await hero(page).locator('a[data-cta="contact"]').click();
  await expect(card).toBeInViewport();
  await card.getByLabel(t.fields.name, { exact: false }).fill("Ana");
  await card.getByLabel(t.fields.email, { exact: false }).fill("ana@empresa.com");
  await card.getByRole("checkbox").check();
  await card.getByRole("button", { name: t.submit }).click();
  await expect(card.getByRole("status")).toHaveText(t.success);
  await expect(card.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("la medición no deja cookies ni nada nuevo en el almacenamiento", async ({ page, context }) => {
  const seen = await watch(page);
  await page.goto("/es?utm_source=boletin");
  await hero(page).locator('a[data-cta="contact"]').click();
  await expect.poll(seen.names).toEqual(["page_view", "cta_contact_click"]);
  expect(await context.cookies()).toEqual([]);
  const stored = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
  expect(stored.session).toEqual([]);
  // Solo la preferencia funcional de versión de la escena, si se llegó a guardar.
  expect(stored.local.filter((key) => key !== "confia-modo")).toEqual([]);
});

// analytics-instrumentation · Visitas con Cloudflare Web Analytics (L7-1)
test("sin token de Web Analytics no se pide nada a Cloudflare Insights ni hay script", async ({ page }) => {
  const hosts: string[] = [];
  page.on("request", (request) => hosts.push(new URL(request.url()).host));
  await page.goto("/es");
  await page.waitForLoadState("networkidle");
  expect(hosts.filter((host) => host.includes("cloudflareinsights"))).toEqual([]);
  await expect(page.locator("script[data-cf-beacon]")).toHaveCount(0);
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("no se mide y las acciones siguen ahí", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/events") requests.push(request.method());
    });
    await page.goto("/es");
    await expect(hero(page).locator('a[data-cta="contact"]')).toHaveAttribute("href", "#consulta");
    await hero(page).locator('a[data-cta="contact"]').click();
    await page.waitForTimeout(400);
    expect(requests).toEqual([]);
  });
});

test("una página que no existe también cuenta su vista", async ({ page }) => {
  const seen = await watch(page);
  await page.goto("/es/no-existe-secreto");
  await expect.poll(seen.names).toEqual(["page_view"]);
  await expect.poll(() => seen.statuses).toEqual([204]);
});
