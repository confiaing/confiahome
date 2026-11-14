// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryContactRepository,
  createMemoryLogger,
  createMemoryNotifier,
  createMemoryRateLimiter,
  createMemorySpamVerifier,
} from "@/adapters/memory/contact";
import { POST } from "@/app/api/contact/route";
import { getDictionary } from "@/i18n/dictionaries";
import { overrideContainer } from "@/lib/server/container";

const ORIGIN = "https://confia.ing";
const valid = {
  name: "Ana Ruiz",
  email: "ana@empresa.com",
  message: "Conciliar facturas.",
  consent: true,
  locale: "es",
  formMode: "classic",
  turnstileToken: "ok",
};

function setup(options: { repositoryFails?: boolean; limit?: number } = {}) {
  const repository = createMemoryContactRepository({ failing: options.repositoryFails });
  const notifier = createMemoryNotifier();
  const logger = createMemoryLogger();
  overrideContainer({
    backend: "memory",
    health: { ping: async () => ({ ok: true, backend: "memory" }) },
    contact: {
      repository,
      notifier,
      logger,
      verifier: createMemorySpamVerifier(),
      limiter: createMemoryRateLimiter(options.limit ?? 5),
      now: () => new Date("2026-11-14T15:00:00.000Z"),
    },
  });
  return { repository, notifier, logger };
}

function post(body: unknown, init: { headers?: Record<string, string>; raw?: string } = {}) {
  return POST(
    new Request(`${ORIGIN}/api/contact`, {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/json", "cf-connecting-ip": "203.0.113.7", ...init.headers },
      body: init.raw ?? JSON.stringify(body),
    }),
  );
}

afterEach(() => overrideContainer(undefined));

// contact-submission · Punto de recepción (L5-5)
describe("POST /api/contact", () => {
  it("consulta válida: 201 y exactamente una consulta guardada", async () => {
    const { repository, notifier } = setup();
    const response = await post(valid);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: "accepted" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(repository.records).toHaveLength(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it("lo guardado no contiene la IP", async () => {
    const { repository } = setup();
    await post(valid);
    expect(JSON.stringify(repository.records)).not.toContain("203.0.113.7");
  });

  it.each(["es", "en"] as const)("sin contacto: 422 con el error del campo en %s, y nada guardado", async (locale) => {
    const { repository } = setup();
    const response = await post({ ...valid, email: "", locale });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      status: "invalid",
      codes: { email: "contact-required" },
      errors: { email: getDictionary(locale).contact.errors.contactRequired },
    });
    expect(repository.records).toHaveLength(0);
  });

  it("varios errores: uno por campo", async () => {
    setup();
    const response = await post({ ...valid, name: " ", email: "ana@", consent: false });
    expect(response.status).toBe(422);
    const body = (await response.json()) as { codes: Record<string, string> };
    expect(body.codes).toEqual({ name: "required", email: "email-format", consent: "consent-required" });
  });

  it("con un idioma no admitido responde en español y como petición mal formada", async () => {
    setup();
    const response = await post({ ...valid, locale: "fr" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "malformed" });
  });

  it.each([
    ["otro sitio", { origin: "https://otro.sitio" }],
    ["subdominio parecido", { origin: "https://confia.ing.otro.sitio" }],
    ["sin Origin", { origin: "" }],
  ])("origen ajeno (%s): 403 y nada guardado", async (_name, headers) => {
    const { repository } = setup();
    const response = await post(valid, { headers });
    expect(response.status).toBe(403);
    expect(repository.records).toHaveLength(0);
  });

  it("acepta el origen por la cabecera Host cuando el Worker ve otro host", async () => {
    setup();
    const response = await POST(
      new Request("http://interno:8787/api/contact", {
        method: "POST",
        headers: { origin: ORIGIN, host: "confia.ing", "content-type": "application/json" },
        body: JSON.stringify(valid),
      }),
    );
    expect(response.status).toBe(201);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x", ""])(
    "tipo de contenido «%s»: 415 y nada guardado",
    async (contentType) => {
      const { repository } = setup();
      const response = await post(valid, { headers: { "content-type": contentType } });
      expect(response.status).toBe(415);
      expect(repository.records).toHaveLength(0);
    },
  );

  it("admite el tipo JSON con juego de caracteres", async () => {
    setup();
    expect((await post(valid, { headers: { "content-type": "application/json; charset=utf-8" } })).status).toBe(201);
  });

  it("cuerpo que no es JSON: 400", async () => {
    const { repository } = setup();
    expect((await post(null, { raw: "{no es json" })).status).toBe(400);
    expect((await post(null, { raw: '"texto"' })).status).toBe(400);
    expect(repository.records).toHaveLength(0);
  });

  it("cuerpo mayor que el límite: 413, lo declare o no la cabecera", async () => {
    const { repository } = setup();
    const huge = JSON.stringify({ ...valid, message: "x".repeat(20_000) });
    expect((await post(null, { raw: huge })).status).toBe(413);
    expect((await post(null, { raw: huge, headers: { "content-length": "10" } })).status).toBe(413);
    expect(repository.records).toHaveLength(0);
  });

  // contact-submission · Antispam en capas (L5-7)
  it("token de Turnstile inválido: 403, sin guardar ni avisar", async () => {
    const { repository, notifier } = setup();
    const response = await post({ ...valid, turnstileToken: "invalid" });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ status: "spam-rejected" });
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("campo trampa relleno: 201, sin guardar ni avisar", async () => {
    const { repository, notifier } = setup();
    expect((await post({ ...valid, website: "https://spam.example" })).status).toBe(201);
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("más envíos que el límite desde un mismo origen: 429", async () => {
    setup({ limit: 2 });
    expect((await post(valid)).status).toBe(201);
    expect((await post(valid)).status).toBe(201);
    const response = await post(valid);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ status: "rate-limited" });
    expect((await post(valid, { headers: { "cf-connecting-ip": "198.51.100.9" } })).status).toBe(201);
  });

  // contact-submission · El servidor falla de forma clara (L5-9)
  it("almacén caído: 503, sin aviso, y registro sin datos personales", async () => {
    const { notifier, logger } = setup({ repositoryFails: true });
    const response = await post(valid);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(notifier.sent).toHaveLength(0);
    const logged = JSON.stringify(logger.entries);
    for (const secret of ["Ana", "ana@empresa.com", "Conciliar", "203.0.113.7"]) expect(logged).not.toContain(secret);
  });

  it("ninguna respuesta se puede guardar en caché", async () => {
    setup({ limit: 1 });
    for (const response of [await post(valid), await post(valid), await post({ ...valid, email: "" }), await post(valid, { headers: { origin: "https://x.y" } })]) {
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });
});

// contact-submission · Punto de recepción: lo que no es un formulario es una petición mal formada
describe("cuerpos que no son un formulario", () => {
  it.each([[[]], [[{ name: "Ana" }]]])("una lista responde 400, no errores de campo: %j", async (body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "malformed" });
  });

  it("un mensaje largo en escritura multibyte cabe en el límite de tamaño", async () => {
    const response = await post({ ...valid, message: "漢".repeat(2000), turnstileToken: "t".repeat(4096) });
    expect(response.status).toBe(201);
  });
});
