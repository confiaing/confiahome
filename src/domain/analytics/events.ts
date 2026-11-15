import { host, tag } from "../attribution.ts";

// Eventos anónimos de la home (ADR-0005). Aquí se decide qué puede llegar a la base:
// ocho nombres y unos pocos datos de contexto, cada uno de una lista cerrada o con un
// formato estricto. Lo que el navegador envíe de más no pasa: el evento se construye
// campo a campo, nunca copiando lo recibido.

export const EVENT_NAMES = [
  "page_view",
  "cta_schedule_click",
  "cta_contact_click",
  "calendar_opened",
  "meeting_scheduled",
  "form_started",
  "form_submitted",
  "language_switched",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** Los eventos del formulario, los únicos que llevan el modo en que se usó. */
export const FORM_EVENTS: readonly EventName[] = ["form_started", "form_submitted"];

export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

const LOCALES = ["es", "en"] as const;
const FORM_MODES = ["terminal", "classic"] as const;

/** Ruta que no es de las del sitio: se guarda esta etiqueta, nunca el texto recibido. */
export const OTHER_PATH = "other";

export type AnalyticsEvent = {
  name: EventName;
  locale: (typeof LOCALES)[number];
  device: Device;
  path: string;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  formMode: (typeof FORM_MODES)[number] | null;
};

export type NormalizeResult = { ok: true; event: AnalyticsEvent } | { ok: false };

/** Devuelve la ruta canónica si `raw` es una página del sitio, o null. */
export type ResolvePath = (raw: string) => string | null;

const oneOf = <T extends string>(list: readonly T[], value: unknown): T | null =>
  typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null;

export function normalizeEvent(input: unknown, resolvePath: ResolvePath): NormalizeResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { ok: false };
  const raw = input as Record<string, unknown>;

  const name = oneOf(EVENT_NAMES, raw.name);
  const locale = oneOf(LOCALES, raw.locale);
  const device = oneOf(DEVICES, raw.device);
  if (!name || !locale || !device) return { ok: false };

  let formMode: AnalyticsEvent["formMode"] = null;
  if (FORM_EVENTS.includes(name)) {
    formMode = oneOf(FORM_MODES, raw.formMode);
    if (!formMode) return { ok: false };
  }

  return {
    ok: true,
    event: {
      name,
      locale,
      device,
      path: (typeof raw.path === "string" ? resolvePath(raw.path) : null) ?? OTHER_PATH,
      referrerHost: host(raw.referrerHost),
      utmSource: tag(raw.utmSource),
      utmMedium: tag(raw.utmMedium),
      utmCampaign: tag(raw.utmCampaign),
      formMode,
    },
  };
}
