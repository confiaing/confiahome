"use client";

import { useEffect } from "react";
import { optedOut } from "@/lib/privacy";

type WebAnalyticsProps = {
  /** Token público del sitio en Cloudflare Web Analytics. Sin él no se pide nada. */
  token: string | null;
};

const SRC = "https://static.cloudflareinsights.com/beacon.min.js";
// Un token de Cloudflare es hexadecimal; se admite algo más amplio, pero nada que no sea un identificador.
const TOKEN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Visitas con Cloudflare Web Analytics (ADR-0005): un script sin cookies, que no bloquea
 * el contenido. Se pide desde el navegador, y solo si el sitio tiene token y el visitante
 * no ha pedido que no se le rastree: la política de privacidad dice que con esa señal no
 * se cuenta la visita, y esto es lo que lo cumple. No pinta nada.
 */
export function WebAnalytics({ token }: WebAnalyticsProps) {
  const value = token?.trim() ?? "";

  useEffect(() => {
    if (!TOKEN.test(value) || optedOut()) return;
    if (document.head.querySelector(`script[src="${SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SRC;
    script.defer = true;
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: value }));
    document.head.append(script);
  }, [value]);

  return null;
}
