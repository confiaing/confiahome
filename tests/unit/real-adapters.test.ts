import { describe, expect, it } from "vitest";
import { createEmailNotifier } from "@/adapters/email/notifier";
import { createBindingRateLimiter } from "@/adapters/ratelimit/limiter";
import { createSupabaseContactRepository } from "@/adapters/supabase/contact-repository";
import { createTurnstileVerifier } from "@/adapters/turnstile/verifier";
import type { ContactRecord } from "@/domain/contact/ports";

const record: ContactRecord = {
  name: "Ana Ruiz",
  company: null,
  email: "ana@empresa.com",
  phone: null,
  message: "Conciliar facturas.",
  locale: "es",
  consentAt: "2026-11-14T15:00:00.000Z",
  consentVersion: "2026-11-borrador",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  referrerHost: null,
};

type Call = { url: string; init: RequestInit };
const fakeFetch = (respond: (call: Call) => Response) => {
  const calls: Call[] = [];
  const fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return respond(call);
  }) as typeof globalThis.fetch;
  return { fetch, calls };
};

// Adaptadores reales con dobles: se comprueba lo que envían y cómo traducen las respuestas.
describe("repositorio de Supabase", () => {
  it("inserta por la API REST con la secret key y solo las columnas de la tabla", async () => {
    // El identificador lo pone el servidor: guardar no depende de leer la respuesta,
    // así que un reintento nunca nace de una fila que sí se guardó.
    const { fetch, calls } = fakeFetch(() => new Response(null, { status: 201 }));
    const repository = createSupabaseContactRepository({
      url: "http://127.0.0.1:54321/",
      secretKey: "sb_secret_prueba",
      fetch,
      newId: () => "4c8f1c2e-0000-4000-8000-000000000000",
    });
    const saved = await repository.save(record);

    expect(saved).toEqual({ ...record, id: "4c8f1c2e-0000-4000-8000-000000000000" });
    expect(JSON.parse(String(calls[0]!.init.body)).id).toBe("4c8f1c2e-0000-4000-8000-000000000000");
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("http://127.0.0.1:54321/rest/v1/contact_requests");
    expect(calls[0]!.init.method).toBe("POST");
    expect(calls[0]!.init.headers).toMatchObject({ apikey: "sb_secret_prueba", Authorization: "Bearer sb_secret_prueba", Prefer: "return=minimal" });
    expect(Object.keys(JSON.parse(String(calls[0]!.init.body))).sort()).toEqual(
      ["id", "company", "consent_at", "consent_version", "email", "locale", "message", "name", "phone", "referrer_host", "utm_campaign", "utm_medium", "utm_source"].sort(),
    );
  });

  it.each([401, 403, 409, 500, 503])("si Supabase responde %s, falla sin repetir lo enviado ni la clave", async (status) => {
    const { fetch } = fakeFetch(() => Response.json({ message: "detalle con ana@empresa.com" }, { status }));
    const repository = createSupabaseContactRepository({ url: "http://127.0.0.1:54321", secretKey: "sb_secret_prueba", fetch });
    const error = await repository.save(record).catch((reason: unknown) => reason as Error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe("SupabaseError");
    for (const secret of ["ana@empresa.com", "Ana Ruiz", "sb_secret_prueba"]) expect((error as Error).message).not.toContain(secret);
  });

  it("sin `newId` genera un identificador UUID propio", async () => {
    const { fetch } = fakeFetch(() => new Response(null, { status: 201 }));
    const saved = await createSupabaseContactRepository({ url: "http://x", secretKey: "k", fetch }).save(record);
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("verificador de Turnstile", () => {
  it("envía secreto, token e IP, y entiende ambas respuestas", async () => {
    let success = true;
    const { fetch, calls } = fakeFetch(() => Response.json({ success }));
    const verifier = createTurnstileVerifier({ secretKey: "secreto", fetch });

    expect(await verifier.verify("token-1", "203.0.113.7")).toBe(true);
    const form = calls[0]!.init.body as URLSearchParams;
    expect(calls[0]!.url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    // Con tiempo máximo: un Turnstile colgado no deja el envío esperando sin fin.
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
    expect(Object.fromEntries(form)).toEqual({ secret: "secreto", response: "token-1", remoteip: "203.0.113.7" });

    success = false;
    expect(await verifier.verify("token-2", null)).toBe(false);
    expect(Object.fromEntries(calls[1]!.init.body as URLSearchParams)).toEqual({ secret: "secreto", response: "token-2" });
  });

  it("si Cloudflare falla, lanza: no es lo mismo que un token inválido", async () => {
    const { fetch } = fakeFetch(() => new Response("error", { status: 500 }));
    await expect(createTurnstileVerifier({ secretKey: "s", fetch }).verify("t", null)).rejects.toMatchObject({ name: "TurnstileError" });
  });

  it("una respuesta sin `success: true` es un rechazo", async () => {
    const { fetch } = fakeFetch(() => Response.json({ success: "true" }));
    expect(await createTurnstileVerifier({ secretKey: "s", fetch }).verify("t", null)).toBe(false);
  });
});

describe("aviso por correo", () => {
  it("entrega al binding el mensaje compuesto, de web@ a la dirección configurada", async () => {
    const sent: { from: string; to: string; raw: string }[] = [];
    const notifier = createEmailNotifier({
      from: "web@confia.ing",
      to: "equipo@example.com",
      binding: { send: async (message) => void sent.push(message as { from: string; to: string; raw: string }) },
      createMessage: async (from, to, raw) => ({ from, to, raw }),
      now: () => new Date("2026-11-14T15:00:00.000Z"),
      newId: () => "id-fijo",
    });
    await notifier.notify({ ...record, id: "abc" });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ from: "web@confia.ing", to: "equipo@example.com" });
    expect(sent[0]!.raw).toContain("Reply-To: ana@empresa.com");
    expect(sent[0]!.raw).toContain("Message-ID: <id-fijo@confia.ing>");
  });

  it("si el binding falla, el error se propaga", async () => {
    const notifier = createEmailNotifier({
      from: "web@confia.ing",
      to: "equipo@example.com",
      binding: {
        send: async () => {
          throw new Error("destination address not verified");
        },
      },
      createMessage: async (from, to, raw) => ({ from, to, raw }),
      now: () => new Date(),
      newId: () => "x",
    });
    await expect(notifier.notify({ ...record, id: "abc" })).rejects.toThrow();
  });
});

describe("límite de frecuencia", () => {
  it("traduce la respuesta del binding y le pasa la clave", async () => {
    const keys: string[] = [];
    let success = true;
    const limiter = createBindingRateLimiter({
      limit: async ({ key }) => {
        keys.push(key);
        return { success };
      },
    });
    expect(await limiter.allow("203.0.113.7")).toBe(true);
    success = false;
    expect(await limiter.allow("203.0.113.7")).toBe(false);
    expect(keys).toEqual(["contact:203.0.113.7", "contact:203.0.113.7"]);
  });
});
