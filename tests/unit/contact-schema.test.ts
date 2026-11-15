import { describe, expect, it } from "vitest";
import { CONSENT_VERSION } from "@/domain/contact/consent";
import { parseContact } from "@/domain/contact/schema";

const base = { name: "Ana Ruiz", consent: true, locale: "es", formMode: "terminal" };
const errorsOf = (input: unknown) => {
  const result = parseContact(input);
  return result.ok ? {} : result.errors;
};

// contact-submission · Datos de una consulta válida (L5-1)
describe("consulta válida", () => {
  it("con nombre, correo, mensaje y consentimiento se acepta", () => {
    const result = parseContact({ ...base, email: "ana@empresa.com", message: "Conciliar facturas." });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ name: "Ana Ruiz", email: "ana@empresa.com", phone: null, company: null, message: "Conciliar facturas." });
  });

  it("solo con teléfono, sin correo ni mensaje, se acepta", () => {
    const result = parseContact({ ...base, phone: "+57 300 123 4567" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ email: null, phone: "+57 300 123 4567", message: null });
  });

  it("recorta los espacios sobrantes y trata lo vacío como ausente", () => {
    const result = parseContact({ ...base, name: "  Ana  ", company: "   ", email: "  ana@empresa.com ", phone: "", message: "\n hola \n" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ name: "Ana", company: null, email: "ana@empresa.com", phone: null, message: "hola" });
  });

  it("conserva idioma, modo, campos de control y atribución", () => {
    const result = parseContact({
      ...base,
      locale: "en",
      formMode: "classic",
      email: "ana@empresa.com",
      website: "",
      turnstileToken: "tok",
      utmSource: "boletin",
      referrerHost: "example.com",
    });
    expect(result.ok && result.data).toMatchObject({
      locale: "en",
      formMode: "classic",
      website: "",
      turnstileToken: "tok",
      utmSource: "boletin",
      utmMedium: null,
      referrerHost: "example.com",
    });
  });
});

describe("consulta rechazada", () => {
  it("sin correo ni teléfono: «correo o teléfono, al menos uno»", () => {
    expect(errorsOf(base)).toEqual({ email: "contact-required" });
    expect(errorsOf({ ...base, email: "  ", phone: "" })).toEqual({ email: "contact-required" });
  });

  it("informa a la vez de todo lo que falta: nombre, medio de contacto y aceptación", () => {
    expect(errorsOf({ ...base, name: "", consent: false })).toEqual({
      name: "required",
      email: "contact-required",
      consent: "consent-required",
    });
    // Si el teléfono ya tiene su propio error, no se añade el del medio de contacto.
    expect(errorsOf({ ...base, name: "", phone: "12" })).toEqual({ name: "required", phone: "phone-format" });
  });

  it.each(["ana", "ana@", "ana@empresa", "@empresa.com", "ana ruiz@empresa.com", "ana@empresa.c"])("correo mal formado: %s", (email) => {
    expect(errorsOf({ ...base, email })).toEqual({ email: "email-format" });
  });

  it.each(["12345", "abc", "+57 300", "(1) 23-45"])("teléfono con menos de siete dígitos: %s", (phone) => {
    expect(errorsOf({ ...base, phone })).toEqual({ phone: "phone-format" });
  });

  it("un correo válido no excusa un teléfono mal escrito, ni al revés", () => {
    expect(errorsOf({ ...base, email: "ana@empresa.com", phone: "123" })).toEqual({ phone: "phone-format" });
    expect(errorsOf({ ...base, email: "ana@", phone: "3001234567" })).toEqual({ email: "email-format" });
  });

  it("nombre ausente o hecho de espacios", () => {
    expect(errorsOf({ ...base, name: "   ", email: "ana@empresa.com" })).toEqual({ name: "required" });
    expect(errorsOf({ consent: true, locale: "es", formMode: "terminal", email: "ana@empresa.com" })).toEqual({ name: "required" });
  });

  it.each([
    ["name", 121],
    ["company", 161],
    ["message", 2001],
    ["phone", 33],
  ] as const)("%s por encima de su longitud máxima", (field, length) => {
    const value = field === "phone" ? "1".repeat(length) : "x".repeat(length);
    expect(errorsOf({ ...base, email: "ana@empresa.com", [field]: value })).toEqual({ [field]: "too-long" });
  });

  // contact-submission · Consentimiento registrado (L5-2)
  it.each([false, undefined, "true", 1, null])("sin consentimiento explícito (%s)", (consent) => {
    expect(errorsOf({ ...base, email: "ana@empresa.com", consent })).toEqual({ consent: "consent-required" });
  });

  it("varios errores a la vez, uno por campo", () => {
    expect(errorsOf({ ...base, name: "", email: "ana@", consent: false })).toEqual({
      name: "required",
      email: "email-format",
      consent: "consent-required",
    });
  });

  it.each([
    ["idioma no admitido", { locale: "fr" }],
    ["modo no admitido", { formMode: "otro" }],
    ["tipo inesperado", { phone: 42 }],
  ])("petición mal formada: %s", (_name, extra) => {
    const result = parseContact({ ...base, email: "ana@empresa.com", ...extra });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.malformed).toBe(true);
  });

  it.each([null, undefined, "texto", 7, []])("un cuerpo que no es un objeto (%s) está mal formado", (input) => {
    const result = parseContact(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.malformed).toBe(true);
  });
});

