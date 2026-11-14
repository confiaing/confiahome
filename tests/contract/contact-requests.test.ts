import { afterAll, describe, expect, it } from "vitest";
import { createSupabaseContactRepository } from "@/adapters/supabase/contact-repository";
import { CONSENT_VERSION } from "@/domain/contact/consent";
import type { ContactRecord } from "@/domain/contact/ports";

const URL_ = process.env.CONTRACT_SUPABASE_URL!;
const SECRET = process.env.CONTRACT_SUPABASE_SECRET_KEY!;
const PUBLISHABLE = process.env.CONTRACT_SUPABASE_PUBLISHABLE_KEY!;
const TABLE = `${URL_}/rest/v1/contact_requests`;
const MARK = `contrato-${Date.now()}`;

const headers = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  ...extra,
});

const row = (extra: Record<string, unknown> = {}) => ({
  name: "Prueba de contrato",
  company: MARK,
  email: "contrato@example.com",
  locale: "es",
  consent_at: new Date().toISOString(),
  consent_version: CONSENT_VERSION,
  ...extra,
});

const insert = (key: string, body: unknown) =>
  fetch(TABLE, { method: "POST", headers: headers(key, { Prefer: "return=representation" }), body: JSON.stringify(body) });

afterAll(async () => {
  await fetch(`${TABLE}?company=eq.${MARK}`, { method: "DELETE", headers: headers(SECRET) });
});

// contact-submission · Almacén protegido (L5-6)
describe("tabla contact_requests", () => {
  it("con la secret key, una fila válida se guarda con estado «new»", async () => {
    const response = await insert(SECRET, row());
    expect(response.status).toBe(201);
    const [saved] = (await response.json()) as Record<string, unknown>[];
    expect(saved).toMatchObject({ company: MARK, status: "new", locale: "es", consent_version: CONSENT_VERSION });
    expect(saved!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(saved!)).not.toEqual(expect.arrayContaining(["ip", "ip_address"]));
  });

  it("con la publishable key no se lee ninguna fila, aunque existan", async () => {
    const response = await fetch(`${TABLE}?select=*`, { headers: headers(PUBLISHABLE) });
    const body = (await response.json()) as unknown;
    // O no hay permiso (4xx) o la respuesta viene vacía: en ningún caso llegan filas.
    if (response.ok) expect(body).toEqual([]);
    else expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("con la publishable key se rechazan las inserciones", async () => {
    const response = await insert(PUBLISHABLE, row({ name: "No debería entrar" }));
    expect(response.status).toBeGreaterThanOrEqual(400);
    const check = await fetch(`${TABLE}?name=eq.${encodeURIComponent("No debería entrar")}&select=id`, { headers: headers(SECRET) });
    expect(await check.json()).toEqual([]);
  });

  it("sin clave, nada", async () => {
    const response = await fetch(`${TABLE}?select=*`);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("la base rechaza por sí misma una fila sin correo ni teléfono", async () => {
    const response = await insert(SECRET, row({ email: null, phone: null }));
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).toContain("contact_requests_contact_required");
  });

  it.each([
    ["idioma no admitido", { locale: "fr" }],
    ["estado no admitido", { status: "otro" }],
    ["nombre vacío", { name: "" }],
    ["nombre demasiado largo", { name: "x".repeat(121) }],
    ["mensaje demasiado largo", { message: "x".repeat(2001) }],
    ["sin fecha de consentimiento", { consent_at: null }],
  ])("la base rechaza: %s", async (_name, extra) => {
    const response = await insert(SECRET, row(extra));
    expect(response.status).toBe(400);
  });

  it("no existe ninguna columna para la IP", async () => {
    const response = await insert(SECRET, row({ ip: "203.0.113.7" }));
    expect(response.status).toBe(400);
  });
});

// contact-submission · Ida y vuelta por el adaptador
describe("adaptador de Supabase", () => {
  const record: ContactRecord = {
    name: "Ana Ruiz",
    company: MARK,
    email: "ana@empresa.com",
    phone: "+57 300 123 4567",
    message: "Conciliar facturas.",
    locale: "en",
    consentAt: "2026-11-14T15:00:00.000Z",
    consentVersion: CONSENT_VERSION,
    utmSource: "boletin",
    utmMedium: null,
    utmCampaign: null,
    referrerHost: "example.com",
  };

  it("guarda una consulta y la fila queda con sus campos", async () => {
    const repository = createSupabaseContactRepository({ url: URL_, secretKey: SECRET });
    const saved = await repository.save(record);
    expect(saved).toMatchObject(record);
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);

    const check = await fetch(`${TABLE}?id=eq.${saved.id}&select=*`, { headers: headers(SECRET) });
    const [stored] = (await check.json()) as Record<string, unknown>[];
    expect(stored).toMatchObject({
      name: "Ana Ruiz",
      email: "ana@empresa.com",
      phone: "+57 300 123 4567",
      message: "Conciliar facturas.",
      locale: "en",
      consent_version: CONSENT_VERSION,
      utm_source: "boletin",
      referrer_host: "example.com",
      status: "new",
    });
    expect(new Date(stored!.consent_at as string).toISOString()).toBe(record.consentAt);
  });

  it("con una clave que no vale, falla sin repetir datos del visitante", async () => {
    const repository = createSupabaseContactRepository({ url: URL_, secretKey: PUBLISHABLE });
    const error = await repository.save(record).then(
      () => null,
      (reason: unknown) => reason as Error,
    );
    expect(error).toBeInstanceOf(Error);
    for (const secret of ["Ana Ruiz", "ana@empresa.com", "Conciliar", PUBLISHABLE]) expect(String(error?.message)).not.toContain(secret);
  });
});
