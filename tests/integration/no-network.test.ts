import { describe, expect, it } from "vitest";

// app-shell · Sin red en unitario e integración
describe("red bloqueada", () => {
  it("cualquier fetch real hace fallar la prueba", () => {
    expect(() => fetch("https://example.com")).toThrow(/Red bloqueada/);
  });

  it("WebSocket, EventSource y XMLHttpRequest también están bloqueados", () => {
    expect(() => new WebSocket("wss://example.com")).toThrow(/Red bloqueada/);
    expect(() => new EventSource("https://example.com")).toThrow(/Red bloqueada/);
    expect(() => new XMLHttpRequest()).toThrow(/Red bloqueada/);
  });
});
