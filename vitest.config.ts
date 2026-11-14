import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    // Sin red: cualquier fetch real hace fallar la prueba (tests/setup/no-network.ts).
    setupFiles: ["tests/setup/no-network.ts"],
    projects: [
      {
        extends: true,
        test: { name: "unit", environment: "node", include: ["tests/unit/**/*.test.{ts,tsx}"] },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "jsdom",
          include: ["tests/integration/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/setup/no-network.ts", "tests/setup/dom.ts"],
        },
      },
    ],
  },
});
