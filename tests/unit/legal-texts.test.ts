import { describe, expect, it } from "vitest";
import { EVENT_RETENTION_MONTHS } from "@/domain/analytics/retention";
import { CONSENT_VERSION } from "@/domain/contact/consent";
import { CONTACT_RETENTION_MONTHS } from "@/domain/contact/retention";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/i18n/legal";
import { indexablePages, isLegalDraft, LEGAL_ENTITY, LEGAL_STATUS, legalRobots, publicationBlockers } from "@/i18n/legal/status";
import type { LegalDocument } from "@/i18n/legal/types";
import { findViolations } from "../support/claims";

const LOCALES = ["es", "en"] as const;
const KINDS = ["privacy", "terms"] as const;
const textOf = (document: LegalDocument) =>
  [document.title, ...document.intro, ...document.sections.flatMap((section) => [section.heading, ...section.blocks.flatMap((block) => ("p" in block ? [block.p] : block.list))])].join("\n");
const shape = (document: LegalDocument) => document.sections.map((section) => [section.id, section.blocks.map((block) => ("p" in block ? "p" : `list:${block.list.length}`))]);

// legal-pages · Política de privacidad; Términos
describe("estructura de los textos legales", () => {
  it("la política cubre los temas obligatorios, en este orden", () => {
    expect(getLegalDocument("es", "privacy").sections.map((section) => section.id)).toEqual([
      "controller", "data", "purposes", "authorization", "retention", "providers", "transfers", "rights", "contact", "cookies", "changes",
    ]);
  });

  it("los términos cubren los temas obligatorios", () => {
    expect(getLegalDocument("es", "terms").sections.map((section) => section.id)).toEqual([
      "purpose", "content", "conversation", "intellectual-property", "third-parties", "use", "liability", "law", "contact",
    ]);
  });

  it.each(KINDS)("%s: el inglés tiene las mismas secciones, párrafos y listas que el español", (kind) => {
    expect(shape(getLegalDocument("en", kind))).toEqual(shape(getLegalDocument("es", kind)));
    expect(getLegalDocument("en", kind).intro).toHaveLength(getLegalDocument("es", kind).intro.length);
  });

  it.each(LOCALES)("en %s ningún texto está vacío ni es igual en el otro idioma", (locale) => {
    const other = locale === "es" ? "en" : "es";
    for (const kind of KINDS) {
      const mine = getLegalDocument(locale, kind);
      const theirs = getLegalDocument(other, kind);
      expect(mine.title.trim()).not.toBe("");
      mine.sections.forEach((section, index) => {
        expect(section.heading.trim()).not.toBe("");
        expect(section.heading).not.toBe(theirs.sections[index]!.heading);
        for (const block of section.blocks) for (const text of "p" in block ? [block.p] : block.list) expect(text.trim().length).toBeGreaterThan(20);
      });
    }
  });

  it("solo usa las marcas previstas", () => {
    for (const document of Object.values(LEGAL_DOCUMENTS).flatMap((set) => Object.values(set))) {
      const marks = textOf(document).match(/\{[^}]*\}/g) ?? [];
      for (const mark of marks) expect(["{email}", "{entity:name}", "{entity:id}", "{entity:address}"]).toContain(mark);
      expect(textOf(document)).not.toMatch(/<[a-z/]/i);
    }
  });
});

