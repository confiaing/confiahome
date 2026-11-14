import { describe, expect, it } from "vitest";
import { createTurnstileVerifier } from "@/adapters/turnstile/verifier";

// contact-submission · El verificador real habla con Turnstile.
// Claves de prueba oficiales de Cloudflare: no son secretos y no cuentan como tráfico real.
const ALWAYS_PASSES = "1x0000000000000000000000000000000AA";
const ALWAYS_FAILS = "2x0000000000000000000000000000000AA";

describe("verificador de Turnstile", () => {
  it("acepta con la clave «siempre pasa»", async () => {
    expect(await createTurnstileVerifier({ secretKey: ALWAYS_PASSES }).verify("XXXX.DUMMY.TOKEN.XXXX", null)).toBe(true);
  });

  it("rechaza con la clave «siempre falla»", async () => {
    expect(await createTurnstileVerifier({ secretKey: ALWAYS_FAILS }).verify("XXXX.DUMMY.TOKEN.XXXX", "203.0.113.7")).toBe(false);
  });

  it("un token vacío se rechaza sin llamar a Cloudflare", async () => {
    let called = false;
    const verifier = createTurnstileVerifier({
      secretKey: ALWAYS_PASSES,
      fetch: async () => {
        called = true;
        return new Response("{}");
      },
    });
    expect(await verifier.verify("", null)).toBe(false);
    expect(called).toBe(false);
  });
});
