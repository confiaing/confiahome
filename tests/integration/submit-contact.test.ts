// @vitest-environment node
import { describe, expect, it } from "vitest";
import { composeNotification } from "@/adapters/email/compose";
import {
  createMemoryContactRepository,
  createMemoryLogger,
  createMemoryNotifier,
  createMemoryRateLimiter,
  createMemorySpamVerifier,
} from "@/adapters/memory/contact";
import { CONSENT_VERSION } from "@/domain/contact/consent";
import { submitContact } from "@/domain/contact/submit-contact";

const valid = {
  name: "Ana Ruiz",
  company: "Acme",
  email: "ana@empresa.com",
  phone: "+57 300 123 4567",
  message: "Conciliar facturas con el sistema contable.",
  consent: true,
  locale: "es",
  formMode: "terminal",
  turnstileToken: "ok",
};
const NOW = new Date("2026-11-14T15:00:00.000Z");
const IP = "203.0.113.7";

type SetupOptions = { repositoryFails?: boolean; notifierFails?: boolean; limiterThrows?: boolean; verifierThrows?: boolean; limit?: number };
const broken = (name: string) => async () => {
  const error = new Error(`fallo con ${IP}`);
  error.name = name;
  throw error;
};

function setup(options: SetupOptions = {}) {
  const repository = createMemoryContactRepository({ failing: options.repositoryFails });
  const notifier = createMemoryNotifier({ failing: options.notifierFails });
  const logger = createMemoryLogger();
  const deps = {
    repository,
    notifier,
    logger,
    verifier: options.verifierThrows ? { verify: broken("TurnstileError") } : createMemorySpamVerifier(),
    limiter: options.limiterThrows ? { allow: broken("LimiterError") } : createMemoryRateLimiter(options.limit ?? 5),
    now: () => NOW,
  };
  const submit = (input: unknown, clientKey: string | null = IP) => submitContact(input, { clientKey }, deps);
  return { repository, notifier, logger, submit };
}

// contact-submission · Punto de recepción, Consentimiento, Antispam, Aviso (L5-2, L5-5, L5-7, L5-8, L5-9)
describe("submitContact", () => {
  it("una consulta válida se guarda una vez, con fecha y versión del consentimiento, y se avisa", async () => {
    const { repository, notifier, submit } = setup();
    expect(await submit(valid)).toEqual({ status: "accepted" });
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0]).toMatchObject({
      name: "Ana Ruiz",
      company: "Acme",
      email: "ana@empresa.com",
      locale: "es",
      consentAt: NOW.toISOString(),
      consentVersion: CONSENT_VERSION,
    });
    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0]).toMatchObject({ email: "ana@empresa.com" });
  });

  it("lo que se guarda no contiene la IP, el token ni el campo trampa", async () => {
    const { repository, submit } = setup();
    await submit(valid);
    const stored = JSON.stringify(repository.records[0]);
    expect(stored).not.toContain(IP);
    expect(Object.keys(repository.records[0]!)).not.toEqual(expect.arrayContaining(["ip", "turnstileToken", "website", "clientKey"]));
  });

  it("datos inválidos: errores por campo y nada guardado ni avisado", async () => {
    const { repository, notifier, submit } = setup();
    expect(await submit({ ...valid, email: "", phone: "" })).toEqual({ status: "invalid", errors: { email: "contact-required" }, malformed: false });
    expect(await submit({ ...valid, consent: false })).toMatchObject({ status: "invalid", errors: { consent: "consent-required" } });
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("campo trampa relleno: se responde como aceptada, sin guardar ni avisar", async () => {
    const { repository, notifier, logger, submit } = setup();
    expect(await submit({ ...valid, website: "https://spam.example" })).toEqual({ status: "accepted" });
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
    // Queda contado, sin nada de lo enviado, para detectar si atrapa a personas.
    expect(logger.entries).toEqual([{ level: "info", code: "contact.honeypot", context: undefined }]);
  });

  it("si el limitador falla, la consulta pasa: quedan las otras capas", async () => {
    const { repository, logger, submit } = setup({ limiterThrows: true });
    expect(await submit(valid)).toEqual({ status: "accepted" });
    expect(repository.records).toHaveLength(1);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["contact.limiter-failed"]);
  });

  it("si no se puede verificar el antispam, no se guarda nada y se responde no disponible", async () => {
    const { repository, notifier, logger, submit } = setup({ verifierThrows: true });
    expect(await submit(valid)).toEqual({ status: "unavailable" });
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["contact.verify-failed"]);
  });

  it("token de Turnstile inválido: rechazada, sin guardar ni avisar", async () => {
    const { repository, notifier, submit } = setup();
    expect(await submit({ ...valid, turnstileToken: "invalid" })).toEqual({ status: "spam-rejected" });
    expect(repository.records).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("más envíos que el límite desde un mismo origen: el siguiente se rechaza", async () => {
    const { repository, submit } = setup({ limit: 2 });
    expect((await submit(valid)).status).toBe("accepted");
    expect((await submit(valid)).status).toBe("accepted");
    expect(await submit(valid)).toEqual({ status: "rate-limited" });
    expect(repository.records).toHaveLength(2);
    // Otro origen no hereda el límite.
    expect((await submit(valid, "198.51.100.9")).status).toBe("accepted");
  });

  it("almacén caído: no disponible, sin aviso, y registrado sin datos personales", async () => {
    const { notifier, logger, submit } = setup({ repositoryFails: true });
    expect(await submit(valid)).toEqual({ status: "unavailable" });
    expect(notifier.sent).toHaveLength(0);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["contact.save-failed"]);
  });

  it("el aviso falla: la consulta sigue aceptada y guardada, y el fallo queda registrado", async () => {
    const { repository, logger, submit } = setup({ notifierFails: true });
    expect(await submit(valid)).toEqual({ status: "accepted" });
    expect(repository.records).toHaveLength(1);
    expect(logger.entries.map((entry) => entry.code)).toEqual(["contact.notify-failed"]);
  });

  it("ningún registro de errores contiene datos del visitante", async () => {
    for (const options of [{ repositoryFails: true }, { notifierFails: true }, { limiterThrows: true }, { verifierThrows: true }]) {
      const { logger, submit } = setup(options);
      await submit(valid);
      expect(logger.entries.length).toBeGreaterThan(0);
      const logged = JSON.stringify(logger.entries);
      for (const secret of [valid.name, valid.email, valid.phone, valid.company, "Conciliar", IP]) expect(logged).not.toContain(secret);
    }
  });
});