describe("versión del consentimiento", () => {
  it("es un identificador estable y no vacío", () => {
    expect(CONSENT_VERSION).toMatch(/^[a-z0-9-]{4,40}$/);
  });
});

describe("caracteres de control", () => {
  const dataOf = (input: unknown) => {
    const parsed = parseContact(input);
    if (!parsed.ok) throw new Error("se esperaba una consulta válida");
    return parsed.data;
  };

  it("se retiran de lo que se guarda: la base de datos no admite el carácter nulo", () => {
    const data = dataOf({ ...base, name: "Ana\u0000 Ruiz\u0007", email: "ana@empresa.com", company: "Ac\u001fme" });
    expect(data.name).toBe("Ana Ruiz");
    expect(data.company).toBe("Acme");
  });

  it("el mensaje conserva saltos de línea y tabuladores", () => {
    const data = dataOf({ ...base, email: "ana@empresa.com", message: "uno\n\tdos\u0000" });
    expect(data.message).toBe("uno\n\tdos");
  });

  it("un nombre hecho solo de caracteres de control cuenta como vacío", () => {
    expect(errorsOf({ ...base, name: "\u0000\u0001", email: "ana@empresa.com" })).toEqual({ name: "required" });
  });

  it("una lista no es un formulario: no produce errores de campo", () => {
    const parsed = parseContact([]);
    expect(parsed).toEqual({ ok: false, malformed: true, errors: {} });
  });
});

// release-quality · Datos de entrada acotados: las etiquetas de campaña de la consulta
describe("etiquetas de campaña de la consulta", () => {
  const dataOf = (input: unknown) => {
    const parsed = parseContact(input);
    if (!parsed.ok) throw new Error("se esperaba una consulta válida");
    return parsed.data;
  };
  const withContact = { ...base, email: "ana@empresa.com" };

  it("una etiqueta limpia se conserva", () => {
    expect(dataOf({ ...withContact, utmSource: "linkedin", utmMedium: "paid_social", utmCampaign: "q4-2026.v1" })).toMatchObject({
      utmSource: "linkedin",
      utmMedium: "paid_social",
      utmCampaign: "q4-2026.v1",
    });
  });

  it.each(["campaña de otoño", "ana@empresa.com", "<script>", "x".repeat(41), "x".repeat(500), "", 7, null, {}])(
    "una etiqueta que no lo es (%j) se guarda como ausente y la consulta se acepta",
    (value) => {
      expect(dataOf({ ...withContact, utmSource: value, utmMedium: value, utmCampaign: value })).toMatchObject({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      });
    },
  );
});

// release-quality · Datos de entrada acotados: la procedencia de la consulta y el campo trampa
describe("procedencia y campo trampa", () => {
  const dataOf = (input: unknown) => {
    const parsed = parseContact(input);
    if (!parsed.ok) throw new Error("se esperaba una consulta válida");
    return parsed.data;
  };
  const withContact = { ...base, email: "ana@empresa.com" };

  it.each([
    ["www.google.com", "www.google.com"],
    ["https://News.Example.com/x?y=1", "news.example.com"],
  ])("de la procedencia %s queda el host %s", (value, host) => {
    expect(dataOf({ ...withContact, referrerHost: value }).referrerHost).toBe(host);
  });

  it.each(["x\r\nIdentificador: falso", "texto libre con espacios", "ana@empresa.com", "a\u0000b.com", "android-app://com.example", "<b>", "x".repeat(300), 7, {}])(
    "una procedencia que no es un host (%j) se guarda como ausente y la consulta se acepta",
    (value) => {
      expect(dataOf({ ...withContact, referrerHost: value }).referrerHost).toBeNull();
    },
  );

  it("un campo trampa muy largo sigue siendo un campo trampa, no una petición mal formada", () => {
    const data = dataOf({ ...withContact, website: "x".repeat(5000) });
    expect(data.website).not.toBe("");
    expect(data.website.length).toBeLessThanOrEqual(200);
  });
});

