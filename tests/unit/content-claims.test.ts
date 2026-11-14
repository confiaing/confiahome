import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES } from "@/i18n/locales";
import { findStrayEmphasis, findViolations } from "../support/claims";
import { leaves } from "../support/dictionary-leaves";
import { UNTRANSLATED } from "../support/untranslated";

const es = getDictionary("es");
const en = getDictionary("en");

// content-claims · Los textos reales cumplen las reglas editoriales (L3-5)
describe("textos del sitio", () => {
  it.each(LOCALES)("el diccionario %s no contiene afirmaciones prohibidas", (locale) => {
    expect(findViolations(leaves(getDictionary(locale)))).toEqual([]);
  });

  it("la primera etapa dice expresamente que no es un diagnóstico", () => {
    expect(es.home.journey.stages[0]!.does).toMatch(/no (es )?un diagnóstico/);
    expect(en.home.journey.stages[0]!.does).toMatch(/not an assessment/);
  });

  it("la nota de las acciones describe una conversación exploratoria, sin costo ni compromiso", () => {
    expect(es.home.actions.note).toMatch(/exploratoria/);
    expect(es.home.actions.note).toMatch(/sin costo ni compromiso/);
    expect(en.home.actions.note).toMatch(/exploratory/);
    expect(en.home.actions.note).toMatch(/no cost/);
    expect(en.home.actions.note).toMatch(/no commitment/);
  });

  it("la experiencia se atribuye a quienes integran el equipo y a trabajo previo", () => {
    expect(es.home.trust.note).toBe("Experiencia previa de quienes integran el equipo.");
    expect(en.home.trust.note).toMatch(/team members/);
    expect(en.home.trust.note).toMatch(/previous/);
  });

  it.each(LOCALES)("en %s los asteriscos solo aparecen, y por pares, en los títulos que los interpretan", (locale) => {
    expect(findStrayEmphasis(leaves(getDictionary(locale)))).toEqual([]);
  });

  it("el mensaje de seguridad habla de riesgos que se consideran", () => {
    expect(es.home.trust.security).toMatch(/consideramos riesgos/);
    expect(en.home.trust.security).toMatch(/consider risks/);
  });
});

// content-claims · Inglés redactado, no copiado (L3-7)
describe("traducción", () => {
  it("ningún texto inglés es idéntico al español, salvo los nombres propios listados", () => {
    const spanish = new Map(leaves(es));
    const copies = leaves(en)
      .filter(([key, text]) => spanish.get(key) === text && !UNTRANSLATED.has(key))
      .map(([key]) => key);
    expect(copies).toEqual([]);
  });

  it("la lista de excepciones no tiene entradas sobrantes", () => {
    const spanish = new Map(leaves(es));
    const english = new Map(leaves(en));
    for (const key of UNTRANSLATED) expect(english.get(key), key).toBe(spanish.get(key));
  });

  it("las listas tienen el tamaño acordado en ambos idiomas", () => {
    for (const home of [es.home, en.home]) {
      expect(home.hero.pillars).toHaveLength(3);
      expect(home.start.frictions).toHaveLength(4);
      expect(home.start.questions).toHaveLength(4);
      expect(home.journey.stages).toHaveLength(5);
      expect(home.offer.rest).toHaveLength(4);
      expect(home.trust.items).toHaveLength(4);
      expect(home.trust.principles).toHaveLength(3);
    }
  });
});

// content-claims · Revisión de la redacción inglesa (L3-7): el documento que revisa el
// fundador debe contener el texto vigente de ambos idiomas.
describe("documento de contenido", () => {
  it("docs/content/home.md recoge todos los textos de la home en español e inglés", () => {
    const doc = readFileSync(fileURLToPath(new URL("../../docs/content/home.md", import.meta.url)), "utf8");
    for (const [key, text] of [...leaves(es.home), ...leaves(en.home)]) {
      expect(doc.includes(text.replace(/\|/g, "\\|")), `${key}: ejecuta npm run content:doc`).toBe(true);
    }
  });
});

