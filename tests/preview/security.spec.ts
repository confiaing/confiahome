import { expect, test, type Page } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";
import { fakeCalendly } from "../e2e/support/calendly.ts";

const HTML_PAGES = ["/es", "/en", "/es/privacidad", "/en/terms", "/es/no-existe"];
const nonceOf = (policy: string) => /'nonce-([^']+)'/.exec(policy)?.[1];

/** Recoge lo que el navegador bloquea por la política de contenido. */
async function watchViolations(page: Page) {
  const found: string[] = [];
  await page.exposeFunction("__violation", (text: string) => void found.push(text));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) =>
      (window as unknown as { __violation(text: string): void }).__violation(`${event.effectiveDirective} ← ${event.blockedURI || "inline"}`),
    );
  });
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to (load|execute|apply|frame|connect)/i.test(message.text())) found.push(message.text().slice(0, 200));
  });
  return found;
}

// security-headers · Cabeceras en todas las respuestas (L9-5)
for (const path of HTML_PAGES) {
  test(`${path}: cabeceras de seguridad y política de contenido`, async ({ request }) => {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["content-type"]).toContain("text/html");
    expect(headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-powered-by"]).toBeUndefined();
    const policy = headers["content-security-policy"]!;
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("default-src 'self'");
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/);

    // security-headers · Cada script del HTML lleva la autorización de esa respuesta
    const nonce = nonceOf(policy)!;
    expect(atob(nonce).length).toBeGreaterThanOrEqual(16);
    const scripts = [...(await response.text()).matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]!);
    expect(scripts.length).toBeGreaterThan(3);
    for (const attributes of scripts) expect(attributes).toContain(`nonce="${nonce}"`);
  });
}

test("el código cambia en cada respuesta", async ({ request }) => {
  const nonces = await Promise.all([1, 2, 3, 4].map(async () => nonceOf((await request.get("/es")).headers()["content-security-policy"]!)));
  expect(new Set(nonces).size).toBe(4);
});

test("lo que no es HTML también va protegido", async ({ request }) => {
  const origin = "http://127.0.0.1:8791";
  const responses = {
    robots: await request.get("/robots.txt"),
    llms: await request.get("/llms.txt"),
    sitemap: await request.get("/sitemap.xml"),
    redirect: await request.get("/", { maxRedirects: 0 }),
    api: await request.post("/api/events", { headers: { origin, "content-type": "application/json" }, data: { name: "otro" } }),
    asset: await request.get("/brand/logo.svg"),
  };
  expect(responses.redirect.status()).toBe(307);
  expect(responses.api.status()).toBe(400);
  for (const [name, response] of Object.entries(responses)) {
    const headers = response.headers();
    expect(headers["strict-transport-security"], name).toBe("max-age=31536000; includeSubDomains");
    expect(headers["x-content-type-options"], name).toBe("nosniff");
    expect(headers["x-powered-by"], name).toBeUndefined();
  }
  for (const name of ["robots", "llms", "sitemap", "redirect", "api"] as const) {
    expect(responses[name].headers()["content-security-policy"], name).toBe("default-src 'none'; frame-ancestors 'none'");
  }
});

