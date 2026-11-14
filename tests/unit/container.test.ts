import { describe, expect, it } from "vitest";
import { createContainer } from "@/lib/server/container";

// environment-config · Selección de servicios
describe("composición de dependencias", () => {
  it("con memory entrega los adaptadores en memoria", async () => {
    const container = createContainer({ services: "memory" });
    expect(container.backend).toBe("memory");
    await expect(container.health.ping()).resolves.toEqual({ ok: true, backend: "memory" });
  });

  it("con real avisa de que los adaptadores reales llegan en un lote posterior", () => {
    expect(() =>
      createContainer({
        services: "real",
        supabaseUrl: "http://127.0.0.1:54321",
        supabaseSecretKey: "x",
        turnstileSecretKey: "y",
        notifyFrom: "web@confia.ing",
        notifyTo: "equipo@example.com",
      }),
    ).toThrow(/L5/);
  });
});
