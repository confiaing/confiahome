/**
 * OpenNext incrusta en el Worker las variables de los archivos .env que Next.js carga en producción
 * (.open-next/cloudflare/next-env.mjs). Ahí no puede viajar ningún secreto: los de producción
 * se cargan con `wrangler secret put`.
 */
const SECRET_SUFFIX = /(?:_KEY|_SECRET|_TOKEN|_PASSWORD)$/;
const PUBLIC_BY_DESIGN = new Set(["SUPABASE_PUBLISHABLE_KEY"]);

type Embedded = Record<string, Record<string, string | undefined> | undefined>;

/** Nombres de los secretos con valor en el bloque de producción. Nunca devuelve valores. */
export function findEmbeddedSecrets(embedded: Embedded): string[] {
  return Object.entries(embedded.production ?? {})
    .filter(([name, value]) => {
      if (!value || value.trim() === "") return false;
      if (name.startsWith("NEXT_PUBLIC_") || PUBLIC_BY_DESIGN.has(name)) return false;
      return SECRET_SUFFIX.test(name);
    })
    .map(([name]) => name)
    .sort();
}