test("los archivos con huella en el nombre se guardan en caché un año", async ({ page, request }) => {
  await page.goto("/es");
  const chunk = await page.locator('script[src^="/_next/static/"]').first().getAttribute("src");
  const response = await request.get(chunk!);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

// security-headers · La página funciona entera con la política
for (const mode of ["completa", "ligera"] as const) {
  test(`versión ${mode}: uso completo del sitio sin una sola infracción de la política`, async ({ page }) => {
    const es = getDictionary("es");
    const violations = await watchViolations(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((value) => window.localStorage.setItem("confia-modo", value), mode);
    await fakeCalendly(page);

    await page.goto("/es");
    await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
    await expect(page.locator("html")).toHaveAttribute("data-mode", mode === "completa" ? "full" : "lite");
    for (const stage of [2, 4, 5]) {
      await page.locator(`#tab-etapa-${stage}`).click();
      await expect(page.locator(`#etapa-${stage}`)).toBeVisible();
    }

    // Flujo B, contra el servidor real del Worker (servicios en memoria).
    const card = page.locator("#consulta");
    await card.getByRole("button", { name: es.contact.classic, exact: true }).click();
    await card.getByLabel(es.contact.fields.name, { exact: false }).fill("Ana");
    await card.getByLabel(es.contact.fields.email, { exact: false }).fill("ana@empresa.com");
    await card.getByRole("checkbox").check();
    const sent = page.waitForResponse((response) => response.url().endsWith("/api/contact"));
    await card.getByRole("button", { name: es.contact.submit }).click();
    expect((await sent).status()).toBe(201);
    await expect(card.getByRole("status")).toHaveText(es.contact.success);

    // Flujo A: el script y el marco de Calendly caben en la política.
    await page.locator("#agenda [data-agenda-open]").click();
    await expect(page.locator("#agenda iframe")).toBeVisible();
    await page.frameLocator("#agenda iframe").locator("#book").click();
    await expect(page.locator("#agenda").getByRole("status")).toContainText(es.agenda.confirmedTitle);

    // Páginas legales y 404.
    await page.goto("/es/privacidad");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de privacidad");
    await page.goto("/es/no-existe");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.waitForTimeout(300);
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("los terceros declarados caben: Turnstile y Cloudflare Insights", async ({ page }) => {
  const violations = await watchViolations(page);
  await page.route("https://challenges.cloudflare.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: "window.__turnstileLoaded = true;" }));
  await page.route("https://static.cloudflareinsights.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: "window.__insightsLoaded = true;" }));
  await page.goto("/es");
  const loaded = await page.evaluate(async () => {
    const load = (src: string) =>
      new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.append(script);
      });
    return [await load("https://challenges.cloudflare.com/turnstile/v0/api.js"), await load("https://static.cloudflareinsights.com/beacon.min.js")];
  });
  expect(loaded).toEqual([true, true]);
  expect(violations).toEqual([]);
});

// security-headers · Un script insertado sin el código no se ejecuta; un tercero no declarado se bloquea
test("la política frena lo que no debe ejecutarse", async ({ page }) => {
  const violations = await watchViolations(page);
  await page.route("https://evil.example/**", (route) => route.fulfill({ contentType: "text/javascript", body: "window.__evil = 'externo';" }));
  await page.goto("/es");
  const result = await page.evaluate(async () => {
    const marks = window as unknown as { __evil?: string; __inline?: boolean; __handler?: boolean };
    const inline = document.createElement("script");
    inline.textContent = "window.__inline = true;";
    document.head.append(inline);

    const external = await new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://evil.example/x.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.append(script);
    });

    const holder = document.createElement("div");
    holder.innerHTML = '<img src="x" onerror="window.__handler = true">';
    document.body.append(holder);
    const frame = document.createElement("iframe");
    frame.src = "https://evil.example/frame";
    document.body.append(frame);
    await new Promise((done) => setTimeout(done, 400));
    return { inline: marks.__inline === true, external, evil: marks.__evil, handler: marks.__handler === true };
  });
  expect(result).toEqual({ inline: false, external: false, evil: undefined, handler: false });
  expect(violations.some((text) => text.startsWith("script-src"))).toBe(true);
  expect(violations.some((text) => text.startsWith("frame-src"))).toBe(true);
});

// El Worker sella todos los scripts del HTML (ADR-0016). Next.js copia en uno de sus scripts
// de datos la ruta y los parámetros pedidos: esta prueba vigila que lleguen siempre
// codificados y dentro de una cadena, nunca como marcado ni como código.
test("lo que viene en la dirección solo llega al HTML codificado, dentro de los datos de Next.js", async ({ request }) => {
  const MARK = "zzinyectadozz";
  const HOSTILE = `%3C%2Fscript%3E%3Cscript%3E${MARK}%3C%2Fscript%3E%22%27%5C%3Cimg%20src%3Dx%20onerror%3D${MARK}%3E`;
  const paths = [`/es?x=${HOSTILE}`, `/es/${HOSTILE}`, `/${HOSTILE}`, `/es/privacidad?${MARK}=${HOSTILE}`, `/en/terms/${HOSTILE}?y=${HOSTILE}`];
  for (const path of paths) {
    const response = await request.get(path, { headers: { referer: `http://127.0.0.1:8791/es?${MARK}`, "user-agent": `Mozilla/5.0 ${MARK}`, cookie: `locale=${MARK}` } });
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]!);

    // Fuera de los scripts no aparece en ningún sitio: ni en el texto ni en un atributo.
    expect(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").includes(MARK), path).toBe(false);
    // Nunca como marcado: ni etiquetas ni manejadores armados con lo recibido.
    expect(html).not.toMatch(new RegExp(`<script>${MARK}|onerror=${MARK}|<img src=x`));

    for (const script of scripts.filter((item) => item.includes(MARK))) {
      // Es una entrega de datos de Next.js: una sola cadena, bien cerrada…
      expect(script.trim(), path).toMatch(/^self\.__next_f\.push\(\[1,"(?:[^"\\]|\\.)*"\]\)$/);
      // …sin ningún «<» crudo, y con lo recibido todavía codificado.
      expect(script).not.toContain("<");
      const around = script.slice(Math.max(0, script.indexOf(MARK) - 12), script.indexOf(MARK));
      expect(around, path).toMatch(/%3E|%3D|[=?]$/);
    }
    // Las cabeceras de la petición no se reflejan.
    expect((html.match(new RegExp(MARK, "g")) ?? []).length, path).toBeLessThanOrEqual(8);
  }
});

test("los archivos de marca no pueden ejecutar ni incrustarse", async ({ request }) => {
  const headers = (await request.get("/brand/logo.svg")).headers();
  expect(headers["content-security-policy"]).toContain("default-src 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
});

// security-headers · Compatibilidad con el cambio de idioma
test("desde una página legal, cambiar de idioma lleva a la equivalente", async ({ page, isMobile }) => {
  test.skip(isMobile, "en móvil el selector de idioma vive en el menú plegado; se cubre en escritorio");
  await page.goto("/es/privacidad");
  await page.locator("a[data-locale-switch]").first().click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
});

// scheduled-maintenance · Latido diario: el disparo programado se ejecuta en el Worker
test("el disparo programado se ejecuta sin error", async ({ request }) => {
  const response = await request.get("/cdn-cgi/handler/scheduled");
  expect(response.status()).toBe(200);
});

// Fallo real en producción (2026-11-16): al recargar, el 304 llevaba la política de lo que no
// es HTML y el navegador la aplicaba a la página guardada, que quedaba sin estilos ni scripts.
test("recargar la página no la rompe: sigue activa, con estilos y sin infracciones", async ({ page }) => {
  const violations = await watchViolations(page);
  await page.goto("/es");
  await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
  for (let round = 0; round < 2; round += 1) {
    await page.reload();
    await page.waitForFunction(() => document.querySelector("[data-agenda-panel]")?.hasAttribute("data-hydrated"));
    const styled = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily.toLowerCase().includes("fraunces"));
    expect(styled).toBe(true);
  }
  expect(violations).toEqual([]);
});

test("una respuesta «no modificado» no trae la política de los archivos que no son páginas", async ({ request }) => {
  const first = await request.get("/es");
  const etag = first.headers()["etag"];
  test.skip(!etag, "el servidor no envía ETag en esta página");
  const second = await request.get("/es", { headers: { "if-none-match": etag! } });
  expect([200, 304]).toContain(second.status());
  const policy = second.headers()["content-security-policy"];
  if (second.status() === 304) expect(policy).toBeUndefined();
  else expect(policy).toContain("script-src");
});

