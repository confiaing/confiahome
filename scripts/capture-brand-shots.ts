import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Capturas para docs/brand/: la home sección a sección, el logo en archivo
// frente al logo en vivo, y el favicon a 16, 32 y 64 px.
// Uso: con la app servida (npm run build && npx next start -p 3100),
//      node scripts/capture-brand-shots.ts [http://127.0.0.1:3100]

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const OUT = fileURLToPath(new URL("../docs/brand/img/", import.meta.url));

const browser = await chromium.launch();

// La home, sección a sección, en escritorio y en móvil.
for (const [suffix, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
] as const) {
  const home = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await home.goto(`${BASE}/es`);
  await home.evaluate(() => document.fonts.ready);
  // La cabecera fija cruzaría las capturas de las secciones altas.
  await home.addStyleTag({ content: "[data-site-header]{position:static!important}" });
  const sections = home.locator("main > section");
  const names = ["hero", "start", "journey", "offer", "trust", "closing"];
  for (let index = 0; index < names.length; index += 1) {
    await sections.nth(index).screenshot({ path: `${OUT}home-${names[index]}-${suffix}.png` });
  }
  await home.close();
}

// El marco: menú abierto en móvil, una página legal y la 404.
{
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mobile.goto(`${BASE}/es`);
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.locator("#site-nav-toggle").click();
  await mobile.screenshot({ path: `${OUT}menu-mobile.png` });
  await mobile.goto(`${BASE}/en/no-existe`);
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({ path: `${OUT}not-found-mobile.png`, fullPage: true });
  await mobile.close();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await desktop.goto(`${BASE}/es/privacidad`);
  await desktop.evaluate(() => document.fonts.ready);
  await desktop.screenshot({ path: `${OUT}legal-desktop.png`, fullPage: true });
  await desktop.close();
}

const page = await browser.newPage({ viewport: { width: 1500, height: 700 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}/es`);
await page.evaluate(() => document.fonts.ready);

// Logo en vivo (componente) junto al archivo SVG, a 24 y 96 px, en claro y en oscuro.
await page.evaluate(() => {
  const live = document.querySelector('header [role="img"]')!;
  const main = document.querySelector("main")!;
  main.replaceChildren();
  main.className = "";
  const row = (theme: string, file: string, size: number) => {
    const box = document.createElement("div");
    box.className = theme;
    box.setAttribute("style", `display:flex; gap:40px; align-items:center; padding:20px 28px; font-size:${size}px`);
    const copy = live.cloneNode(true) as HTMLElement;
    copy.setAttribute("class", "inline-flex items-center gap-[0.42em] leading-none");
    const image = document.createElement("img");
    image.src = `/brand/${file}`;
    image.alt = "";
    // El archivo lleva 2 unidades de margen sobre un símbolo de 32: 36/32 de 1,3 em.
    image.style.height = `${(1.3 * 36) / 32}em`;
    box.append(copy, image);
    main.append(box);
  };
  row("theme-light", "logo.svg", 24);
  row("theme-light", "logo.svg", 96);
  row("theme-dark", "logo-dark.svg", 24);
  row("theme-dark", "logo-dark.svg", 96);
});
await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
await page.locator("main").screenshot({ path: `${OUT}logo-live-vs-file.png` });

// Variantes compacta y símbolo.
await page.evaluate(() => {
  const main = document.querySelector("main")!;
  main.replaceChildren();
  for (const [theme, files] of [
    ["theme-light", ["logo-compact.svg", "symbol.svg"]],
    ["theme-dark", ["logo-compact-dark.svg", "symbol-dark.svg"]],
  ] as const) {
    const box = document.createElement("div");
    box.className = theme;
    box.setAttribute("style", "display:flex; gap:56px; align-items:center; padding:28px");
    for (const file of files) {
      const image = document.createElement("img");
      image.src = `/brand/${file}`;
      image.alt = "";
      image.style.height = "120px";
      box.append(image);
    }
    main.append(box);
  }
});
await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
await page.locator("main").screenshot({ path: `${OUT}logo-variants.png` });

// Favicon a tamaño real y ampliado ×8, sobre claro y oscuro.
await page.evaluate(() => {
  const main = document.querySelector("main")!;
  main.replaceChildren();
  for (const theme of ["theme-light", "theme-dark"]) {
    const box = document.createElement("div");
    box.className = theme;
    box.setAttribute("style", "display:flex; gap:28px; align-items:center; padding:24px");
    for (const size of [16, 32, 64]) {
      const image = document.createElement("img");
      image.src = "/brand/favicon.svg";
      image.alt = "";
      image.width = size;
      image.height = size;
      box.append(image);
    }
    const zoom = document.createElement("img");
    zoom.src = "/brand/favicon-32.png";
    zoom.alt = "";
    zoom.width = 128;
    zoom.height = 128;
    zoom.style.imageRendering = "pixelated";
    box.append(zoom);
    main.append(box);
  }
});
await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
await page.locator("main").screenshot({ path: `${OUT}favicon-sizes.png` });

await browser.close();
console.log(`Capturas guardadas en ${OUT}`);
