import { afterAll, describe, expect, it } from "vitest";
import { createSupabaseHealthCheck } from "@/adapters/supabase/health";
import { createSupabasePurger } from "@/adapters/supabase/purger";
import { CONSENT_VERSION } from "@/domain/contact/consent";

const URL_ = process.env.CONTRACT_SUPABASE_URL!;
const SECRET = process.env.CONTRACT_SUPABASE_SECRET_KEY!;
const MARK = `purga-${Date.now()}`;
const headers = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
const options = { url: URL_, secretKey: SECRET };

const insert = (table: string, rows: unknown[]) => fetch(`${URL_}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(rows) });
const dates = async (table: string, column: string) =>
  ((await (await fetch(`${URL_}/rest/v1/${table}?${column}=eq.${MARK}&select=created_at&order=created_at`, { headers })).json()) as { created_at: string }[]).map((row) =>
    new Date(row.created_at).toISOString(),
  );

afterAll(async () => {
  await fetch(`${URL_}/rest/v1/contact_requests?company=eq.${MARK}`, { method: "DELETE", headers });
  await fetch(`${URL_}/rest/v1/analytics_events?utm_campaign=eq.${MARK}`, { method: "DELETE", headers });
});

// scheduled-maintenance · Latido diario (L9-8)
describe("latido contra Supabase local", () => {
  it("responde que el almacén está disponible", async () => {
    expect(await createSupabaseHealthCheck(options).ping()).toEqual({ ok: true, backend: "real" });
  });

  it("con una clave que no vale, dice que no está disponible", async () => {
    expect(await createSupabaseHealthCheck({ url: URL_, secretKey: "clave-que-no-vale" }).ping()).toEqual({ ok: false, backend: "real" });
  });
});

// scheduled-maintenance · Borrado por conservación
describe("borrado por fecha contra Supabase local", () => {
  const CUTOFF = new Date("2024-11-15T03:10:00.000Z");

  it("consultas: borra las anteriores a la fecha de corte y deja las demás", async () => {
    const contact = (created_at: string) => ({ name: "Prueba de purga", company: MARK, email: "purga@example.com", locale: "es", consent_at: created_at, consent_version: CONSENT_VERSION, created_at });
    const response = await insert("contact_requests", [contact("2023-01-10T00:00:00.000Z"), contact("2024-11-15T03:09:59.000Z"), contact("2024-11-15T03:10:00.000Z"), contact("2026-11-01T00:00:00.000Z")]);
    expect(response.status).toBe(201);

    const purged = await createSupabasePurger({ ...options, table: "contact_requests" }).purgeOlderThan(CUTOFF);
    expect(purged).toBeGreaterThanOrEqual(2);
    expect(await dates("contact_requests", "company")).toEqual(["2024-11-15T03:10:00.000Z", "2026-11-01T00:00:00.000Z"]);
  });

  it("eventos: borra los anteriores a la fecha de corte y deja los demás", async () => {
    const event = (created_at: string) => ({ name: "page_view", locale: "es", device: "desktop", path: "/es", utm_campaign: MARK, created_at });
    const response = await insert("analytics_events", [event("2025-01-01T00:00:00.000Z"), event("2026-11-10T00:00:00.000Z")]);
    expect(response.status).toBe(201);

    const purged = await createSupabasePurger({ ...options, table: "analytics_events" }).purgeOlderThan(new Date("2025-10-15T03:10:00.000Z"));
    expect(purged).toBeGreaterThanOrEqual(1);
    expect(await dates("analytics_events", "utm_campaign")).toEqual(["2026-11-10T00:00:00.000Z"]);
  });

  it("repetirlo no borra nada más", async () => {
    expect(await createSupabasePurger({ ...options, table: "contact_requests" }).purgeOlderThan(CUTOFF)).toBe(0);
  });
});