// Cada guarda debe fallar con un texto prohibido: si no, no protege de nada.
describe("las guardas detectan textos prohibidos", () => {
  it.each([
    ["certificación o garantía", "home.trust.security", "Estamos certificados en ISO 27001."],
    ["certificación o garantía", "home.trust.security", "Cumplimos con la normativa."],
    ["certificación o garantía", "home.trust.security", "Garantizamos resultados."],
    ["certificación o garantía", "home.trust.security", "Aseguramos que tus datos no se filtran."],
    ["certificación o garantía", "home.trust.security", "Te prometemos resultados."],
    ["certificación o garantía", "home.trust.security", "Auditados SOC 2."],
    ["certificación o garantía", "home.trust.security", "We are SOC 2 compliant."],
    ["certificación o garantía", "home.trust.security", "HIPAA-ready and GDPR-ready."],
    ["certificación o garantía", "home.trust.security", "Results guaranteed."],
    ["certificación o garantía", "home.trust.security", "We ensure your data never leaks."],
    ["certificación o garantía", "home.trust.items.0", "Proven results."],
    ["clientes o prueba social", "home.trust.items.0", "Clientes como una gran aseguradora confían en nosotros."],
    ["clientes o prueba social", "home.trust.items.0", "Trusted by leading companies."],
    ["clientes o prueba social", "home.trust.items.0", "Our clients love the results."],
    ["cifra de impacto o precio", "home.trust.items.0", "Reducimos costos un 40%."],
    ["cifra de impacto o precio", "home.trust.items.0", "Reducimos costos a la mitad."],
    ["cifra de impacto o precio", "home.trust.items.0", "Duplicamos la productividad."],
    ["cifra de impacto o precio", "home.trust.items.0", "Ten times faster."],
    ["cifra de impacto o precio", "home.offer.main.text", "Desde $500 al mes."],
    ["cifra de impacto o precio", "home.offer.main.text", "Desde 500 USD al mes."],
    ["cifra de impacto o precio", "home.offer.main.text", "Tu equipo rinde 10x más."],
    ["plazo prometido", "home.closing.inquiryText", "Respondemos en 2 días."],
    ["plazo prometido", "home.closing.inquiryText", "Results in four weeks, we respond within a day."],
    ["número fuera de la lista admitida", "home.trust.items.0", "Más de 120 clientes."],
    ["número fuera de la lista admitida", "home.trust.items.0", "Más de 30 clientes."],
    ["número fuera de la lista admitida", "home.trust.items.0", "En 3 pasos."],
    ["la llamada presentada como diagnóstico", "home.actions.schedule", "Agenda tu diagnóstico gratuito"],
    ["la llamada presentada como diagnóstico", "home.actions.inquire", "Pide tu diagnóstico"],
    ["la llamada presentada como diagnóstico", "home.hero.eyebrow", "Diagnóstico gratuito en 30 minutos"],
    ["la llamada presentada como diagnóstico", "home.journey.stages.0.name", "Diagnóstico inicial"],
    ["la llamada presentada como diagnóstico", "home.closing.inquiryText", "Pide tu evaluación sin costo"],
    ["la llamada presentada como diagnóstico", "agenda.cta", "Book a free assessment"],
    ["la llamada presentada como diagnóstico", "agenda.cta", "Book your AI audit"],
    ["sector en «Dónde empezamos»", "home.start.frictions.0.text", "Pensado para banca y aseguradoras."],
    ["sector en «Dónde empezamos»", "home.start.lede", "Trabajamos con hospitales, clínicas y fintech."],
    ["sector en «Dónde empezamos»", "home.start.questions.1", "Built for healthcare teams and law firms."],
  ])("%s: %s → «%s»", (rule, key, text) => {
    expect(findViolations([[key, text]]).map((violation) => violation.rule)).toContain(rule);
  });

  it("no marcan los textos legítimos parecidos", () => {
    expect(
      findViolations([
        ["home.hero.lede", "Te acompañamos desde el diagnóstico hasta soluciones que tu equipo pueda operar."],
        ["home.journey.stages.0.does", "Es una conversación, no un diagnóstico ni un compromiso."],
        ["home.journey.stages.0.tag", "Etapa 1 · 30 minutos"],
        ["home.trust.items.1", "Sector salud: un sistema RAG agentivo."],
        ["home.trust.items.0", "SaaS companies with customers around the world."],
        ["home.actions.schedule", "Book a 30-minute conversation"],
        ["home.actions.note", "Una conversación exploratoria, sin costo ni compromiso."],
        ["home.offer.rest.3.text", "A complete handover to your team."],
        ["home.start.frictions.0.text", "Mantén tus datos seguros. ¿Gobierno de datos? A healthy process."],
        ["home.journey.stages.3.next", "If it proves its value, we scale it."],
      ]),
    ).toEqual([]);
  });

  it("detectan asteriscos donde se verían literales o sin cerrar", () => {
    expect(findStrayEmphasis([["home.offer.title", "Lo que *ofrecemos*"]])).toEqual(["home.offer.title"]);
    expect(findStrayEmphasis([["home.hero.title", "Encuentra *resultados"]])).toEqual(["home.hero.title"]);
    expect(findStrayEmphasis([["home.hero.title", "Encuentra *resultados*."]])).toEqual([]);
  });
});
