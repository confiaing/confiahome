/**
 * Configuración que puede llegar al navegador. Solo variables NEXT_PUBLIC_.
 * Los secretos viven en src/lib/server/env.ts y nunca se importan desde un componente.
 */
export const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CALENDLY_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_CF_ANALYTICS_TOKEN",
] as const;

type PublicEnvSource = Partial<Record<(typeof PUBLIC_ENV_KEYS)[number], string | undefined>>;

export type PublicEnv = {
  siteUrl: string;
  calendlyUrl: string;
  turnstileSiteKey: string | null;
  analyticsToken: string | null;
};

const present = (value: string | undefined) => (value && value.trim() !== "" ? value.trim() : null);

export function readPublicEnv(source: PublicEnvSource): PublicEnv {
  return {
    siteUrl: present(source.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
    calendlyUrl: present(source.NEXT_PUBLIC_CALENDLY_URL) ?? "https://calendly.com/confiaing/30min",
    turnstileSiteKey: present(source.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    analyticsToken: present(source.NEXT_PUBLIC_CF_ANALYTICS_TOKEN),
  };
}

// Next.js sustituye estas referencias en tiempo de build: deben escribirse una a una.
export const publicEnv: PublicEnv = readPublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_CF_ANALYTICS_TOKEN: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN,
});
