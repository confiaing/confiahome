import { afterAll, describe, expect, it } from "vitest";
import { createSupabaseEventRepository } from "@/adapters/supabase/event-repository";
import { EVENT_NAMES, type AnalyticsEvent } from "@/domain/analytics/events";

const URL_ = process.env.CONTRACT_SUPABASE_URL!;
const SECRET = process.env.CONTRACT_SUPABASE_SECRET_KEY!;
const PUBLISHABLE = process.env.CONTRACT_SUPABASE_PUBLISHABLE_KEY!;
const TABLE = `${URL_}/rest/v1/analytics_events`;
const MARK = `contrato-${Date.now()}`;

const headers = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  ...extra,
});
const row = (extra: Record<string, unknown> = {}) => ({ name: "page_view", locale: "es", device: "desktop", path: "/es", utm_campaign: MARK, ...extra });
const insert = (key: string, body: unknown) =>
  fetch(TABLE, { method: "POST", headers: headers(key, { Prefer: "return=representation" }), body: JSON.stringify(body) });
const marked = async () => (await (await fetch(`${TABLE}?utm_campaign=eq.${MARK}&select=*`, { headers: headers(SECRET) })).json()) as Record<string, unknown>[];

afterAll(async () => {
  await fetch(`${TABLE}?utm_campaign=eq.${MARK}`, { method: "DELETE", headers: headers(SECRET) });
});

// analytics-events · Esquema de la tabla; Tabla protegida (L7-3)
describe("tabla analytics_events", () => {
  it("tiene exactamente las columnas previstas: ninguna para IP, agente, visitante ni texto libre", async () => {
    const response = await insert(SECRET, row());
    expect(response.status).toBe(201);
    const [saved] = (await response.json()) as Record<string, unknown>[];
    expect(Object.keys(saved!).sort()).toEqual(
      ["created_at", "device", "form_mode", "id", "locale", "name", "path", "referrer_host", "utm_campaign", "utm_medium", "utm_source"].sort(),
    );
    expect(typeof saved!.id).toBe("number");
    expect(Date.parse(String(saved!.created_at))).toBeGreaterThan(Date.now() - 60_000);
  });

  it.each(["ip", "user_agent", "visitor_id", "session_id", "message", "email"])("no admite una columna %s", async (column) => {
    const response = await insert(SECRET, row({ [column]: "x" }));
    expect(response.status).toBe(400);
  });

  it("acepta los ocho eventos de la lista", async () => {
    for (const name of EVENT_NAMES) {
      const response = await insert(SECRET, row({ name, form_mode: name.startsWith("form_") ? "terminal" : null }));
      expect(response.status, name).toBe(201);
    }
  });

  it.each([
    ["evento fuera de lista", { name: "signup" }],
    ["idioma fuera de lista", { locale: "fr" }],
    ["dispositivo fuera de lista", { device: "watch" }],
    ["modo fuera de lista", { name: "form_started", form_mode: "otro" }],
    ["modo en un evento que no es del formulario", { form_mode: "terminal" }],
    ["evento de formulario sin modo", { name: "form_submitted" }],
    ["ruta demasiado larga", { path: "/" + "x".repeat(200) }],
    ["utm con espacios", { utm_source: "campaña de otoño" }],
    ["utm con un correo", { utm_medium: "ana@empresa.com" }],
    ["procedencia que no es un host", { referrer_host: "https://example.com/x?y=1" }],
    ["sin idioma", { locale: null }],
  ])("la base rechaza por sí misma: %s", async (_name, extra) => {
    const response = await insert(SECRET, row(extra));
    expect(response.status).toBe(400);
  });

  it("con la publishable key no se lee ninguna fila, aunque existan", async () => {
    expect((await marked()).length).toBeGreaterThan(0);
    const response = await fetch(`${TABLE}?select=*`, { headers: headers(PUBLISHABLE) });
    const body = (await response.json()) as unknown;
    if (response.ok) expect(body).toEqual([]);
    else expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("con la publishable key se rechazan las inserciones", async () => {
    const before = (await marked()).length;
    const response = await insert(PUBLISHABLE, row());
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect((await marked()).length).toBe(before);
  });

  it("sin clave, nada", async () => {
    expect((await fetch(`${TABLE}?select=*`)).status).toBeGreaterThanOrEqual(400);
  });
});

// analytics-events · El adaptador guarda un evento
describe("adaptador de Supabase", () => {
  it("guarda un evento y la fila queda con sus valores y con fecha", async () => {
    const event: AnalyticsEvent = {
      name: "form_submitted",
      locale: "en",
      device: "mobile",
      path: "/en",
      referrerHost: "news.example.com",
      utmSource: "boletin",
      utmMedium: "email",
      utmCampaign: MARK,
      formMode: "classic",
    };
    await createSupabaseEventRepository({ url: URL_, secretKey: SECRET }).save(event);
    const rows = (await marked()).filter((item) => item.name === "form_submitted" && item.form_mode === "classic");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      locale: "en",
      device: "mobile",
      path: "/en",
      referrer_host: "news.example.com",
      utm_source: "boletin",
      utm_medium: "email",
    });
    expect(rows[0]!.created_at).toBeTruthy();
  });

  it("todo lo que el saneado del servidor puede producir cabe en las restricciones de la base", async () => {
    const repository = createSupabaseEventRepository({ url: URL_, secretKey: SECRET });
    const extremes: Partial<AnalyticsEvent>[] = [
      { path: "/es" }, { path: "/en" }, { path: "/es/privacidad" }, { path: "/en/privacy" }, { path: "/es/terminos" }, { path: "/en/terms" }, { path: "other" },
      { referrerHost: "xn--80ak6aa92e.com" },
      { referrerHost: "a-b.c-d.example.co.uk" },
      { referrerHost: `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com` },
      { utmSource: "Aa0._~-".repeat(5).slice(0, 40), utmMedium: "x", utmCampaign: MARK },
    ];
    for (const extra of extremes) {
      await repository.save({ name: "page_view", locale: "es", device: "tablet", path: "/es", referrerHost: null, utmSource: null, utmMedium: null, utmCampaign: MARK, formMode: null, ...extra });
    }
    expect((await marked()).filter((item) => item.device === "tablet")).toHaveLength(extremes.length);
  });

  it("con una clave que no vale, falla sin repetir lo enviado", async () => {
    const repository = createSupabaseEventRepository({ url: URL_, secretKey: "clave-que-no-vale" });
    const error = await repository.save({ name: "page_view", locale: "es", device: "desktop", path: "/es", referrerHost: null, utmSource: "secreto", utmMedium: null, utmCampaign: MARK, formMode: null }).catch((reason: unknown) => reason as Error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("secreto");
  });
});
