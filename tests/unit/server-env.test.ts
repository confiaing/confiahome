import { describe, expect, it } from "vitest";
import { loadServerEnv } from "@/lib/server/env";

// environment-config (docs/escenarios.md, L0-5)
const REAL = {
  SERVICES: "real",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SECRET_KEY: "sb_secret_valor-de-prueba",
  TURNSTILE_SECRET_KEY: "turnstile-valor-de-prueba",
  NOTIFY_FROM: "web@confia.ing",
  NOTIFY_TO: "equipo@example.com",
};

describe("selección de servicios", () => {
  it("sin SERVICES asume memory", () => {
    expect(loadServerEnv({}).services).toBe("memory");
  });

  it("memory no exige ningún secreto", () => {
    expect(() => loadServerEnv({ SERVICES: "memory" })).not.toThrow();
  });

  it("un valor desconocido falla indicando los valores admitidos", () => {
    expect(() => loadServerEnv({ SERVICES: "otro" })).toThrow(/memory.*real/);
  });
});

const without = (key: keyof typeof REAL) =>
  Object.fromEntries(Object.entries(REAL).filter(([name]) => name !== key));

describe("validación de secretos", () => {
  it("con real, un secreto ausente falla nombrando la variable", () => {
    expect(() => loadServerEnv(without("SUPABASE_SECRET_KEY"))).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("el mensaje de error no revela el valor de ninguna variable", () => {
    const withoutSecret = without("SUPABASE_SECRET_KEY");
    let message = "";
    try {
      loadServerEnv(withoutSecret);
    } catch (error) {
      message = String((error as Error).message);
    }
    expect(message).not.toBe("");
    const secrets = Object.entries(withoutSecret).filter(([name]) => name !== "SERVICES");
    for (const [, value] of secrets) expect(message).not.toContain(value);
  });

  it("nombra todas las variables que faltan, no solo la primera", () => {
    expect(() => loadServerEnv({ SERVICES: "real" })).toThrow(/SUPABASE_URL[\s\S]*SUPABASE_SECRET_KEY/);
  });

  it("con real y todo presente devuelve la configuración sin valores vacíos", () => {
    const env = loadServerEnv(REAL);
    expect(env.services).toBe("real");
    if (env.services !== "real") throw new Error("inalcanzable");
    expect(env.supabaseUrl).toBe(REAL.SUPABASE_URL);
    expect(Object.values(env).every((v) => v !== "")).toBe(true);
  });

  it("trata una variable vacía como ausente", () => {
    expect(() => loadServerEnv({ ...REAL, NOTIFY_TO: "" })).toThrow(/NOTIFY_TO/);
  });
});
