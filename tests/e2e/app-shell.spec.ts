import { expect, test } from "@playwright/test";

// app-shell · Rutas por idioma (docs/escenarios.md, L0-2)
test("/es responde 200 con lang=es", async ({ page }) => {
  const response = await page.goto("/es");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("/en responde 200 con lang=en", async ({ page }) => {
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("un idioma no admitido responde 404", async ({ request }) => {
  const response = await request.get("/fr");
  expect(response.status()).toBe(404);
});
