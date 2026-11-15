import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Comprobación manual de la agenda contra el Calendly REAL, con capturas para docs/brand/.
// No es una prueba automática: sale a la red. No completa ninguna reserva.
// Uso: con la app servida (npm run build && npx next start -p 3100),
//      node scripts/capture-agenda-shots.ts [http://127.0.0.1:3100]

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const OUT = fileURLToPath(new URL("../docs/brand/img/", import.meta.url));
const browser = await chromium.launch();

for (const locale of ["es", "en"] as const) {
  for (const [suffix, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const requests: string[] = [];
    page.on("request", (request) => {
      if (/calendly\.com/.test(request.url())) requests.push(new URL(request.url()).host);
    });
    await page.addInitScript(() => window.localStorage.setItem("confia-modo", "ligera"));
    await page.goto(`${BASE}/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "[data-site-header]{position:static!important}" });
    const card = page.locator("#agenda");
    const panel = card.locator("[data-agenda-panel][data-hydrated]");
    await panel.waitFor();
    const before = requests.length;
    if (locale === "es") await card.screenshot({ path: `${OUT}agenda-idle-${suffix}.png` });

    const started = Date.now();
    await card.locator("[data-agenda-open]").click();
    await card.locator('[data-agenda-panel][data-state="ready"]').waitFor({ timeout: 40_000 });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const frame = card.locator("iframe");
    await page.frameLocator("#agenda iframe").locator("h1").first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    console.log(
      `${locale} ${suffix}: peticiones a Calendly antes del clic ${before}; listo en ${seconds} s; ` +
        `título del marco «${await frame.getAttribute("title")}»; hosts ${[...new Set(requests)].join(", ")}`,
    );
    if (locale === "es") await card.screenshot({ path: `${OUT}agenda-ready-${suffix}.png` });
    await page.close();
  }
}
await browser.close();
