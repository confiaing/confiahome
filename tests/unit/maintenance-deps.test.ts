import { describe, expect, it } from "vitest";
import { loadServerEnv } from "@/lib/server/env";
import { createMaintenanceDeps } from "@/lib/server/maintenance";
import { runMaintenance } from "@/domain/maintenance/run-maintenance";

// scheduled-maintenance · La tarea diaria se compone desde el entorno del Worker
describe("dependencias de la tarea diaria", () => {
  it("sin SERVICES=real usa adaptadores en memoria y no toca ninguna red", async () => {
    for (const source of [{}, { SERVICES: "memory" }, { SERVICES: " " }]) {
      const summary = await runMaintenance(createMaintenanceDeps(source), new Date("2026-11-15T03:10:00.000Z"));
      expect(summary).toEqual({ heartbeat: true, contactsPurged: 0, eventsPurged: 0 });
    }
  });

  it("con SERVICES=real exige la dirección y la clave de Supabase, y el error no las repite", () => {
    expect(() => createMaintenanceDeps({ SERVICES: "real", SUPABASE_URL: "http://127.0.0.1:54321" })).toThrow(/SUPABASE_SECRET_KEY/);
    expect(() => createMaintenanceDeps({ SERVICES: "real", SUPABASE_SECRET_KEY: "sb_secret_prueba" })).toThrow(/SUPABASE_URL/);
    let message = "";
    try {
      createMaintenanceDeps({ SERVICES: "real", SUPABASE_SECRET_KEY: "sb_secret_prueba" });
    } catch (error) {
      message = (error as Error).message;
      expect((error as Error).name).toBe("EnvError");
    }
    expect(message).not.toBe("");
    expect(message).not.toContain("sb_secret_prueba");
  });

  it("lee el modo de servicios con la misma regla que el resto del servidor", () => {
    for (const source of [{ SERVICES: "produccion" }, { SERVICES: "REAL" }]) {
      expect(() => createMaintenanceDeps(source)).toThrow(/SERVICES no es válido/);
      expect(() => loadServerEnv(source)).toThrow(/SERVICES no es válido/);
    }
  });

  it("con todo lo necesario, se compone sin hacer ninguna petición", () => {
    const deps = createMaintenanceDeps({ SERVICES: "real", SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SECRET_KEY: "k" });
    expect(Object.keys(deps).sort()).toEqual(["contacts", "events", "health", "logger"]);
  });

  it("un modo desconocido es un error, no un modo en memoria silencioso", () => {
    expect(() => createMaintenanceDeps({ SERVICES: "produccion" })).toThrow();
  });
});
