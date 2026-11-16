import { describe, expect, it } from "vitest";
import { parseEnvFile, publicBuildEnv, releaseProblems, workerSecrets, type LegalState } from "../../scripts/lib/release";

const GOOD = {
  SERVICES: "real",
  NEXT_PUBLIC_SITE_URL: "https://confia.ing",
  NEXT_PUBLIC_CALENDLY_URL: "https://calendly.com/confiaing/30min",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAclavepublicareal",
  TURNSTILE_SECRET_KEY: "0x4AAAAAAAclavesecretareal",
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_valor",
  NOTIFY_FROM: "web@confia.ing",
  NOTIFY_TO: "equipo@example.com",
};
const draft: LegalState = { status: "draft", blockers: [] };
const check = (env: Record<string, string | undefined>, legal: LegalState = draft) => releaseProblems(env, legal);

// production-release · Comprobación previa del build (L10-1)
describe("comprobación previa al lanzamiento", () => {
  it("con todo en orden no hay problemas, y avisa de que los textos legales van en borrador", () => {
    const result = check(GOOD);
    expect(result.problems).toEqual([]);
    expect(result.warnings).toEqual(["Los textos legales se publican como borrador: con aviso y sin indexar.", "Sin NEXT_PUBLIC_CF_ANALYTICS_TOKEN: no se contarán visitas con Cloudflare Web Analytics."]);
  });

  it.each(Object.keys(GOOD))("sin %s, falla y la nombra", (key) => {
    const { problems } = check({ ...GOOD, [key]: key === "SERVICES" ? "memory" : "  " });
    expect(problems.some((problem) => problem.includes(key))).toBe(true);
  });

  it.each(["1x00000000000000000000AA", "2x00000000000000000000AB", "3x00000000000000000000FF"])("rechaza la clave pública de pruebas de Turnstile %s", (key) => {
    expect(check({ ...GOOD, NEXT_PUBLIC_TURNSTILE_SITE_KEY: key }).problems).toEqual(["NEXT_PUBLIC_TURNSTILE_SITE_KEY es una clave de pruebas de Turnstile: acepta a cualquiera."]);
  });

  it("rechaza la clave secreta de pruebas de Turnstile", () => {
    expect(check({ ...GOOD, TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" }).problems).toEqual([
      "TURNSTILE_SECRET_KEY es una clave de pruebas de Turnstile: acepta a cualquiera.",
    ]);
  });

  it.each(["http://confia.ing", "https://localhost:3000", "https://127.0.0.1", "confia.ing", "https://confia.ing/es"])("rechaza la dirección pública %s", (url) => {
    expect(check({ ...GOOD, NEXT_PUBLIC_SITE_URL: url }).problems.join(" ")).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it.each(["https://evil.example/confiaing", "http://calendly.com/x", "https://calendly.com/"])("rechaza un calendario que no es de Calendly: %s", (url) => {
    expect(check({ ...GOOD, NEXT_PUBLIC_CALENDLY_URL: url }).problems.join(" ")).toContain("NEXT_PUBLIC_CALENDLY_URL");
  });

  it.each(["http://127.0.0.1:54321", "https://example.com", "https://abc.supabase.co.evil.example"])("rechaza una base que no es el proyecto de Supabase: %s", (url) => {
    expect(check({ ...GOOD, SUPABASE_URL: url }).problems.join(" ")).toContain("SUPABASE_URL");
  });

  it.each(["no-es-un-correo", "a@b", "dos@example.com, tres@example.com"])("rechaza una dirección de aviso que no es un correo: %s", (value) => {
    expect(check({ ...GOOD, NOTIFY_TO: value }).problems.join(" ")).toContain("NOTIFY_TO");
  });

  it("el remitente debe ser del dominio del sitio", () => {
    expect(check({ ...GOOD, NOTIFY_FROM: "web@gmail.com" }).problems.join(" ")).toContain("NOTIFY_FROM");
  });

  it("vigente con bloqueos, falla; vigente y completo, pasa sin el aviso de borrador", () => {
    expect(check(GOOD, { status: "in-force", blockers: ["entity.name"] }).problems).toEqual(["Los textos legales no se pueden publicar como vigentes: falta entity.name."]);
    const result = check({ ...GOOD, NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "abc123def456" }, { status: "in-force", blockers: [] });
    expect(result).toEqual({ problems: [], warnings: [] });
  });

  it("ningún mensaje repite un valor del entorno", () => {
    const secrets = { ...GOOD, SUPABASE_SECRET_KEY: "sb_secret_MUYSECRETO", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA", NOTIFY_TO: "persona.real@example.com", NEXT_PUBLIC_SITE_URL: "http://sitio-interno.example" };
    const text = JSON.stringify(check(secrets));
    for (const value of ["MUYSECRETO", "persona.real", "sitio-interno", "1x000000"]) expect(text).not.toContain(value);
  });
});

describe("lectura del archivo de entorno", () => {
  it("lee pares clave=valor, con o sin comillas, e ignora comentarios y líneas vacías", () => {
    expect(parseEnvFile('# comentario\nA=1\n\nB="dos palabras"\nC=\'tres\'\n  D = cuatro  \nE=\nexport F=seis\nG=con=igual\nlinea sin igual\n')).toEqual({
      A: "1", B: "dos palabras", C: "tres", D: "cuatro", E: "", F: "seis", G: "con=igual",
    });
  });

  it("un comentario al final de la línea no forma parte del valor", () => {
    expect(parseEnvFile("A=https://calendly.com/x # producción\nB=\"con # dentro\"\nC=sin#espacio\n")).toEqual({ A: "https://calendly.com/x", B: "con # dentro", C: "sin#espacio" });
  });

  it("al build solo le pasa las variables públicas: ningún secreto entra en el proceso que construye", () => {
    expect(publicBuildEnv({ ...GOOD, NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "t", API_TOKEN: "x" })).toEqual({
      NEXT_PUBLIC_SITE_URL: GOOD.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_CALENDLY_URL: GOOD.NEXT_PUBLIC_CALENDLY_URL,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: GOOD.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "t",
    });
  });

  // production-release · Secretos solo en el Worker
  it("los secretos del Worker son exactamente cuatro, y ninguno es una variable pública", () => {
    expect(Object.keys(workerSecrets({ ...GOOD, NEXT_PUBLIC_CF_ANALYTICS_TOKEN: "t" })).sort()).toEqual(["NOTIFY_TO", "SUPABASE_SECRET_KEY", "SUPABASE_URL", "TURNSTILE_SECRET_KEY"]);
  });

  it("si falta alguno, falla nombrándolo y sin mostrar los demás", () => {
    let message = "";
    try {
      workerSecrets({ ...GOOD, NOTIFY_TO: " " });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("NOTIFY_TO");
    expect(message).not.toContain(GOOD.SUPABASE_SECRET_KEY);
  });
});
