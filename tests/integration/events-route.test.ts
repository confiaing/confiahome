// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryEventRepository } from "@/adapters/memory/analytics";
import { createMemoryLogger, createMemoryRateLimiter } from "@/adapters/memory/contact";
import { POST } from "@/app/api/events/route";
import { createContainer, overrideContainer } from "@/lib/server/container";

const ORIGIN = "https://confia.ing";
const AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15";
const valid = { name: "cta_schedule_click", locale: "en", device: "mobile", path: "/en", utmSource: "linkedin" };

function setup(options: { limit?: number; repositoryFails?: boolean } = {}) {
  const base = createContainer({ services: "memory" });
  const repository = createMemoryEventRepository({ failing: options.repositoryFails });
  const logger = createMemoryLogger();
  overrideContainer({
    ...base,
    analytics: { ...base.analytics, repository, logger, limiter: createMemoryRateLimiter(options.limit ?? 60) },
  });
  return { repository, logger };
}

function post(body: unknown, init: { headers?: Record<string, string>; raw?: string } = {}) {
  return POST(
    new Request(`${ORIGIN}/api/events`, {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/json", "cf-connecting-ip": "203.0.113.7", "user-agent": AGENT, ...init.headers },
      body: init.raw ?? JSON.stringify(body),
    }),
  );
}

afterEach(() => overrideContainer(undefined));

// analytics-events · Lista cerrada; Solo los datos previstos; Punto de recepción protegido (L7-2)
describe("POST /api/events", () => {
  it("un evento de la lista responde 204 sin cuerpo y se guarda", async () => {
    const { repository } = setup();
    const response = await post(valid);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(repository.events).toEqual([
      { name: "cta_schedule_click", locale: "en", device: "mobile", path: "/en", referrerHost: null, utmSource: "linkedin", utmMedium: null, utmCampaign: null, formMode: null },
    ]);
  });

  it("los campos no previstos se descartan y el evento se guarda", async () => {
    const { repository } = setup();
    const response = await post({ ...valid, email: "ana@empresa.com", message: "hola", visitorId: "abc" });
    expect(response.status).toBe(204);
    expect(JSON.stringify(repository.events)).not.toMatch(/ana@|hola|abc/);
    expect(repository.events).toHaveLength(1);
  });

  it("las rutas del sitio se reconocen; el resto se guarda como «other»", async () => {
    const { repository } = setup();
    for (const path of ["/es", "/en/privacy", "/es/terminos/", "/es/secreto?x=1", "/api/contact"]) await post({ ...valid, path });
    expect(repository.events.map((event) => event.path)).toEqual(["/es", "/en/privacy", "/es/terminos", "other", "other"]);
  });

  it.each([{ ...valid, name: "signup" }, { ...valid, locale: "fr" }, { ...valid, device: "watch" }, { name: "form_started", locale: "es", device: "mobile" }, [], "x", 3])(
    "un evento inválido responde 400 y no se guarda: %j",
    async (body) => {
      const { repository } = setup();
      const response = await post(body);
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(repository.events).toHaveLength(0);
    },
  );

  it("un cuerpo ilegible responde 400", async () => {
    setup();
    expect((await post(null, { raw: "{no es json" })).status).toBe(400);
  });

  it("desde otro origen, o sin origen, responde 403", async () => {
    const { repository } = setup();
    expect((await post(valid, { headers: { origin: "https://otro.example" } })).status).toBe(403);
    const noOrigin = await POST(new Request(`${ORIGIN}/api/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(valid) }));
    expect(noOrigin.status).toBe(403);
    expect(repository.events).toHaveLength(0);
  });

  it("si no es JSON responde 415", async () => {
    setup();
    expect((await post(valid, { headers: { "content-type": "text/plain" } })).status).toBe(415);
  });

  it("un cuerpo de más de 2 kB responde 413", async () => {
    const { repository } = setup();
    expect((await post({ ...valid, relleno: "x".repeat(2100) })).status).toBe(413);
    expect(repository.events).toHaveLength(0);
  });

  it("pasado el límite de frecuencia responde 429", async () => {
    const { repository } = setup({ limit: 2 });
    expect((await post(valid)).status).toBe(204);
    expect((await post(valid)).status).toBe(204);
    const limited = await post(valid);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("cache-control")).toBe("no-store");
    expect(repository.events).toHaveLength(2);
  });

  it("un robot conocido recibe 204 y no se guarda", async () => {
    const { repository } = setup();
    const response = await post(valid, { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
    expect(response.status).toBe(204);
    expect(repository.events).toHaveLength(0);
  });

  it("si el almacén falla responde 204 y lo registra sin el evento, la IP ni el agente", async () => {
    const { logger } = setup({ repositoryFails: true });
    expect((await post(valid)).status).toBe(204);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["analytics.save-failed"]);
    expect(JSON.stringify(logger.entries)).not.toMatch(/203\.0\.113\.7|Macintosh|linkedin/);
  });
});
