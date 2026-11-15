import { describe, expect, it } from "vitest";
import { deviceFor } from "@/domain/analytics/device";
import { EVENT_NAMES, normalizeEvent } from "@/domain/analytics/events";

const resolvePath = (raw: string) => (["/es", "/en", "/es/privacidad"].includes(raw) ? raw : null);
const base = { name: "page_view", locale: "es", device: "desktop", path: "/es" };
const eventOf = (input: unknown) => {
  const result = normalizeEvent(input, resolvePath);
  if (!result.ok) throw new Error("se esperaba un evento válido");
  return result.event;
};
const rejected = (input: unknown) => normalizeEvent(input, resolvePath).ok === false;

// analytics-events · Lista cerrada de eventos (L7-2)
describe("lista cerrada", () => {
  it("son exactamente ocho", () => {
    expect([...EVENT_NAMES].sort()).toEqual(
      ["calendar_opened", "cta_contact_click", "cta_schedule_click", "form_started", "form_submitted", "language_switched", "meeting_scheduled", "page_view"].sort(),
    );
  });

  it.each(EVENT_NAMES.filter((name) => !name.startsWith("form_")))("acepta %s", (name) => {
    expect(eventOf({ ...base, name }).name).toBe(name);
  });

  it.each(["signup", "PAGE_VIEW", "page_view ", "", 7, null, undefined])("rechaza el nombre %j", (name) => {
    expect(rejected({ ...base, name })).toBe(true);
  });

  it.each([null, undefined, "page_view", 3, [], [base]])("rechaza lo que no es un objeto: %j", (input) => {
    expect(rejected(input)).toBe(true);
  });
});

// analytics-events · Solo los datos previstos
describe("datos previstos", () => {
  it("descarta todo campo que no sea de la lista", () => {
    const event = eventOf({ ...base, email: "ana@empresa.com", message: "hola", visitorId: "abc", ip: "203.0.113.7", userAgent: "x" });
    expect(Object.keys(event).sort()).toEqual(
      ["device", "formMode", "locale", "name", "path", "referrerHost", "utmCampaign", "utmMedium", "utmSource"].sort(),
    );
    expect(JSON.stringify(event)).not.toMatch(/ana@|hola|abc|203\.0/);
  });

  it("el modo solo vale en los eventos del formulario, y en ellos es obligatorio", () => {
    expect(eventOf({ ...base, formMode: "terminal" }).formMode).toBeNull();
    expect(eventOf({ ...base, name: "form_started", formMode: "terminal" }).formMode).toBe("terminal");
    expect(eventOf({ ...base, name: "form_submitted", formMode: "classic" }).formMode).toBe("classic");
    expect(rejected({ ...base, name: "form_started" })).toBe(true);
    expect(rejected({ ...base, name: "form_submitted", formMode: "otro" })).toBe(true);
  });
});

// analytics-events · Valores acotados
describe("valores acotados", () => {
  it.each(["fr", "ES", "", 1, undefined])("rechaza el idioma %j", (locale) => {
    expect(rejected({ ...base, locale })).toBe(true);
  });

  it.each(["watch", "Mobile", "", undefined])("rechaza el dispositivo %j", (device) => {
    expect(rejected({ ...base, device })).toBe(true);
  });

  it.each(["ana@empresa.com", "campaña de otoño", "a b", "<script>", "x".repeat(121), "", 5, null])("un utm con %j queda ausente y el evento se guarda", (value) => {
    const event = eventOf({ ...base, utmSource: value, utmMedium: value, utmCampaign: value });
    expect(event).toMatchObject({ utmSource: null, utmMedium: null, utmCampaign: null });
  });

  it("una etiqueta admite hasta 40 caracteres: suficiente para una campaña, corto para un identificador largo", () => {
    expect(eventOf({ ...base, utmCampaign: "x".repeat(40) }).utmCampaign).toHaveLength(40);
    expect(eventOf({ ...base, utmCampaign: "x".repeat(41) }).utmCampaign).toBeNull();
  });

  it("un utm limpio se conserva", () => {
    expect(eventOf({ ...base, utmSource: "linkedin", utmMedium: "paid_social", utmCampaign: "q4-2026.v1~b" })).toMatchObject({
      utmSource: "linkedin",
      utmMedium: "paid_social",
      utmCampaign: "q4-2026.v1~b",
    });
  });

  it.each(["/es/secreto", "/es?email=ana@empresa.com", "https://otro.example/es", "", 4, undefined, "/es#x"])("la ruta %j se guarda como «other»", (path) => {
    expect(eventOf({ ...base, path }).path).toBe("other");
  });

  it("una ruta del sitio se conserva", () => {
    expect(eventOf({ ...base, path: "/es/privacidad" }).path).toBe("/es/privacidad");
  });

  it.each([
    ["https://www.Google.com/search?q=ana+ruiz", "www.google.com"],
    ["news.ycombinator.com", "news.ycombinator.com"],
    ["https://t.co/abc", "t.co"],
    ["http://example.com:8080/x", "example.com"],
  ])("de la procedencia %s solo queda el host %s", (value, host) => {
    expect(eventOf({ ...base, referrerHost: value }).referrerHost).toBe(host);
  });

  it.each(["ana ruiz", "ana@empresa.com", "javascript:alert(1)", "", "localhost", "a".repeat(260) + ".com", 9, null, "https://"])(
    "la procedencia %j queda ausente",
    (value) => {
      expect(eventOf({ ...base, referrerHost: value }).referrerHost).toBeNull();
    },
  );
});

// analytics-instrumentation · Tipo de dispositivo
describe("tipo de dispositivo", () => {
  it.each([
    [320, "mobile"],
    [767, "mobile"],
    [768, "tablet"],
    [1099, "tablet"],
    [1100, "desktop"],
    [2560, "desktop"],
  ] as const)("%i px es %s", (width, device) => {
    expect(deviceFor(width)).toBe(device);
  });
});
