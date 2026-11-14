import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { architecture } from "./eslint.architecture.mjs";

export default tseslint.config(
  {
    ignores: [
      "node_modules/", ".next/", ".open-next/", ".wrangler/", "coverage/", "playwright-report/",
      "test-results/", "next-env.d.ts", "docs/", "supabase/", ".claude/",
      // Archivos que violan las reglas a propósito; se comprueban desde tests/unit/.
      "tests/fixtures/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "@next/next": nextPlugin },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  ...architecture,
  {
    // Archivos de declaración: ampliar una interfaz ajena exige repetir su firma tal cual.
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
