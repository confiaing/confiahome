import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// E2E contra el build de producción, con todos los servicios en memoria.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/es`,
    timeout: 180_000,
    // Nunca se reutiliza un servidor previo: daría verde contra un build obsoleto.
    reuseExistingServer: false,
    env: { SERVICES: "memory" },
  },
});
