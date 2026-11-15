import { defineConfig, devices } from "@playwright/test";

const PORT = 8791;

// E2E contra el runtime real de Workers (workerd), con servicios en memoria (.dev.vars).
// Aquí viven las cabeceras de seguridad y la tarea programada, que `next start` no tiene.
export default defineConfig({
  testDir: "tests/preview",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  globalTeardown: "./tests/preview/teardown.ts",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    // Antes de arrancar se libera el puerto: una ejecución interrumpida deja su servidor vivo.
    command: `(lsof -ti tcp:${PORT} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true) && npx opennextjs-cloudflare build && npx opennextjs-cloudflare preview --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/es`,
    timeout: 300_000,
    reuseExistingServer: false,
  },
});
