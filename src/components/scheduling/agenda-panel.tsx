"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { loadCalendly } from "@/components/scheduling/calendly-loader";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextLink } from "@/components/ui/text-link";
import type { Dictionary } from "@/i18n/dictionaries";
import { calendlySignal, embedUrl } from "@/lib/calendly";
import { cx } from "@/lib/cx";

type AgendaPanelProps = {
  labels: Dictionary["agenda"];
  /** Página de reserva de Calendly. */
  calendarUrl: string;
  /** El calendario no está en el idioma de la página: se avisa antes de cargarlo. */
  showLanguageNote: boolean;
  /** `id` del título del bloque, que recibe el foco al llegar desde una acción de agenda. */
  titleId: string;
};

/**
 * idle: nada de Calendly en la página. loading: pedido, sin señales aún.
 * ready: Calendly respondió. failed: no respondió a tiempo o su script no cargó.
 * scheduled: Calendly avisó de que la reserva se completó.
 */
type State = "idle" | "loading" | "ready" | "failed" | "scheduled";

/** Calendly da su primera señal entre 8 y 10 s después de pedirlo, en condiciones normales. */
const WAIT_MS = 20_000;

const noSubscription = () => () => {};

/** Avisos para el resto de la página (la analítica de L7). No llevan ningún dato. */
const announce = (name: "opened" | "scheduled") => document.dispatchEvent(new CustomEvent(`confia:agenda-${name}`));

/**
 * El calendario de reservas, dentro del bloque «Agenda» (ADR-0015). Se carga solo cuando el
 * visitante lo pide: con el botón del bloque o con cualquier acción de agenda de la página
 * (`a[data-agenda]`), que sin este componente son enlaces directos a Calendly.
 */
