import { describe, expect, it, vi } from "vitest";
import { decideMode, type Capabilities } from "@/domain/scene/mode";
import { PREFERENCE_KEY, readPreference, writePreference } from "@/lib/scene-preference";

const capable: Capabilities = { webgl: true, reducedMotion: false };

// scene-rendering · Elección automática de versión (L4-7)
describe("decideMode", () => {
  it("sin WebGL es ligero, diga lo que diga la elección guardada", () => {
    expect(decideMode({ ...capable, webgl: false }, null)).toEqual({ mode: "lite", reason: "no-webgl" });
    expect(decideMode({ ...capable, webgl: false }, "full")).toEqual({ mode: "lite", reason: "no-webgl" });
  });

  it.each([
    ["movimiento reducido", { reducedMotion: true }, "reduced-motion"],
    ["ahorro de datos", { saveData: true }, "save-data"],
    ["conexión 3g", { effectiveType: "3g" }, "slow-connection"],
    ["conexión 2g", { effectiveType: "2g" }, "slow-connection"],
    ["conexión slow-2g", { effectiveType: "slow-2g" }, "slow-connection"],
    ["2 GB de memoria", { deviceMemory: 2 }, "low-end-device"],
    ["1 GB de memoria", { deviceMemory: 1 }, "low-end-device"],
    ["2 núcleos", { hardwareConcurrency: 2 }, "low-end-device"],
  ] as const)("%s → ligero, con su motivo", (_name, extra, reason) => {
    expect(decideMode({ ...capable, ...extra }, null)).toEqual({ mode: "lite", reason });
  });

  it("equipo capaz y sin restricciones → completo", () => {
    expect(decideMode(capable, null)).toEqual({ mode: "full", reason: null });
    expect(decideMode({ ...capable, effectiveType: "4g", deviceMemory: 8, hardwareConcurrency: 8, saveData: false }, null)).toEqual({
      mode: "full",
      reason: null,
    });
  });

  it("lo que el navegador no informa no cuenta como restricción", () => {
    expect(decideMode({ webgl: true, reducedMotion: false, deviceMemory: undefined, effectiveType: undefined }, null).mode).toBe("full");
  });

  it("la elección del visitante manda sobre lo automático", () => {
    expect(decideMode({ ...capable, effectiveType: "3g", reducedMotion: true }, "full")).toEqual({ mode: "full", reason: null });
    expect(decideMode(capable, "lite")).toEqual({ mode: "lite", reason: "chosen" });
  });

  it("el movimiento reducido es el primer motivo cuando concurren varios", () => {
    expect(decideMode({ ...capable, reducedMotion: true, saveData: true, deviceMemory: 1 }, null).reason).toBe("reduced-motion");
  });
});

describe("preferencia guardada", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    };
  };

  it("se lee y se escribe en una sola clave", () => {
    const storage = memory();
    expect(readPreference(storage)).toBeNull();
    writePreference("lite", storage);
    expect([...storage.data.entries()]).toEqual([[PREFERENCE_KEY, "ligera"]]);
    expect(readPreference(storage)).toBe("lite");
    writePreference("full", storage);
    expect([...storage.data.entries()]).toEqual([[PREFERENCE_KEY, "completa"]]);
  });

  it("un valor ajeno se ignora", () => {
    const storage = memory();
    storage.setItem(PREFERENCE_KEY, "otra-cosa");
    expect(readPreference(storage)).toBeNull();
  });

  it("si el almacenamiento falla o no existe, no rompe", () => {
    const broken = {
      getItem: vi.fn(() => {
        throw new Error("bloqueado");
      }),
      setItem: vi.fn(() => {
        throw new Error("bloqueado");
      }),
    };
    expect(readPreference(broken)).toBeNull();
    expect(() => writePreference("lite", broken)).not.toThrow();
    expect(readPreference(undefined)).toBeNull();
    expect(() => writePreference("full", undefined)).not.toThrow();
  });
});