// legal-pages · La política describe lo que el sitio hace
describe("coherencia con el sistema", () => {
  it("la versión de la política es la que se guarda con cada consulta", () => {
    for (const locale of LOCALES) expect(getLegalDocument(locale, "privacy").version).toBe(CONSENT_VERSION);
  });

  it.each([
    ["es", ["nombre", "empresa", "correo", "teléfono", "mensaje"]],
    ["en", ["name", "company", "email", "phone", "message"]],
  ] as const)("en %s nombra los cinco campos del formulario", (locale, words) => {
    const data = getLegalDocument(locale, "privacy").sections.find((section) => section.id === "data")!;
    const text = data.blocks.flatMap((block) => ("p" in block ? [block.p] : block.list)).join(" ").toLowerCase();
    for (const word of words) expect(text).toContain(word);
  });

  it.each(LOCALES)("en %s los plazos de conservación son los del sistema", (locale) => {
    const retention = getLegalDocument(locale, "privacy").sections.find((section) => section.id === "retention")!;
    const text = JSON.stringify(retention.blocks);
    expect(text).toContain(String(CONTACT_RETENTION_MONTHS));
    expect(text).toContain(String(EVENT_RETENTION_MONTHS));
    expect(text.match(/\d+/g)).toEqual([String(CONTACT_RETENTION_MONTHS), String(EVENT_RETENTION_MONTHS)]);
  });

  it.each(LOCALES)("en %s nombra a los proveedores y dice que Calendly solo se carga a petición", (locale) => {
    const providers = JSON.stringify(getLegalDocument(locale, "privacy").sections.find((section) => section.id === "providers")!.blocks);
    // Google aloja el buzón al que llega el aviso de cada consulta, con sus datos.
    for (const name of ["Cloudflare", "Supabase", "Google", "Calendly"]) expect(providers).toContain(name);
    expect(providers).toMatch(locale === "es" ? /solo se carga cuando/i : /only loads when/i);
  });

  it.each(LOCALES)("en %s la sección de cookies nombra lo que sí se guarda y la señal de no rastreo", (locale) => {
    const cookies = JSON.stringify(getLegalDocument(locale, "privacy").sections.find((section) => section.id === "cookies")!.blocks);
    expect(cookies).toContain("locale");
    expect(cookies).toContain("Global Privacy Control");
    expect(cookies).toContain("Do Not Track");
    expect(cookies).toMatch(locale === "es" ? /no usa cookies de publicidad ni de seguimiento/ : /does not use advertising or tracking cookies/);
  });

  it.each(LOCALES)("en %s la lista de lo que se guarda en el navegador tiene exactamente las dos preferencias propias", (locale) => {
    const section = getLegalDocument(locale, "privacy").sections.find((item) => item.id === "cookies")!;
    const list = section.blocks.find((block) => "list" in block) as { list: string[] };
    expect(list.list).toHaveLength(2);
    expect(list.list[0]).toContain("locale");
    // La versión de la página se guarda en el almacenamiento local, no en una cookie, y no caduca sola.
    expect(list.list[1]).toMatch(locale === "es" ? /almacenamiento local/ : /local storage/);
    const rest = JSON.stringify(section.blocks.filter((block) => "p" in block));
    expect(rest).toContain("Calendly");
    // Con la señal de no rastreo no hay registros propios NI contador de visitas (web-analytics.tsx).
    expect(rest).toMatch(locale === "es" ? /ni cargamos el contador de visitas/ : /nor load the visit counter/);
  });

  it.each(LOCALES)("en %s dice que la IP y el navegador se usan un instante contra el envío automatizado y no se guardan", (locale) => {
    const data = JSON.stringify(getLegalDocument(locale, "privacy").sections.find((item) => item.id === "data")!.blocks);
    expect(data).toMatch(locale === "es" ? /dirección IP y el tipo de navegador/ : /IP address and browser type/);
    expect(data).toMatch(locale === "es" ? /no los guardamos/ : /do not store them/);
  });

  it.each(LOCALES)("en %s dice que la procedencia y el idioma se guardan junto a la consulta", (locale) => {
    const data = JSON.stringify(getLegalDocument(locale, "privacy").sections.find((item) => item.id === "data")!.blocks);
    expect(data).toMatch(locale === "es" ? /junto a tu consulta/ : /together with your inquiry/);
    expect(data).toMatch(locale === "es" ? /idioma/ : /language/);
  });

  it.each(LOCALES)("en %s la conservación cubre también la copia que llega al correo", (locale) => {
    const retention = JSON.stringify(getLegalDocument(locale, "privacy").sections.find((item) => item.id === "retention")!.blocks);
    expect(retention).toMatch(locale === "es" ? /copia que llega a nuestro correo/ : /copy that reaches our mailbox/);
  });

  it.each(LOCALES)("en %s los términos describen la conversación como exploratoria, no como diagnóstico", (locale) => {
    const talk = JSON.stringify(getLegalDocument(locale, "terms").sections.find((section) => section.id === "conversation")!.blocks);
    expect(talk).toMatch(locale === "es" ? /exploratoria/ : /exploratory/);
    expect(talk).toMatch(locale === "es" ? /no es un diagnóstico/i : /not an assessment/i);
  });
});

