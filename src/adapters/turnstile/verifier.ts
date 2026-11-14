import type { SpamVerifier } from "@/domain/contact/ports";

// Verifica en el servidor el token de Cloudflare Turnstile (ADR-0006).

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TIMEOUT_MS = 8000;

export type TurnstileOptions = { secretKey: string; fetch?: typeof fetch };

export class TurnstileError extends Error {
  override readonly name = "TurnstileError";
  constructor(readonly status: number) {
    super(`Turnstile respondió ${status}.`);
  }
}

export function createTurnstileVerifier(options: TurnstileOptions): SpamVerifier {
  const send = options.fetch ?? fetch;
  return {
    async verify(token, remoteIp) {
      if (!token) return false;
      const form = new URLSearchParams({ secret: options.secretKey, response: token });
      // La IP solo viaja a Cloudflare para esta comprobación; no se guarda.
      if (remoteIp) form.set("remoteip", remoteIp);
      const response = await send(SITEVERIFY, { method: "POST", body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
      // Un fallo de Cloudflare no es «spam»: se propaga para responder «no disponible».
      if (!response.ok) throw new TurnstileError(response.status);
      const result = (await response.json()) as { success?: unknown };
      return result.success === true;
    },
  };
}
