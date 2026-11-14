import { describe, expect, it } from "vitest";
import { createContainer } from "@/lib/server/container";

// environment-config · Selección de servicios
describe("composición de dependencias", () => {
  it("con memory entrega los adaptadores en memoria", async () => {
    const container = createContainer({ services: "memory" });
    expect(container.backend).toBe("memory");
    await expect(container.health.ping()).resolves.toEqual({ ok: true, backend: "memory" });
  });

  const REAL = {
    services: "real",
    supabaseUrl: "http://127.0.0.1:54321",
    supabaseSecretKey: "x",
    turnstileSecretKey: "y",
    notifyFrom: "web@confia.ing",
    notifyTo: "equipo@example.com",
  } as const;

  it("con real entrega los adaptadores reales de contacto", () => {
    const container = createContainer(REAL);
    expect(container.backend).toBe("real");
    for (const dependency of ["repository", "notifier", "verifier", "limiter", "logger"] as const) {
      expect(container.contact[dependency]).toBeDefined();
    }
    expect(container.contact.now()).toBeInstanceOf(Date);
  });

  it("con memory, el contacto usa los adaptadores en memoria y no toca la red", async () => {
    const { contact } = createContainer({ services: "memory" });
    expect(await contact.verifier.verify("cualquiera", null)).toBe(true);
    expect(await contact.verifier.verify("invalid", null)).toBe(false);
    expect(await contact.limiter.allow("x")).toBe(true);
  });

  // Fuera de Workers no hay bindings: fallan al usarse, no al arrancar, y el caso de uso lo absorbe.
  it("sin los bindings del Worker, el aviso y el límite fallan al usarse, con un error que nombra el binding", async () => {
    const { contact } = createContainer(REAL);
    await expect(contact.limiter.allow("x")).rejects.toThrow(/CONTACT_RATE_LIMITER/);
    await expect(
      contact.notifier.notify({
        id: "1",
        name: "Ana",
        company: null,
        email: "ana@empresa.com",
        phone: null,
        message: null,
        locale: "es",
        consentAt: "2026-11-14T15:00:00.000Z",
        consentVersion: "v",
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrerHost: null,
      }),
    ).rejects.toThrow();
  });
});
