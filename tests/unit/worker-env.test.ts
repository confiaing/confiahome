import { describe, expect, it } from "vitest";
import { findEmbeddedSecrets } from "../../scripts/lib/worker-env";

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

  it("solo mira producción: lo que se despliega", () => {
    expect(findEmbeddedSecrets({ development: { SUPABASE_SECRET_KEY: "x" }, production: {} })).toEqual([]);
  });

  it("trata como secreto todo lo que termine en _KEY, _SECRET, _TOKEN o _PASSWORD sin ser público", () => {
    const embedded = { production: { API_TOKEN: "a", DB_PASSWORD: "b", NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "c", SUPABASE_PUBLISHABLE_KEY: "d" } };
    expect(findEmbeddedSecrets(embedded)).toEqual(["API_TOKEN", "DB_PASSWORD"]);
  });
});
