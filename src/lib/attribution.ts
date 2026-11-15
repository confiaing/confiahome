/** De dónde llegó la visita: etiquetas de campaña y sitio de procedencia. No identifica a la persona. */
export type Attribution = {
  utmSource: string | undefined;
  utmMedium: string | undefined;
  utmCampaign: string | undefined;
  referrerHost: string | undefined;
};

const MAX = 120;

/**
 * Lee los parámetros utm_* de la dirección y el host del sitio de procedencia, si es
 * externo. Del resto de la dirección y de la procedencia no se toma nada.
 */
export function readAttribution(location: { search: string; host: string }, referrer: string): Attribution {
  const params = new URLSearchParams(location.search);
  const pick = (name: string) => params.get(name)?.slice(0, MAX) || undefined;

  let referrerHost: string | undefined;
  try {
    const from = referrer ? new URL(referrer) : null;
    // Se compara con puerto (el propio sitio puede estar en uno); se informa sin él.
    referrerHost = from && from.host !== location.host ? from.hostname || undefined : undefined;
  } catch {
    referrerHost = undefined;
  }
  return { utmSource: pick("utm_source"), utmMedium: pick("utm_medium"), utmCampaign: pick("utm_campaign"), referrerHost };
}
