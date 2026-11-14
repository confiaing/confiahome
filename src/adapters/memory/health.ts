import type { HealthCheck } from "@/domain/ports";

export function createMemoryHealthCheck(): HealthCheck {
  return {
    async ping() {
      return { ok: true, backend: "memory" };
    },
  };
}
