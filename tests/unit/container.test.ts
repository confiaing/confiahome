import { describe, expect, it } from "vitest";
import { createContainer, turnstileHostname } from "@/lib/server/container";

// environment-config · Selección de servicios
describe("composición de dependencias", () => {
  it("solo expone lo que usan las rutas: contacto y analítica", () => {
    expect(Object.keys(createContainer({ services: "memory" })).sort()).toEqual(["analytics", "contact"]);
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
    expect(Object.keys(container.contact).sort()).toEqual(["limiter", "logger", "notifier", "now", "repository", "verifier"]);
    expect(Object.keys(container.analytics).sort()).toEqual(["limiter", "logger", "repository", "resolvePath"]);
    expect(container.contact.now()).toBeInstanceOf(Date);
    // Las rutas del sitio se reconocen igual en ambos modos.
    expect(container.analytics.resolvePath("/en/privacy/")).toBe("/en/privacy");
    expect(container.analytics.resolvePath("/otra")).toBeNull();
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

// contact-submission · Antispam en capas: producción exige el dominio (L13-4)
describe("dominio que se exige al token de Turnstile", () => {
  it("con la dirección pública HTTPS, es su host", () => {
    expect(turnstileHostname("https://confia.ing")).toBe("confia.ing");
    expect(turnstileHostname("https://confia.ing/")).toBe("confia.ing");
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:8787", "https://localhost", "http://confia.ing", "no es una dirección"])("con %s no se exige", (siteUrl) => {
    expect(turnstileHostname(siteUrl)).toBeUndefined();
  });
});
