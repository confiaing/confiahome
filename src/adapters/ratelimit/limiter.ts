import type { RateLimiter } from "@/domain/contact/ports";

// Límite de frecuencia con el binding de Workers (ADR-0006). El límite y el periodo se
// declaran en wrangler.jsonc. La clave es la IP del visitante: vive en memoria de
// Cloudflare el tiempo del periodo y no se guarda en ninguna tabla.

/** El binding de límite de frecuencia del Worker. */
export type RateLimitBinding = { limit(options: { key: string }): Promise<{ success: boolean }> };

/** `scope` separa los contadores de cada uso (contacto, eventos) aunque compartan origen. */
export function createBindingRateLimiter(binding: RateLimitBinding, scope = "contact"): RateLimiter {
  return {
    async allow(key) {
      const { success } = await binding.limit({ key: `${scope}:${key}` });
      return success;
    },
  };
}
