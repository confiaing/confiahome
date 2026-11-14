// Reglas editoriales del PRD (§5, §7 y §8) convertidas en comprobaciones. Son una red:
// detectan las formas habituales de un texto prohibido, no sustituyen la lectura humana.
// Si un texto legítimo tropieza con una regla (por ejemplo «sin garantías»), la regla se
// ajusta aquí de forma explícita; no se rodea.
export type Violation = { rule: string; key: string; text: string };
type Entry = [key: string, text: string];

// Certificación, cumplimiento y garantía, también con otros verbos.
const CERTIFICATION =
  /\b(certific\w*|cumpl\w*|garant\w*|homolog\w*|acredit\w*|asegur\w*|promet\w*|comprobad\w*|conform\w*|auditad\w*|certif\w*|compl(?:y|ies|ied|iant|iance)|guarante\w*|accredit\w*|ensur\w*|assur\w*|promis\w*|warrant\w*|proven|audited)/i;
// Sellos y normas: en mayúsculas, tal como se escriben.
const SEALS = /\b(ISO|SOC|HIPAA|GDPR|RGPD|PCI|NIST)\b/;

// Clientes, casos y prueba social.
const CLIENTS =
  /\bclientes? (como|que)\b|\bour (clients|customers)\b|\btrusted by\b|\btestimoni\w*|\bcasos? de éxito\b|\bcase stud\w*|\bsuccess stor\w*/i;

// Cifras de impacto, precios y plazos.
const FIGURES = /%|[$€£]|\b\d+\s?x\b|\b(por ciento|percent)\b/i;
const CURRENCY_CODES = /\b(USD|EUR|COP)\b/;
const MULTIPLIERS = /\b(mitad|doble|triple|duplic\w*|triplic\w*|twice|half)\b|\b\w+ (veces|times)\b/i;
const DEADLINES =
  /\b(en|in|within) (\d+|un|una|dos|tres|a|one|two|three) (d[ií]as?|horas?|semanas?|days?|hours?|weeks?)\b|\brespondemos en\b|\bwe (reply|respond|answer) (in|within)\b/i;

// Las dos únicas cifras que los textos pueden llevar, cada una en su sitio.
const THIRTY_MINUTES = /\b30[ -]minut\w*/gi;
const STAGE_TAG = /^home\.journey\.stages\.\d+\.tag$/;

// La llamada de 30 minutos no es un diagnóstico: en estas claves la palabra no puede aparecer.
const DIAGNOSIS = /diagn[oó]s\w*|assessment|audit\w*|evaluaci[oó]n\w*|evaluation/i;
export const CALL_KEYS =
  /^(agenda\.|nav\.|home\.actions\.|home\.closing\.|home\.hero\.(eyebrow|title)$|home\.journey\.stages\.0\.(name|tag)$)/;

// «Dónde empezamos» habla de trabajo, no de sectores.
const SECTORS =
  /\b(salud|banca|bancari\w*|finanzas|financier\w*|fintech|aseguradoras?|sector seguros|retail|manufactur\w*|educaci[oó]n|sector público|gobiernos?(?! de datos)|log[ií]stic\w*|hospital\w*|cl[ií]nicas?|healthcare|health sector|bank\w*|finance|insurance|education|government|logistics|law firms?|e-?commerce)\b/i;
const START_KEYS = /^home\.start\./;

export function findViolations(entries: Entry[]): Violation[] {
  const violations: Violation[] = [];

  for (const [key, text] of entries) {
    const flag = (rule: string) => violations.push({ rule, key, text });

    if (CERTIFICATION.test(text) || SEALS.test(text)) flag("certificación o garantía");
    if (CLIENTS.test(text)) flag("clientes o prueba social");
    if (FIGURES.test(text) || CURRENCY_CODES.test(text) || MULTIPLIERS.test(text)) flag("cifra de impacto o precio");
    if (DEADLINES.test(text)) flag("plazo prometido");

    // Cualquier otro número es sospechoso: se quitan los dos admitidos y no debe quedar ninguno.
    // «3D» es el nombre de la escena, no una cifra.
    const plain = text.replace(THIRTY_MINUTES, "").replace(/\b3D\b/g, "");
    const withoutAllowed = STAGE_TAG.test(key) ? plain.replace(/\b[1-5]\b/, "") : plain;
    if (/\d/.test(withoutAllowed)) flag("número fuera de la lista admitida");

    if (CALL_KEYS.test(key) && DIAGNOSIS.test(text)) flag("la llamada presentada como diagnóstico");
    if (START_KEYS.test(key) && SECTORS.test(text)) flag("sector en «Dónde empezamos»");
  }
  return violations;
}

/** Claves cuyo texto pasa por `Emphasized`: solo ellas pueden llevar *asteriscos*. */
export const EMPHASIS_KEYS = new Set([
  "home.hero.title",
  "home.start.title",
  "home.journey.title",
  "home.offer.main.title",
  "home.trust.title",
  "home.closing.title",
]);

/** Asteriscos donde se verían literales, o sin cerrar. */
export function findStrayEmphasis(entries: Entry[]): string[] {
  return entries
    .filter(([key, text]) => {
      const marks = (text.match(/\*/g) ?? []).length;
      return EMPHASIS_KEYS.has(key) ? marks % 2 !== 0 : marks > 0;
    })
    .map(([key]) => key);
}
