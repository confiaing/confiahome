import type { ContactRecord, ContactRepository, Logger, Notifier, RateLimiter, SavedContact, SpamVerifier } from "@/domain/contact/ports";

// Adaptadores en memoria: los usan las pruebas y el desarrollo local (SERVICES=memory).
// No hacen red ni tocan ninguna base de datos.

class Unavailable extends Error {
  override readonly name = "MemoryUnavailable";
}

export function createMemoryContactRepository(options: { failing?: boolean } = {}): ContactRepository & { records: SavedContact[] } {
  const records: SavedContact[] = [];
  return {
    records,
    async save(record: ContactRecord) {
      if (options.failing) throw new Unavailable("El almacén en memoria está configurado para fallar.");
      const saved = { ...record, id: `mem-${records.length + 1}` };
      records.push(saved);
      return saved;
    },
  };
}

export function createMemoryNotifier(options: { failing?: boolean } = {}): Notifier & { sent: SavedContact[] } {
  const sent: SavedContact[] = [];
  return {
    sent,
    async notify(contact) {
      if (options.failing) throw new Unavailable("El avisador en memoria está configurado para fallar.");
      sent.push(contact);
    },
  };
}

/** Acepta cualquier token salvo «invalid», para poder probar el rechazo. */
export function createMemorySpamVerifier(): SpamVerifier {
  return {
    async verify(token) {
      return token !== "invalid";
    },
  };
}

/** Cuenta envíos por origen, sin ventana de tiempo: suficiente para pruebas y desarrollo. */
export function createMemoryRateLimiter(limit: number): RateLimiter & { reset(): void } {
  const counts = new Map<string, number>();
  return {
    reset: () => counts.clear(),
    async allow(key) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return count <= limit;
    },
  };
}

type LogEntry = { level: "error" | "info"; code: string; context?: Record<string, string | number | boolean> };

export function createMemoryLogger(): Logger & { entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    entries,
    error: (code, context) => void entries.push({ level: "error", code, context }),
    info: (code, context) => void entries.push({ level: "info", code, context }),
  };
}
