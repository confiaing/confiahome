import { describe, expect, it } from "vitest";
import { PUBLIC_ENV_KEYS, readPublicEnv } from "@/lib/public-env";

// environment-config · Los secretos no llegan al navegador
describe("configuración pública", () => {
  it("solo expone variables NEXT_PUBLIC_", () => {
    expect(PUBLIC_ENV_KEYS.length).toBeGreaterThan(0);
    for (const key of PUBLIC_ENV_KEYS) expect(key.startsWith("NEXT_PUBLIC_")).toBe(true);
  });

  it("usa valores por defecto seguros cuando faltan", () => {
    const env = readPublicEnv({});
    expect(env.siteUrl).toBe("http://localhost:3000");
    expect(env.calendlyUrl).toBe("https://calendly.com/confiaing/30min");
    expect(env.analyticsToken).toBeNull();
  });

  it("lee los valores definidos", () => {
    const env = readPublicEnv({ NEXT_PUBLIC_SITE_URL: "https://confia.ing", NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "abc" });
    expect(env.siteUrl).toBe("https://confia.ing");
    expect(env.analyticsToken).toBe("abc");
  });

  // scheduling · Idioma del calendario: lo fija Calendly en el evento; hoy está en inglés.
  it.each([
    [undefined, "en"],
    ["", "en"],
    ["es", "es"],
    [" ES ", "es"],
    ["en", "en"],
    ["fr", "en"],
  ])("idioma del calendario %j → %s", (value, expected) => {
    expect(readPublicEnv({ NEXT_PUBLIC_CALENDLY_LOCALE: value }).calendlyLocale).toBe(expected);
  });
});
