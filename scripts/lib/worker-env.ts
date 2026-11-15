/**
 * OpenNext incrusta en el Worker las variables de los archivos .env que Next.js carga en producción
 * (.open-next/cloudflare/next-env.mjs). Ahí no puede viajar ningún secreto: los de producción
 * se cargan con `wrangler secret put`.
 */
const SECRET_SUFFIX = /(?:_KEY|_SECRET|_TOKEN|_PASSWORD)$/;
const PUBLIC_BY_DESIGN = new Set(["SUPABASE_PUBLISHABLE_KEY"]);

type Embedded = Record<string, Record<string, string | undefined> | undefined>;

/**
 * Nombres de los secretos con valor en cualquiera de los bloques incrustados. OpenNext
 * incrusta tres (producción, desarrollo y pruebas) y los tres viajan en el Worker que se
 * sube: un secreto de `.env.development.local` también acabaría en Cloudflare.
 * Nunca devuelve valores.
 */
export function findEmbeddedSecrets(embedded: Embedded): string[] {
  const names = new Set<string>();
  for (const block of Object.values(embedded)) {
    for (const [name, value] of Object.entries(block ?? {})) {
      if (!value || value.trim() === "") continue;
      if (name.startsWith("NEXT_PUBLIC_") || PUBLIC_BY_DESIGN.has(name)) continue;
      if (SECRET_SUFFIX.test(name)) names.add(name);
    }
  }
  return [...names].sort();
}

const BLOCK = /^export const (production|development|test) = (\{.*\});$/;

/**
 * El archivo de variables incrustadas con los bloques de desarrollo y de pruebas vacíos.
 * El Worker desplegado solo usa el de producción; el entorno local llega por `.dev.vars`.
 * Si el archivo no tiene la forma que se espera, lanza: no se da por limpio lo que no se entiende.
 */
export function keepProductionOnly(source: string): string {
  const seen = new Set<string>();
  const lines = source.split("\n").map((line) => {
    if (line.trim() === "") return line;
    const match = BLOCK.exec(line);
    if (!match) throw new Error("El archivo de variables incrustadas no tiene la forma esperada.");
    JSON.parse(match[2]!);
    seen.add(match[1]!);
    return match[1] === "production" ? line : `export const ${match[1]} = {};`;
  });
  if (seen.size !== 3) throw new Error("El archivo de variables incrustadas no trae los tres bloques esperados.");
  return lines.join("\n");
}
