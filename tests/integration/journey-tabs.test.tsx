import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { JourneyTabs } from "@/components/journey/journey-tabs";
import { getSceneState, resetSceneStore } from "@/components/journey/scene/scene-store";
import { getDictionary } from "@/i18n/dictionaries";

const LOCALES = ["es", "en"] as const;

function setup(locale: "es" | "en" = "es") {
  const journey = getDictionary(locale).home.journey;
  const user = userEvent.setup();
  const view = render(<JourneyTabs journey={journey} />);
  const tabs = screen.getAllByRole("tab");
  const panels = [...view.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const selected = () => tabs.map((tab) => tab.getAttribute("aria-selected") === "true");
  const active = () => panels.map((panel) => panel.hasAttribute("data-active"));
  const only = (index: number) => Array.from({ length: 5 }, (_, i) => i === index);
  return { journey, user, view, tabs, panels, selected, active, only };
}

beforeEach(() => {
  resetSceneStore();
  window.history.replaceState(null, "", "/es");
});

describe.each(LOCALES)("recorrido en %s", (locale) => {
  // journey-navigation · Una etapa a la vez (L4-1)
  it("al cargar, la etapa 1 está seleccionada y solo su panel está activo", () => {
    const { journey, tabs, panels, selected, active, only } = setup(locale);
    expect(screen.getByRole("tablist", { name: journey.tabsLabel })).toBeInTheDocument();
    expect(tabs).toHaveLength(5);
    expect(panels).toHaveLength(5);
    expect(selected()).toEqual(only(0));
    expect(active()).toEqual(only(0));
  });

  it("al elegir la etapa 3 se muestra con sus tres partes", async () => {
    const { journey, user, tabs, panels, selected, active, only } = setup(locale);
    await user.click(tabs[2]!);
    expect(selected()).toEqual(only(2));
    expect(active()).toEqual(only(2));

    const stage = journey.stages[2]!;
    const panel = panels[2]!;
    expect(within(panel).getByRole("heading", { level: 3, hidden: true })).toHaveTextContent(stage.name);
    const terms = [...panel.querySelectorAll("dt")].map((term) => term.textContent);
    const definitions = [...panel.querySelectorAll("dd")].map((definition) => definition.textContent);
    expect(terms).toEqual([journey.labels.does, journey.labels.gets, journey.labels.next]);
    expect(definitions).toEqual([stage.does, stage.gets, stage.next]);
  });

  it("la etapa 1 dice 30 minutos y que no es un diagnóstico ni un compromiso", () => {
    const { journey, panels } = setup(locale);
    expect(panels[0]).toHaveTextContent(journey.stages[0]!.tag);
    expect(panels[0]).toHaveTextContent("30");
    expect(panels[0]).toHaveTextContent(/no un diagnóstico ni un compromiso|not an assessment or a commitment/);
  });

  // journey-navigation · Patrón de pestañas accesible (L4-2)
  it("cada pestaña expone su estado, su panel y un nombre con número y etapa", async () => {
    const { journey, tabs, panels, view } = setup(locale);
    tabs.forEach((tab, index) => {
      const panel = panels[index]!;
      expect(tab).toHaveAttribute("aria-selected");
      expect(tab).toHaveAttribute("aria-controls", panel.id);
      expect(tab).toHaveAttribute("href", `#${panel.id}`);
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
      expect(panel.id).toBe(`etapa-${index + 1}`);
      expect(tab).toHaveAccessibleName(new RegExp(`^0${index + 1}\\s*${journey.stages[index]!.name}$`));
    });
    expect(await axe(view.container)).toHaveNoViolations();
  });
});

describe("teclado", () => {
  it("un solo punto de tabulación: la pestaña seleccionada", () => {
    const { tabs } = setup();
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("Flecha derecha selecciona la siguiente y le da el foco", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(selected()).toEqual(only(1));
    expect(tabs[1]).toHaveFocus();
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
  });

  it("es circular en los dos sentidos", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[0]!.focus();
    await user.keyboard("{ArrowLeft}");
    expect(selected()).toEqual(only(4));
    expect(tabs[4]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(selected()).toEqual(only(0));
  });

  it("Flecha abajo y arriba equivalen a derecha e izquierda", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[0]!.focus();
    await user.keyboard("{ArrowDown}");
    expect(selected()).toEqual(only(1));
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(selected()).toEqual(only(4));
  });

  it("Fin va a la última e Inicio a la primera", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[1]!.focus();
    await user.keyboard("{End}");
    expect(selected()).toEqual(only(4));
    expect(tabs[4]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(selected()).toEqual(only(0));
    expect(tabs[0]).toHaveFocus();
  });

  it("Espacio y Enter seleccionan la pestaña enfocada sin navegar", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[3]!.focus();
    await user.keyboard(" ");
    expect(selected()).toEqual(only(3));
    tabs[1]!.focus();
    await user.keyboard("{Enter}");
    expect(selected()).toEqual(only(1));
  });

  it("otras teclas no cambian la selección", async () => {
    const { user, tabs, selected, only } = setup();
    tabs[0]!.focus();
    await user.keyboard("a{Escape}{PageDown}");
    expect(selected()).toEqual(only(0));
  });
});

