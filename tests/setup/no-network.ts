import { beforeEach, vi } from "vitest";

// Las pruebas unitarias y de integración no usan red (CLAUDE.md, ADR-0008).
// Se bloquean las vías de red del navegador y fetch. Los módulos node:http/https no se interceptan:
// ningún código de src/ debe usarlos directamente.
const blocked = (what: string) =>
  function Blocked(target?: unknown): never {
    throw new Error(`Red bloqueada en pruebas: intento de ${what} a ${String(target)}`);
  };

beforeEach(() => {
  vi.stubGlobal("fetch", blocked("fetch"));
  vi.stubGlobal("WebSocket", blocked("WebSocket"));
  vi.stubGlobal("EventSource", blocked("EventSource"));
  vi.stubGlobal("XMLHttpRequest", blocked("XMLHttpRequest"));
});
