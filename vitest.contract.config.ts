import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pruebas de contrato: adaptadores contra Supabase LOCAL. Requieren Docker.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["tests/contract/**/*.test.ts"] },
});
