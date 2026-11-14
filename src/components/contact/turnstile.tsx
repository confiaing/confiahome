"use client";

import { useEffect, useRef } from "react";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render(
    element: HTMLElement,
    options: { sitekey: string; callback(token: string): void; "error-callback"(): void; "expired-callback"(): void },
  ): string;
  remove(id: string): void;
  reset?(id: string): void;
};

type TurnstileProps = {
  /** Clave pública del widget. Sin ella (desarrollo y pruebas) no se carga nada. */
  siteKey: string | null;
  /** Al cambiar, se pide un token nuevo: el anterior ya se gastó en un envío fallido. */
  resetKey?: number;
  onToken(token: string): void;
  /** El script no cargó o el widget falló: sin verificación no se puede enviar. */
  onError(): void;
};

/**
 * Verificación antispam de Cloudflare Turnstile (ADR-0006). El script de terceros se
 * pide solo cuando el formulario se acerca a la pantalla, no al cargar la página.
 */
export function Turnstile({ siteKey, resetKey = 0, onToken, onError }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const lastReset = useRef(resetKey);
  const handlers = useRef({ onToken, onError });
  useEffect(() => {
    handlers.current = { onToken, onError };
  });

  useEffect(() => {
    const node = container.current;
    if (!siteKey || !node) return;

    let widget: string | undefined;
    let cancelled = false;
    const api = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

    const mount = () => {
      const turnstile = api();
      if (cancelled || !turnstile) return;
      widget = widgetId.current = turnstile.render(node, {
        sitekey: siteKey,
        callback: (token) => handlers.current.onToken(token),
        "error-callback": () => handlers.current.onError(),
        "expired-callback": () => handlers.current.onToken(""),
      });
    };

    const fail = () => {
      if (!cancelled) handlers.current.onError();
    };
    const load = () => {
      if (api()) return mount();
      // Si otro montaje ya pidió el script, se espera a ese mismo.
      let script = document.head.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT;
        script.async = true;
        document.head.append(script);
      }
      script.addEventListener("load", mount);
      script.addEventListener("error", fail);
    };

    let observer: IntersectionObserver | undefined;
    // Sin IntersectionObserver se carga ya: mejor antes que nunca.
    if (typeof IntersectionObserver === "undefined") load();
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          load();
        },
        { rootMargin: "600px" },
      );
      observer.observe(node);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (widget) api()?.remove(widget);
      widgetId.current = undefined;
    };
  }, [siteKey]);

  useEffect(() => {
    if (lastReset.current === resetKey) return;
    lastReset.current = resetKey;
    const turnstile = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!widgetId.current || !turnstile) return;
    handlers.current.onToken("");
    turnstile.reset?.(widgetId.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return <div ref={container} data-turnstile />;
}
