"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { setSceneState } from "@/components/journey/scene/scene-store";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

type JourneyTabsProps = {
  journey: Dictionary["home"]["journey"];
  /** La ranura de la escena, renderizada en el servidor. Va dentro para seguir a la etapa por CSS. */
  scene?: ReactNode;
};

const panelId = (index: number) => `etapa-${index + 1}`;
const tabId = (index: number) => `tab-etapa-${index + 1}`;

const noSubscription = () => () => {};

function onHashChange(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

// Desde este ancho (lg) las pestañas van en columna junto a la escena.
const VERTICAL_QUERY = "(min-width: 64rem)";
function onLayoutChange(listener: () => void) {
  const query = window.matchMedia?.(VERTICAL_QUERY);
  query?.addEventListener("change", listener);
  return () => query?.removeEventListener("change", listener);
}
const isVertical = () => window.matchMedia?.(VERTICAL_QUERY).matches ?? false;

/** Etapa que pide el ancla de la dirección (#etapa-3 → 2), o null. */
function stageFromHash(count: number): number | null {
  const match = /^#etapa-(\d)$/.exec(window.location.hash);
  const index = match ? Number(match[1]) - 1 : -1;
  return index >= 0 && index < count ? index : null;
}

/**
 * Las cinco etapas como pestañas (ADR-0013). Cada pestaña es un enlace al ancla de su
 * panel: sin JavaScript se ven los cinco paneles; antes de hidratar, o si el script
 * falla, el CSS muestra el panel señalado por la dirección (globals.css). Una vez
 * hidratado, este componente lleva la selección, el foco y el teclado.
 */
export function JourneyTabs({ journey, scene }: JourneyTabsProps) {
  const { stages, labels } = journey;
  const tabs = useRef<(HTMLAnchorElement | null)[]>([]);

  // En el servidor y en el primer pintado del navegador el estado es el mismo: etapa 1,
  // sin marcar como listo. Tras hidratar se lee el ancla.
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const fromHash = useSyncExternalStore(onHashChange, () => stageFromHash(stages.length), () => null);
  const vertical = useSyncExternalStore(onLayoutChange, isVertical, () => false);
  const [chosen, setChosen] = useState<number | null>(null);
  const selected = chosen ?? fromHash ?? 0;

  // Si la dirección cambia (Atrás, o un enlace a #etapa-n), manda la dirección.
  useEffect(() => onHashChange(() => setChosen(null)), []);

  useEffect(() => {
    setSceneState({ stage: selected + 1 });
  }, [selected]);

  const select = (index: number, focus: boolean) => {
    setChosen(index);
    // El ancla refleja la etapa (se puede compartir) sin desplazar la página ni llenar el historial.
    window.history.replaceState(window.history.state, "", `#${panelId(index)}`);
    const tab = tabs.current[index];
    // Nada de esto debe mover la página: ni el foco ni traer la pestaña a la vista.
    if (focus) tab?.focus({ preventScroll: true });
    const list = tab?.parentElement;
    if (tab && list && list.scrollWidth > list.clientWidth) {
      list.scrollTo?.({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2 });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.current.indexOf(event.target as HTMLAnchorElement);
    if (current === -1) return;
    const last = stages.length - 1;
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowDown: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      ArrowUp: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
      " ": current,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  };

  const onClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    select(index, false);
  };

  return (
    <div
      data-journey
      data-ready={ready ? "" : undefined}
      data-selected={selected + 1}
      className="lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:gap-[clamp(32px,4vw,64px)]"
    >
      {scene ? (
        // Tarjeta índigo de la escena: se queda a la vista mientras se leen las etapas.
        <div className="theme-dark sticky top-(--header-h) z-5 -mx-(--gutter) h-[clamp(230px,37svh,380px)] border-b border-border lg:top-[calc(var(--header-h)+24px)] lg:mx-0 lg:h-[min(calc(100svh-var(--header-h)-48px),700px)] lg:overflow-hidden lg:rounded-[calc(var(--radius)+6px)] lg:border">
          {scene}
        </div>
      ) : null}
      <div className="pt-5.5 lg:pt-0">
      <div
        role="tablist"
        aria-label={journey.tabsLabel}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        onKeyDown={onKeyDown}
        className="relative -mx-(--gutter) flex snap-x gap-2 overflow-x-auto px-(--gutter) pt-1.5 pb-3 [scrollbar-width:none] lg:m-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:p-0"
      >
        {stages.map((stage, index) => {
          const isSelected = index === selected;
          return (
            <a
              key={stage.name}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              id={tabId(index)}
              role="tab"
              href={`#${panelId(index)}`}
              aria-selected={isSelected}
              aria-controls={panelId(index)}
              // El foco itinerante solo vale con el componente en marcha. Antes —o si el
              // script no llega a ejecutarse— cada pestaña es un enlace que se alcanza con Tab.
              tabIndex={ready ? (isSelected ? 0 : -1) : undefined}
              onClick={(event) => onClick(event, index)}
              className={cx(
                "group flex min-h-13 flex-none snap-center items-center gap-3 rounded-full border-[1.5px] py-2.5 pr-4.5 pl-3 text-left no-underline transition-colors duration-200",
                "lg:rounded-[14px] lg:py-3",
                isSelected
                  ? "border-primary bg-surface text-text"
                  : "border-border text-text-muted hover:border-border-strong hover:text-text lg:border-transparent lg:hover:border-border",
              )}
            >
              <span
                className={cx(
                  "grid size-8 flex-none place-items-center rounded-full border-[1.5px] font-mono text-[0.8125rem]",
                  isSelected ? "border-primary bg-primary text-on-primary" : "border-current",
                )}
              >
                0{index + 1}
              </span>
              <span className="text-[0.98rem] leading-[1.15] font-semibold">{stage.name}</span>
            </a>
          );
        })}
      </div>

      {stages.map((stage, index) => (
        <div
          key={stage.name}
          id={panelId(index)}
          role="tabpanel"
          aria-labelledby={tabId(index)}
          tabIndex={0}
          // Antes de hidratar, el CSS muestra este panel si la dirección no señala otro.
          data-first={index === 0 ? "" : undefined}
          data-active={index === selected ? "" : undefined}
          className="mt-3.5 scroll-mt-6 rounded-(--radius) border border-border bg-surface p-[clamp(22px,3vw,34px)] lg:mt-4.5"
        >
          <article>
            <h3 className="font-display text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.08] font-medium tracking-[-0.018em]">
              {stage.name}
            </h3>
            <p className="mt-2 font-mono text-[0.8125rem] tracking-[0.08em] text-emphasis uppercase">{stage.tag}</p>
            <dl className="mt-5">
              {(
                [
                  [labels.does, stage.does],
                  [labels.gets, stage.gets],
                  [labels.next, stage.next],
                ] as const
              ).map(([term, definition], part) => (
                <div key={term} className="border-t border-border py-4">
                  <dt className="mb-1.5 font-mono text-[0.8125rem] tracking-[0.08em] text-text-muted uppercase">{term}</dt>
                  <dd
                    className={
                      part === 2 ? "font-display text-[1.3rem] leading-tight text-emphasis italic" : "text-[1.04rem]"
                    }
                  >
                    {definition}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      ))}
      </div>
    </div>
  );
}
