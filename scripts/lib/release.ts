// Comprobación previa al lanzamiento: ¿sirve este entorno para construir y desplegar en
// producción? Funciones puras. Los mensajes nombran la variable, nunca su valor.

export type Env = Record<string, string | undefined>;
export type LegalState = { status: "draft" | "in-force"; blockers: string[] };
export type ReleaseCheck = { problems: string[]; warnings: string[] };

// Claves oficiales de prueba de Turnstile: aceptan (o rechazan) a cualquiera.
const TURNSTILE_TEST_KEY = /^[123]x0{10,}/;
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
const present = (value: string | undefined) => (value ?? "").trim();

function url(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function releaseProblems(env: Env, legal: LegalState): ReleaseCheck {
  const problems: string[] = [];
  const warnings: string[] = [];
  const missing = (name: string) => `Falta ${name}.`;

  if (present(env.SERVICES) !== "real") problems.push("SERVICES debe ser «real» en producción.");

  const site = url(present(env.NEXT_PUBLIC_SITE_URL));
  const local = site ? ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname) : false;
  if (!site || site.protocol !== "https:" || local || site.pathname !== "/" || site.search !== "") {
    problems.push("NEXT_PUBLIC_SITE_URL debe ser la dirección pública del sitio: HTTPS, sin ruta y no local.");
  }

  const calendar = url(present(env.NEXT_PUBLIC_CALENDLY_URL));
  if (!calendar || calendar.origin !== "https://calendly.com" || calendar.pathname.replace(/\/+$/, "") === "") {
    problems.push("NEXT_PUBLIC_CALENDLY_URL debe ser una página de reserva de https://calendly.com.");
  }

  for (const name of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const) {
    const value = present(env[name]);
    if (!value) problems.push(missing(name));
    else if (TURNSTILE_TEST_KEY.test(value)) problems.push(`${name} es una clave de pruebas de Turnstile: acepta a cualquiera.`);
  }

  const database = url(present(env.SUPABASE_URL));
  if (!database || database.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(database.hostname)) {
    problems.push("SUPABASE_URL debe ser la dirección HTTPS del proyecto de Supabase de producción.");
  }
  if (!present(env.SUPABASE_SECRET_KEY)) problems.push(missing("SUPABASE_SECRET_KEY"));

  const from = present(env.NOTIFY_FROM);
  if (!EMAIL.test(from) || (site && !from.endsWith(`@${site.hostname}`))) {
    problems.push("NOTIFY_FROM debe ser una dirección del dominio del sitio.");
  }
  if (!EMAIL.test(present(env.NOTIFY_TO))) problems.push("NOTIFY_TO debe ser una sola dirección de correo, verificada en Email Routing.");

  if (legal.status === "in-force") {
    if (legal.blockers.length > 0) problems.push(`Los textos legales no se pueden publicar como vigentes: falta ${legal.blockers.join(", ")}.`);
  } else {
    warnings.push("Los textos legales se publican como borrador: con aviso y sin indexar.");
  }
  if (!present(env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN)) warnings.push("Sin NEXT_PUBLIC_CF_ANALYTICS_TOKEN: no se contarán visitas con Cloudflare Web Analytics.");

  return { problems, warnings };
}

/** Lee un archivo .env: pares clave=valor, con o sin comillas. */
export function parseEnvFile(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const raw = match[2]!;
    const quoted = /^(["'])(.*)\1$/.exec(raw);
    // Sin comillas, « #» abre un comentario: no forma parte del valor.
    result[match[1]!] = quoted ? quoted[2]! : raw.replace(/\s+#.*$/, "");
  }
  return result;
}

/**
 * Lo único del entorno de producción que necesita el build: las variables públicas, que
 * se incrustan en la página. Los secretos no entran en el proceso que construye; al
 * Worker le llegan con `wrangler secret put`.
 */
export function publicBuildEnv(env: Env): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => entry[0].startsWith("NEXT_PUBLIC_") && present(entry[1]) !== ""));
}

/** Lo que el Worker recibe con `wrangler secret`: claves, y los dos datos propios de producción que no van en wrangler.jsonc. */
export const WORKER_SECRETS = ["SUPABASE_SECRET_KEY", "TURNSTILE_SECRET_KEY", "SUPABASE_URL", "NOTIFY_TO"] as const;

export function workerSecrets(env: Env): Record<string, string> {
  const missing = WORKER_SECRETS.filter((name) => present(env[name]) === "");
  if (missing.length > 0) throw new Error(`Faltan en el entorno de producción: ${missing.join(", ")}.`);
  return Object.fromEntries(WORKER_SECRETS.map((name) => [name, present(env[name])]));
}

