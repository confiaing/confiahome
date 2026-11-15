import { describe, expect, it } from "vitest";
import { findEmbeddedSecrets, keepProductionOnly } from "../../scripts/lib/worker-env";

// OpenNext incrusta los archivos .env en el Worker: ningún secreto debe viajar ahí.
describe("variables incrustadas en el Worker", () => {
  it("detecta un secreto con valor en el bloque de producción", () => {
    const embedded = { production: { SERVICES: "memory", SUPABASE_SECRET_KEY: "sb_secret_x", TURNSTILE_SECRET_KEY: "t" } };
    expect(findEmbeddedSecrets(embedded)).toEqual(["SUPABASE_SECRET_KEY", "TURNSTILE_SECRET_KEY"]);
  });

  it("ignora los secretos vacíos y las variables públicas", () => {
    const embedded = { production: { SUPABASE_SECRET_KEY: "", NEXT_PUBLIC_SITE_URL: "https://confia.ing", NOTIFY_FROM: "web@confia.ing" } };
    expect(findEmbeddedSecrets(embedded)).toEqual([]);
  });

  // OpenNext incrusta tres bloques (producción, desarrollo y pruebas) y los tres viajan en el Worker.
  it("mira los tres bloques: un secreto de desarrollo también se subiría", () => {
    expect(findEmbeddedSecrets({ development: { SUPABASE_SECRET_KEY: "x" }, production: {}, test: { API_TOKEN: "y" } })).toEqual(["API_TOKEN", "SUPABASE_SECRET_KEY"]);
    expect(findEmbeddedSecrets({ production: {}, development: {}, test: {} })).toEqual([]);
  });

  it("no repite un nombre que aparece en varios bloques", () => {
    expect(findEmbeddedSecrets({ production: { A_KEY: "1" }, development: { A_KEY: "2" } })).toEqual(["A_KEY"]);
  });

  it("trata como secreto todo lo que termine en _KEY, _SECRET, _TOKEN o _PASSWORD sin ser público", () => {
    const embedded = { production: { API_TOKEN: "a", DB_PASSWORD: "b", NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "c", SUPABASE_PUBLISHABLE_KEY: "d" } };
    expect(findEmbeddedSecrets(embedded)).toEqual(["API_TOKEN", "DB_PASSWORD"]);
  });

  // El Worker que se despliega solo necesita el bloque de producción.
  it("vacía los bloques de desarrollo y de pruebas y deja intacto el de producción", () => {
    const source = [
      'export const production = {"NEXT_PUBLIC_SITE_URL":"https://confia.ing"};',
      'export const development = {"SUPABASE_SECRET_KEY":"sb_secret_local","SERVICES":"real"};',
      'export const test = {"API_TOKEN":"x"};',
      "",
    ].join("\n");
    const cleaned = keepProductionOnly(source);
    expect(cleaned).toContain('export const production = {"NEXT_PUBLIC_SITE_URL":"https://confia.ing"};');
    expect(cleaned).toContain("export const development = {};");
    expect(cleaned).toContain("export const test = {};");
    expect(cleaned).not.toContain("sb_secret_local");
    expect(keepProductionOnly(cleaned)).toBe(cleaned);
  });

  it("si el archivo no tiene la forma esperada, falla en vez de dar por bueno algo que no entendió", () => {
    expect(() => keepProductionOnly("module.exports = {}")).toThrow();
    expect(() => keepProductionOnly('export const production = {};\nexport const development = cargar();\nexport const test = {};')).toThrow();
  });
});