// contact-submission · Aviso al equipo (L5-8)
describe("composeNotification", () => {
  const record = {
    id: "0b6c1d4e",
    name: "Ana Ruiz",
    company: "Acme",
    email: "ana@empresa.com",
    phone: null,
    message: "Conciliar facturas.",
    locale: "es" as const,
    consentAt: NOW.toISOString(),
    consentVersion: CONSENT_VERSION,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    referrerHost: null,
  };
  const options = { from: "web@confia.ing", to: "equipo@example.com", now: NOW, messageId: "abc123" };
  const headersOf = (raw: string) => raw.split("\r\n\r\n")[0]!.split("\r\n");
  const bodyOf = (raw: string) => Buffer.from(raw.split("\r\n\r\n")[1]!.replace(/\r\n/g, ""), "base64").toString("utf8");

  it("va a la dirección configurada, en texto plano, con Reply-To del visitante", () => {
    const mail = composeNotification(record, options);
    expect(mail.from).toBe("web@confia.ing");
    expect(mail.to).toBe("equipo@example.com");
    const headers = headersOf(mail.raw);
    expect(headers).toContain("To: equipo@example.com");
    expect(headers).toContain("Reply-To: ana@empresa.com");
    expect(headers).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(headers.some((line) => line.startsWith("From: ") && line.includes("<web@confia.ing>"))).toBe(true);
    const body = bodyOf(mail.raw);
    for (const text of ["Ana Ruiz", "Acme", "ana@empresa.com", "Conciliar facturas."]) expect(body).toContain(text);
    expect(body).not.toMatch(/<[a-z]+>/i);
  });

  it("solo con teléfono: sin Reply-To y con el teléfono en el cuerpo", () => {
    const mail = composeNotification({ ...record, email: null, phone: "+57 300 123 4567" }, options);
    expect(headersOf(mail.raw).some((line) => line.toLowerCase().startsWith("reply-to"))).toBe(false);
    expect(bodyOf(mail.raw)).toContain("+57 300 123 4567");
  });

  it("ningún texto del visitante queda como cabecera", () => {
    const hostile = {
      ...record,
      name: "Ana\r\nBcc: victima@example.com",
      email: "ana@empresa.com\r\nBcc: otra@example.com",
      message: "hola\r\n\r\nSubject: falso\r\nBcc: tercera@example.com",
    };
    const mail = composeNotification(hostile, options);
    const headers = headersOf(mail.raw);
    expect(headers.some((line) => /^bcc:/i.test(line))).toBe(false);
    expect(headers.filter((line) => /^subject:/i.test(line))).toHaveLength(1);
    expect(headers.some((line) => /^reply-to:/i.test(line))).toBe(false);
    // El texto hostil sigue en el cuerpo, como texto.
    expect(bodyOf(mail.raw)).toContain("Bcc: tercera@example.com");
  });
});