export function AgendaPanel({ labels, calendarUrl, showLanguageNote, titleId }: AgendaPanelProps) {
  const [state, setState] = useState<State>("idle");
  // ¿Hay un marco de Calendly en el hueco? Sin él no se reserva su altura.
  const [hasFrame, setHasFrame] = useState(false);
  // Cada petición de traer el bloque a la vista; se atiende tras pintar su nuevo tamaño.
  const [reveal, setReveal] = useState(0);
  const current = useRef<State>("idle");
  const slot = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const frameTitle = useRef(labels.frameTitle);
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

  const move = useCallback((next: State) => {
    current.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    frameTitle.current = labels.frameTitle;
  }, [labels.frameTitle]);

  /** El foco va al título del bloque: los controles que se pulsan desaparecen al cambiar de estado. */
  const focusTitle = useCallback(() => document.getElementById(titleId)?.focus({ preventScroll: true }), [titleId]);

  /** Pide el calendario. Devuelve false si la dirección no es de Calendly. */
  const start = useCallback(() => {
    const url = embedUrl(calendarUrl);
    const target = slot.current;
    if (!url || !target) {
      move("failed");
      return false;
    }

    move("loading");
    target.replaceChildren();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (current.current === "loading") move("failed");
    }, WAIT_MS);

    loadCalendly()
      .then((api) => {
        // Entre tanto pudo desmontarse el bloque, o un reintento ya montó el suyo.
        if (slot.current !== target || target.childElementCount > 0 || current.current !== "loading") return;
        api.initInlineWidget({ url, parentElement: target });
      })
      .catch(() => {
        window.clearTimeout(timer.current);
        if (current.current === "loading") move("failed");
      });
    return true;
  }, [calendarUrl, move]);

  /** Abre el calendario si aún no se pidió. */
  const open = useCallback(() => {
    focusTitle();
    if (current.current !== "idle") return;
    if (start()) announce("opened");
  }, [focusTitle, start]);

  const retry = useCallback(() => {
    focusTitle();
    start();
  }, [focusTitle, start]);

  // Con el bloque activo, las acciones de agenda ya no abren otra pestaña: se señala en la
  // página para retirar ese aviso de los enlaces (globals.css).
  useEffect(() => {
    document.documentElement.setAttribute("data-agenda-inline", "");
    return () => document.documentElement.removeAttribute("data-agenda-inline");
  }, []);

  // Las acciones de agenda de toda la página: en vez de salir a Calendly, traen aquí.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element) || !event.target.closest("a[data-agenda]")) return;
      event.preventDefault();
      open();
      setReveal((count) => count + 1);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  // Se desplaza después de pintar: el bloque ya tiene la altura del calendario y cabe en la vista.
  // Que el desplazamiento sea suave o no lo decide la hoja de estilos (movimiento reducido).
  useEffect(() => {
    if (reveal > 0) document.getElementById(titleId)?.scrollIntoView?.({ block: "start" });
  }, [reveal, titleId]);

  // Lo que el calendario comunica: que está vivo y que la reserva se completó.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const signal = calendlySignal(event.origin, event.data);
      const now = current.current;
      if (!signal || now === "idle" || now === "scheduled") return;
      // Además del origen, el emisor ha de ser el marco de este bloque.
      const frames = [...(slot.current?.querySelectorAll("iframe") ?? [])];
      if (!frames.some((frame) => frame.contentWindow === event.source)) return;
      window.clearTimeout(timer.current);
      if (signal === "scheduled") {
        announce("scheduled");
        move("scheduled");
      } else if (now !== "ready") move("ready");
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer.current);
    };
  }, [move]);

  // Calendly pone al marco un título propio, en su idioma: se sustituye por el nuestro.
  useEffect(() => {
    const target = slot.current;
    if (!target || typeof MutationObserver === "undefined") return;
    const retitle = () => {
      const frames = target.querySelectorAll("iframe");
      for (const frame of frames) {
        if (frame.title !== frameTitle.current) frame.title = frameTitle.current;
      }
      setHasFrame(frames.length > 0);
    };
    const observer = new MutationObserver(retitle);
    observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ["title"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (state === "scheduled") status.current?.focus();
  }, [state]);

  const direct = (
    <TextLink href={calendarUrl} external externalLabel={labels.newTab}>
      {labels.openDirect}
    </TextLink>
  );

  return (
    <div data-agenda-panel data-state={state} data-hydrated={hydrated ? "" : undefined} className="mt-6">
      {state === "idle" ? (
        <>
          <p data-agenda-inline className="text-[0.95rem] text-text-muted">
            {labels.provider}
          </p>
          {showLanguageNote ? <p className="mt-1 text-[0.95rem] text-text-muted">{labels.languageNote}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button data-agenda-open onClick={open}>
              {labels.open}
            </Button>
            {direct}
          </div>
        </>
      ) : null}

      {/* La región existe desde el principio: así se anuncia lo que llega después. */}
      <div
        ref={status}
        role="status"
        tabIndex={-1}
        className={cx("focus-visible:outline-none", state === "scheduled" && "rounded-(--radius-s) border-2 border-success bg-surface px-5 py-4")}
      >
        {state === "loading" ? <p className="text-text-muted">{labels.loading}</p> : null}
        {state === "scheduled" ? (
          <>
            <p className="font-semibold text-success">{labels.confirmedTitle}</p>
            <p className="mt-2">{labels.confirmedIntro}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {labels.confirmedSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {state === "failed" ? (
        <Notice tone="error">
          <span>
            {labels.unavailable} {direct} · <TextLink href="#consulta">{labels.useForm}</TextLink>
            <span className="mt-3 block">
              <Button variant="secondary" size="sm" onClick={retry}>
                {labels.retry}
              </Button>
            </span>
          </span>
        </Notice>
      ) : null}

      {/* Aquí monta Calendly su marco. La altura se reserva para que su llegada no mueva la página. */}
      <div
        ref={slot}
        data-agenda-slot
        hidden={state === "idle" || (state === "failed" && !hasFrame)}
        className="mt-4 h-[clamp(34rem,82vh,44rem)] min-w-0 overflow-hidden rounded-(--radius-s) [&_iframe]:size-full"
      />
    </div>
  );
}
