type WebAnalyticsProps = {
  /** Token público del sitio en Cloudflare Web Analytics. Sin él no se incluye nada. */
  token: string | null;
};

// Un token de Cloudflare es hexadecimal; se admite algo más amplio, pero nada que no sea un identificador.
const TOKEN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Visitas con Cloudflare Web Analytics (ADR-0005): un script sin cookies, que no bloquea
 * el contenido. Solo se incluye cuando el sitio tiene token; en desarrollo y en las
 * pruebas no lo hay, y no se pide nada a Cloudflare.
 */
export function WebAnalytics({ token }: WebAnalyticsProps) {
  const value = token?.trim() ?? "";
  if (!TOKEN.test(value)) return null;
  return <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: value })} />;
}
