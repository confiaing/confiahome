import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { getDictionary } from "../../src/i18n/dictionaries/index.ts";
import { getLegalDocument } from "../../src/i18n/legal/index.ts";

const PAGES = [
  ["es", "privacy", "/es/privacidad"],
  ["en", "privacy", "/en/privacy"],
  ["es", "terms", "/es/terminos"],
  ["en", "terms", "/en/terms"],
] as const;

for (const [locale, kind, path] of PAGES) {
  // legal-pages · Secciones presentes; Aviso de borrador; No se indexan (L8-1, L8-2)
  test(`${path}: texto completo, aviso de borrador y sin indexar`, async ({ page }) => {
    const document = getLegalDocument(locale, kind);
    const labels = getDictionary(locale).legal;
    await page.goto(path);
    await expect(page).toHaveTitle(`${document.title} · Confia.ing`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(document.title);
    await expect(page.locator("main h2")).toHaveText(document.sections.map((section) => section.heading));
    await expect(page.getByText(labels.draft)).toBeVisible();
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toBe("noindex, follow");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`https://confia.ing${path}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main")).not.toContainText(/[{}]/);
  });

  test(`${path}: accesible y sin desplazamiento horizontal a 375 y 1280 px`, async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
  });
}

// legal-pages · Datos pendientes a la vista
test("la política muestra como pendientes los datos del responsable que aún no existen", async ({ page }) => {
  const labels = getDictionary("es").legal;
  await page.goto("/es/privacidad");
  await expect(page.locator("mark[data-pending]")).toHaveText([labels.pending.name, labels.pending.id, labels.pending.address]);
  await expect(page.locator("mark[data-pending]").first()).toBeVisible();
});

test("el formulario enlaza a la política y esta existe en el idioma de la página", async ({ page }) => {
  for (const [locale, path] of [["es", "/es/privacidad"], ["en", "/en/privacy"]] as const) {
    await page.goto(`/${locale}`);
    const link = page.locator("#consulta").getByRole("link", { name: getDictionary(locale).contact.consentLink });
    await expect(link).toHaveAttribute("href", path);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(getLegalDocument(locale, "privacy").title);
  }
});

// legal-pages · Sin JavaScript
test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("el texto legal completo está en la página", async ({ page }) => {
    const document = getLegalDocument("es", "privacy");
    await page.goto("/es/privacidad");
    await expect(page.locator("main h2")).toHaveCount(document.sections.length);
    await expect(page.locator("main")).toContainText("Superintendencia de Industria y Comercio");
    await expect(page.locator("main").getByRole("link", { name: "hola@confia.ing" }).first()).toHaveAttribute("href", "mailto:hola@confia.ing");
  });
});
