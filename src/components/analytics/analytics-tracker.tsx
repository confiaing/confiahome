"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/components/analytics/track";

const formMode = (event: Event): "terminal" | "classic" | undefined => {
  const mode = (event as CustomEvent<{ mode?: unknown } | null>).detail?.mode;
  return mode === "terminal" || mode === "classic" ? mode : undefined;
};

/**
 * Mide lo que ocurre en la página sin que nadie más tenga que saberlo: escucha los clics
 * en las acciones marcadas y los avisos que emiten la agenda y el formulario, y envía un
 * evento anónimo por cada uno. No pinta nada. Quitarlo deja la página exactamente igual.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const seen = useRef<string | null>(null);

  // Una vista por página cargada. La referencia evita repetirla si el efecto se relanza.
  useEffect(() => {
    if (seen.current === pathname) return;
    seen.current = pathname;
    track("page_view");
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link) return;
      if (link.hasAttribute("data-agenda")) track("cta_schedule_click");
      else if (link.dataset.cta === "contact") track("cta_contact_click");
      else if (link.hasAttribute("data-locale-switch")) track("language_switched");
    };
    const onOpened = () => track("calendar_opened");
    const onScheduled = () => track("meeting_scheduled");
    const onStarted = (event: Event) => track("form_started", { formMode: formMode(event) });
    const onSubmitted = (event: Event) => track("form_submitted", { formMode: formMode(event) });

    // En captura: se cuenta el clic aunque otro componente lo intercepte después.
    document.addEventListener("click", onClick, true);
    document.addEventListener("confia:agenda-opened", onOpened);
    document.addEventListener("confia:agenda-scheduled", onScheduled);
    document.addEventListener("confia:form-started", onStarted);
    document.addEventListener("confia:form-submitted", onSubmitted);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("confia:agenda-opened", onOpened);
      document.removeEventListener("confia:agenda-scheduled", onScheduled);
      document.removeEventListener("confia:form-started", onStarted);
      document.removeEventListener("confia:form-submitted", onSubmitted);
    };
  }, []);

  return null;
}
