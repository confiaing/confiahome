import type { RateLimiter } from "@/domain/contact/ports";

// Límite de frecuencia con el binding de Workers (ADR-0006). El límite y el periodo se
// declaran en wrangler.jsonc. La clave es la IP del visitante: vive en memoria de
// Cloudflare el tiempo del periodo y no se guarda en ninguna tabla.

/** El binding de límite de frecuencia del Worker. */
export type RateLimitBinding = { limit(options: { key: string }): Promise<{ success: boolean }> };

export function createBindingRateLimiter(binding: RateLimitBinding): RateLimiter {
  return {
    async allow(key) {
      const { success } = await binding.limit({ key: `contact:${key}` });
      return success;
    },
  };
}