describe("dirección y escena", () => {
  // journey-navigation · Las etapas no dependen de JavaScript: enlace directo
  it("con el ancla de la etapa 4 en la dirección, se muestra la etapa 4", () => {
    window.history.replaceState(null, "", "/es#etapa-4");
    const { selected, only } = setup();
    expect(selected()).toEqual(only(3));
  });

  it("si la dirección cambia después (Atrás, otro enlace), la etapa la sigue", async () => {
    const { user, tabs, selected, only } = setup();
    await user.click(tabs[1]!);
    expect(selected()).toEqual(only(1));
    act(() => {
      window.location.hash = "#etapa-5";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selected()).toEqual(only(4));
    expect(getSceneState().stage).toBe(5);
  });

  it("un ancla ajena no cambia la etapa inicial", () => {
    window.history.replaceState(null, "", "/es#consulta");
    const { selected, only } = setup();
    expect(selected()).toEqual(only(0));
  });

  // Un enlace a otra sección («Cuéntanos…», el menú, saltar al contenido) no es una orden de volver a la etapa 1.
  it("tras elegir una etapa, un ancla ajena no la cambia", async () => {
    const { user, tabs, selected, only } = setup();
    await user.click(tabs[2]!);
    act(() => {
      window.location.hash = "#consulta";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selected()).toEqual(only(2));
    expect(getSceneState().stage).toBe(3);
  });

  it("si se llegó con el ancla de una etapa, un ancla ajena posterior tampoco la cambia", () => {
    window.history.replaceState(null, "", "/es#etapa-4");
    const { selected, only } = setup();
    expect(selected()).toEqual(only(3));
    act(() => {
      window.location.hash = "#agenda";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selected()).toEqual(only(3));
  });

  it("elegir una etapa actualiza el ancla sin añadir entradas al historial", async () => {
    const { user, tabs } = setup();
    const entries = window.history.length;
    await user.click(tabs[2]!);
    expect(window.location.hash).toBe("#etapa-3");
    expect(window.history.length).toBe(entries);
  });

  it("la etapa elegida llega a la escena", async () => {
    const { user, tabs } = setup();
    expect(getSceneState().stage).toBe(1);
    await user.click(tabs[3]!);
    expect(getSceneState().stage).toBe(4);
  });

  it("la lista anuncia su orientación", () => {
    setup();
    // jsdom no tiene matchMedia: equivale a pantalla estrecha, lista horizontal.
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("elegir una etapa enfoca sin desplazar la página", async () => {
    const { user, tabs } = setup();
    const calls: (FocusOptions | undefined)[] = [];
    const original = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (options?: FocusOptions) {
      calls.push(options);
      original.call(this, options);
    };
    try {
      tabs[0]!.focus({ preventScroll: true });
      await user.keyboard("{ArrowRight}");
    } finally {
      HTMLElement.prototype.focus = original;
    }
    expect(calls.at(-1)).toEqual({ preventScroll: true });
  });

  it("al hidratar, el recorrido se marca como listo y con su etapa", async () => {
    const { user, tabs, view } = setup();
    const root = view.container.querySelector("[data-journey]")!;
    expect(root).toHaveAttribute("data-ready");
    expect(root).toHaveAttribute("data-selected", "1");
    await user.click(tabs[4]!);
    expect(root).toHaveAttribute("data-selected", "5");
  });
});
