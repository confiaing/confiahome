import { describe, expect, it } from "vitest";
import { WORKER_LIMIT_BYTES, evaluateWorkerSize, parseGzipSize } from "../../scripts/lib/size";

// build-budgets · Límite de tamaño del Worker (L0-7)
describe("límite de tamaño del Worker", () => {
  it("el límite es 3 MiB", () => {
    expect(WORKER_LIMIT_BYTES).toBe(3 * 1024 * 1024);
  });

  it("por encima del límite falla y muestra tamaño y límite", () => {
    const result = evaluateWorkerSize(WORKER_LIMIT_BYTES + 1024);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/3073[.,]0 KiB/);
    expect(result.message).toMatch(/3072[.,]0 KiB/);
  });

  it("por debajo del límite pasa y muestra el margen", () => {
    const result = evaluateWorkerSize(1024 * 1024);
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/margen/i);
    expect(result.message).toMatch(/66[.,]7 %/);
  });

  it("justo en el límite pasa", () => {
    expect(evaluateWorkerSize(WORKER_LIMIT_BYTES).ok).toBe(true);
  });

  it("sin medida falla indicando que no pudo medir", () => {
    const result = evaluateWorkerSize(null);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/no se pudo medir/i);
  });
});

describe("lectura de la salida de wrangler", () => {
  it("extrae el tamaño comprimido en KiB", () => {
    expect(parseGzipSize("Total Upload: 4521.33 KiB / gzip: 912.05 KiB")).toBe(Math.round(912.05 * 1024));
  });

  it("extrae el tamaño comprimido en MiB", () => {
    expect(parseGzipSize("Total Upload: 9.1 MiB / gzip: 2.5 MiB")).toBe(Math.round(2.5 * 1024 * 1024));
  });

  it("devuelve null si la salida no trae el dato", () => {
    expect(parseGzipSize("Error: algo salió mal")).toBeNull();
  });
});
