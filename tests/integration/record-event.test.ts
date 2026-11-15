// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createMemoryEventRepository } from "@/adapters/memory/analytics";
import { createMemoryLogger, createMemoryRateLimiter } from "@/adapters/memory/contact";
import { recordEvent } from "@/domain/analytics/record-event";

const IP = "203.0.113.7";
const AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15";
const valid = { name: "cta_schedule_click", locale: "en", device: "mobile", path: "/en", utmSource: "linkedin" };

function setup(options: { repositoryFails?: boolean; limiterThrows?: boolean; limit?: number } = {}) {
  const repository = createMemoryEventRepository({ failing: options.repositoryFails });
  const logger = createMemoryLogger();
  const deps = {
    repository,
    logger,
    limiter: options.limiterThrows
      ? {
          allow: async () => {
            throw new Error(`fallo con ${IP}`);
          },
        }
      : createMemoryRateLimiter(options.limit ?? 60),
    resolvePath: (raw: string) => (raw === "/en" || raw === "/es" ? raw : null),
  };
  const record = (input: unknown, context = { clientKey: IP as string | null, userAgent: AGENT as string | null }) => recordEvent(input, context, deps);
  return { repository, logger, record };
}

// analytics-events · Punto de recepción; Nada que identifique; La analítica no rompe nada
describe("recordEvent", () => {
  it("un evento válido se guarda, solo con los datos previstos", async () => {
    const { repository, record } = setup();
    expect(await record({ ...valid, email: "ana@empresa.com" })).toBe("recorded");
    expect(repository.events).toEqual([
      { name: "cta_schedule_click", locale: "en", device: "mobile", path: "/en", referrerHost: null, utmSource: "linkedin", utmMedium: null, utmCampaign: null, formMode: null },
    ]);
  });

  it("un evento inválido no se guarda ni gasta el límite", async () => {
    const { repository, record } = setup({ limit: 1 });
    expect(await record({ ...valid, name: "otro" })).toBe("invalid");
    expect(await record(valid)).toBe("recorded");
    expect(repository.events).toHaveLength(1);
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "facebookexternalhit/1.1",
    "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 Chrome-Lighthouse",
    "Slackbot-LinkExpanding 1.0",
  ])("un robot (%s) se acepta sin guardarse", async (userAgent) => {
    const { repository, record } = setup();
    expect(await record(valid, { clientKey: IP, userAgent })).toBe("ignored");
    expect(repository.events).toHaveLength(0);
  });

  it.each([
    "Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20 PRO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.29.8123",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 334.0.0.25.117",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
  ])("un navegador real no se toma por robot: %s", async (userAgent) => {
    const { repository, record } = setup();
    expect(await record(valid, { clientKey: IP, userAgent })).toBe("recorded");
    expect(repository.events).toHaveLength(1);
  });

  it("sin agente de usuario se trata como visitante", async () => {
    const { repository, record } = setup();
    expect(await record(valid, { clientKey: IP, userAgent: null })).toBe("recorded");
    expect(repository.events).toHaveLength(1);
  });

  it("pasado el límite de un origen, el siguiente se rechaza; otro origen no lo hereda", async () => {
    const { repository, record } = setup({ limit: 2 });
    expect(await record(valid)).toBe("recorded");
    expect(await record(valid)).toBe("recorded");
    expect(await record(valid)).toBe("rate-limited");
    expect(await record(valid, { clientKey: "198.51.100.9", userAgent: AGENT })).toBe("recorded");
    expect(repository.events).toHaveLength(3);
  });

  it("si el limitador falla, el evento pasa", async () => {
    const { repository, logger, record } = setup({ limiterThrows: true });
    expect(await record(valid)).toBe("recorded");
    expect(repository.events).toHaveLength(1);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["analytics.limiter-failed"]);
  });

  it("si el almacén falla, se ignora y queda registrado sin el contenido del evento", async () => {
    const { logger, record } = setup({ repositoryFails: true });
    expect(await record(valid)).toBe("ignored");
    expect(logger.entries.map((entry) => entry.code)).toEqual(["analytics.save-failed"]);
  });

  it("ni lo guardado ni lo registrado contienen la IP o el agente de usuario", async () => {
    for (const options of [{}, { repositoryFails: true }, { limiterThrows: true }]) {
      const { repository, logger, record } = setup(options);
      await record(valid);
      const everything = JSON.stringify([repository.events, logger.entries]);
      for (const secret of [IP, "Macintosh", "AppleWebKit", "linkedin@"]) expect(everything).not.toContain(secret);
    }
  });
});
