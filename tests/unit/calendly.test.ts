import { describe, expect, it } from "vitest";
import { CALENDLY_ORIGIN, calendlySignal, embedUrl } from "@/lib/calendly";
import { getDictionary } from "@/i18n/dictionaries";
import { findViolations } from "../support/claims";
import { leaves as dictionaryLeaves } from "../support/dictionary-leaves";

// scheduling · Confirmación con próximos pasos; Idioma del calendario
describe("mensajes de Calendly", () => {
  it.each([
    ["calendly.event_scheduled", "scheduled"],
    ["calendly.date_and_time_selected", "date-selected"],
    ["calendly.event_type_viewed", "viewed"],
    ["calendly.profile_page_viewed", "viewed"],
    ["calendly.page_height", "other"],
  ])("%s desde Calendly es «%s»", (event, signal) => {
    expect(calendlySignal(CALENDLY_ORIGIN, { event, payload: {} })).toBe(signal);
  });

  it.each(["https://calendly.com.evil.example", "https://evil.example", "http://calendly.com", "null", ""])(
    "un mensaje desde %s se ignora",
    (origin) => {
      expect(calendlySignal(origin, { event: "calendly.event_scheduled" })).toBeNull();
    },
  );

  it.each([null, undefined, "calendly.event_scheduled", 7, {}, { event: 3 }, { event: "otro.event_scheduled" }, []])(
    "datos que no son un mensaje de Calendly se ignoran: %j",
    (data) => {
      expect(calendlySignal(CALENDLY_ORIGIN, data)).toBeNull();
    },
  );
});

describe("dirección del calendario", () => {
  it("acepta una página de reserva de Calendly", () => {
    expect(embedUrl("https://calendly.com/confiaing/30min")).toBe("https://calendly.com/confiaing/30min");
    expect(embedUrl(" https://calendly.com/confiaing/30min/ ")).toBe("https://calendly.com/confiaing/30min/");
  });

  it.each([
    "http://calendly.com/confiaing/30min",
    "https://calendly.com.evil.example/x",
    "https://evil.example/calendly.com/x",
    "https://calendly.com/",
    "https://user:pass@calendly.com/x",
    "javascript:alert(1)",
    "no es una url",
    "",
  ])("rechaza %s", (value) => {
    expect(embedUrl(value)).toBeNull();
  });
});

// scheduling · El texto no promete lo que no se incluye
describe("textos de la agenda", () => {
  it.each(["es", "en"] as const)("en %s no presentan la llamada como diagnóstico ni prometen plazos", (locale) => {
    const entries = dictionaryLeaves(getDictionary(locale)).filter(([key]) => key.startsWith("agenda."));
    expect(entries.map(([key]) => key)).toEqual(expect.arrayContaining(["agenda.confirmedTitle", "agenda.confirmedSteps.0", "agenda.unavailable"]));
    expect(findViolations(entries)).toEqual([]);
  });

  it("la guarda detecta una confirmación que promete un diagnóstico o un plazo", () => {
    const rules = findViolations([
      ["agenda.confirmedSteps.0", "Te entregamos un diagnóstico de tu empresa."],
      ["agenda.confirmedIntro", "Te respondemos en dos días."],
    ]).map((violation) => violation.rule);
    expect(rules).toEqual(["la llamada presentada como diagnóstico", "plazo prometido"]);
  });
});