// legal-pages · Datos pendientes a la vista, nunca inventados
describe("nada inventado", () => {
  it.each(LOCALES)("en %s no afirma certificaciones, clientes ni plazos de respuesta", (locale) => {
    for (const kind of KINDS) {
      const document = getLegalDocument(locale, kind);
      const entries = textOf(document).split("\n").map((text, index): [string, string] => [`legal.${kind}.${index}`, text]);
      // Los textos legales citan una ley y unos plazos de conservación: los números se revisan aparte.
      const violations = findViolations(entries).filter((violation) => violation.rule !== "número fuera de la lista admitida");
      expect(violations).toEqual([]);
    }
  });

  it("los únicos números son la ley citada, los plazos de conservación y los treinta minutos", () => {
    for (const locale of LOCALES) for (const kind of KINDS) {
      const numbers = new Set(textOf(getLegalDocument(locale, kind)).match(/\d+/g) ?? []);
      for (const value of numbers) expect(["1581", "2012", String(CONTACT_RETENTION_MONTHS), String(EVENT_RETENTION_MONTHS), "30"]).toContain(value);
    }
  });

  it("los datos del responsable no están rellenados con nada inventado", () => {
    expect(LEGAL_ENTITY).toEqual({ name: null, id: null, address: null });
  });
});

// legal-pages · Borrador señalado y no indexado
describe("estado legal", () => {
  it("hoy es borrador", () => {
    expect(LEGAL_STATUS).toBe("draft");
    expect(isLegalDraft()).toBe(true);
  });

  it("en borrador las legales no se indexan ni entran en las páginas indexables", () => {
    expect(legalRobots("draft")).toEqual({ index: false, follow: true });
    expect(indexablePages("draft")).toEqual(["home"]);
  });

  it("vigentes, se indexan y entran", () => {
    expect(legalRobots("in-force")).toEqual({ index: true, follow: true });
    expect(indexablePages("in-force")).toEqual(["home", "privacy", "terms"]);
    expect(isLegalDraft("in-force")).toBe(false);
  });

  // El interruptor no se puede accionar a medias: publicaría «[pendiente: …]» y «borrador» como texto vigente.
  it("pasar a vigente exige los datos del responsable y textos que ya no digan «borrador»", () => {
    const documents = Object.values(LEGAL_DOCUMENTS).flatMap((set) => Object.values(set));
    expect(publicationBlockers("draft", LEGAL_ENTITY, documents)).toEqual([]);
    expect(publicationBlockers("in-force", LEGAL_ENTITY, documents)).toEqual(
      expect.arrayContaining(["entity.name", "entity.id", "entity.address", "draft-wording"]),
    );
    const entity = { name: "Empresa de Prueba S.A.S.", id: "NIT de prueba", address: "Dirección de prueba" };
    expect(publicationBlockers("in-force", entity, documents)).toEqual(["draft-wording"]);
    const final = documents.map((document) => ({ ...document, version: "2027-01", updated: "Enero de 2027" }));
    expect(publicationBlockers("in-force", entity, final)).toEqual([]);
  });

  it("el estado actual no tiene nada que lo impida", () => {
    const documents = Object.values(LEGAL_DOCUMENTS).flatMap((set) => Object.values(set));
    expect(publicationBlockers(LEGAL_STATUS, LEGAL_ENTITY, documents)).toEqual([]);
  });
});
