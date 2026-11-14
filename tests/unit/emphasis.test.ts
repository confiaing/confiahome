import { describe, expect, it } from "vitest";
import { splitEmphasis, stripEmphasis } from "@/lib/emphasis";

describe("splitEmphasis", () => {
  it("un texto sin marcas es un solo tramo", () => {
    expect(splitEmphasis("Lo que ofrecemos")).toEqual([{ text: "Lo que ofrecemos", emphasis: false }]);
  });

  it("separa el tramo marcado con asteriscos", () => {
    expect(splitEmphasis("generar *resultados* en tu empresa.")).toEqual([
      { text: "generar ", emphasis: false },
      { text: "resultados", emphasis: true },
      { text: " en tu empresa.", emphasis: false },
    ]);
  });

  it("admite la marca al principio, al final y varias veces", () => {
    expect(splitEmphasis("*AI* transformation *now*")).toEqual([
      { text: "AI", emphasis: true },
      { text: " transformation ", emphasis: false },
      { text: "now", emphasis: true },
    ]);
  });

  it("un asterisco sin pareja se deja tal cual", () => {
    expect(splitEmphasis("5 * 3")).toEqual([{ text: "5 * 3", emphasis: false }]);
    expect(splitEmphasis("*uno* y * suelto")).toEqual([
      { text: "uno", emphasis: true },
      { text: " y * suelto", emphasis: false },
    ]);
  });

  it("stripEmphasis devuelve el texto sin marcas", () => {
    expect(stripEmphasis("hacemos *juntos*.")).toBe("hacemos juntos.");
  });
});
