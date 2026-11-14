import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES } from "@/i18n/locales";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/types/${name}`, import.meta.url));

function diagnostics(file: string): string[] {
  const program = ts.createProgram([file], {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    skipLibCheck: true,
  });
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}

// translations · Paridad de claves entre idiomas (L2-3)
describe("paridad de los diccionarios", () => {
  it("una clave ausente rompe la comprobación de tipos y la nombra", () => {
    const messages = diagnostics(fixture("missing-key.ts"));
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.join("\n")).toContain("skipLink");
  }, 30_000);

  it("una clave sobrante rompe la comprobación de tipos y la nombra", () => {
    const messages = diagnostics(fixture("extra-key.ts"));
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.join("\n")).toContain("soloEnIngles");
  }, 30_000);

  it("los diccionarios reales tienen las mismas claves y ningún texto vacío", () => {
    const [es, en] = LOCALES.map((locale) => leaves(getDictionary(locale)));
    expect(en!.map(([key]) => key)).toEqual(es!.map(([key]) => key));
    for (const [key, value] of [...es!, ...en!]) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim(), key).not.toBe("");
    }
  });

  it("cada idioma tiene su propio texto donde la traducción difiere", () => {
    expect(getDictionary("es").skipLink).toBe("Saltar al contenido");
    expect(getDictionary("en").skipLink).toBe("Skip to content");
  });
});
