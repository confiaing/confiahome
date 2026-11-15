import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AgendaPanel } from "@/components/scheduling/agenda-panel";
import type { CalendlyApi } from "@/components/scheduling/calendly-loader";
import { getDictionary } from "@/i18n/dictionaries";
import { CALENDLY_ORIGIN } from "@/lib/calendly";

const loadCalendly = vi.hoisted(() => vi.fn<() => Promise<CalendlyApi>>());
vi.mock("@/components/scheduling/calendly-loader", () => ({ loadCalendly }));

const URL = "https://calendly.com/confiaing/30min";
const init = vi.fn<CalendlyApi["initInlineWidget"]>();
/** Como el script real: crea un marco dentro del elemento, con el título que le pone Calendly. */
const api: CalendlyApi = {
  initInlineWidget(options) {
    init(options);
    const frame = document.createElement("iframe");
    frame.title = "Select a Date & Time - Calendly";
    options.parentElement.append(frame);
  },
};

/** Un mensaje como los del marco de Calendly: con su origen y con el marco del bloque como emisor. */
const message = (event: string, origin = CALENDLY_ORIGIN, source: Window | null | undefined = undefined) =>
  act(() => {
    const emitter = source === undefined ? (document.querySelector<HTMLIFrameElement>("[data-agenda-slot] iframe")?.contentWindow ?? null) : source;
    window.dispatchEvent(new MessageEvent("message", { origin, source: emitter, data: { event, payload: {} } }));
  });

function setup(options: { locale?: "es" | "en"; note?: boolean; url?: string } = {}) {
  const t = getDictionary(options.locale ?? "es").agenda;
  const user = vi.isFakeTimers() ? userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }) : userEvent.setup();
  const view = render(
    <>
      <a href={URL} target="_blank" rel="noreferrer" data-agenda="">
        Acción de la cabecera
      </a>
      <div id="agenda">
        <h3 id="agenda-title" tabIndex={-1}>
          Agenda
        </h3>
        <AgendaPanel labels={t} calendarUrl={options.url ?? URL} showLanguageNote={options.note ?? false} titleId="agenda-title" />
      </div>
    </>,
  );
  const panel = view.container.querySelector<HTMLElement>("[data-agenda-panel]")!;
  const openButton = () => within(panel).getByRole("button", { name: t.open });
  const frame = () => panel.querySelector("iframe");
  return { t, user, view, panel, openButton, frame };
}

beforeEach(() => {
  loadCalendly.mockReset().mockResolvedValue(api);
  init.mockReset();
});
afterEach(() => vi.useRealTimers());

// scheduling · El calendario se carga solo a petición; Aviso del tercero
describe.each(["es", "en"] as const)("bloque de agenda en %s", (locale) => {
  it("en reposo no pide nada, nombra a Calendly y ofrece el botón y el enlace directo", () => {
    const { t, panel, openButton, frame } = setup({ locale });
    expect(loadCalendly).not.toHaveBeenCalled();
    expect(frame()).toBeNull();
    expect(within(panel).getByText(t.provider)).toHaveTextContent("Calendly");
    expect(openButton()).toBeEnabled();
    const direct = within(panel).getByRole("link", { name: new RegExp(t.openDirect) });
    expect(direct).toHaveAttribute("href", URL);
    expect(direct).toHaveAttribute("target", "_blank");
    expect(direct).toHaveAccessibleName(new RegExp(t.newTab));
    // El enlace directo del bloque no se intercepta: es la salida si lo de dentro falla.
    expect(direct).not.toHaveAttribute("data-agenda");
  });

  it("el botón carga el calendario en el bloque, lo anuncia y titula el marco", async () => {
    const { t, user, panel, openButton, frame } = setup({ locale });
    await user.click(openButton());
    // El botón desaparece al pulsarlo: el foco pasa al título para no perderse.
    expect(document.getElementById("agenda-title")).toHaveFocus();
    expect(within(panel).getByRole("status")).toHaveTextContent(t.loading);
    await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
    expect(init.mock.calls[0]![0].url).toBe(URL);
    expect(panel.contains(init.mock.calls[0]![0].parentElement)).toBe(true);
    await waitFor(() => expect(frame()).toHaveAttribute("title", t.frameTitle));
    expect(within(panel).queryByRole("button", { name: t.open })).toBeNull();
    await message("calendly.page_height");
    expect(within(panel).getByRole("status")).toBeEmptyDOMElement();
  });

  it("la reserva completada muestra la confirmación con los próximos pasos, con foco", async () => {
    const { t, user, panel, openButton } = setup({ locale });
    await user.click(openButton());
    await waitFor(() => expect(init).toHaveBeenCalled());
    await message("calendly.event_type_viewed");
    await message("calendly.event_scheduled");
    const status = within(panel).getByRole("status");
    expect(status).toHaveTextContent(t.confirmedTitle);
    expect(status).toHaveTextContent(t.confirmedIntro);
    expect(within(status).getAllByRole("listitem").map((item) => item.textContent)).toEqual(t.confirmedSteps);
    expect(status).toHaveFocus();
  });
});

// scheduling · Idioma del calendario
describe("aviso de idioma", () => {
  it("se muestra cuando el calendario no está en el idioma activo", () => {
    const { t, panel } = setup({ note: true });
    expect(within(panel).getByText(t.languageNote)).toBeInTheDocument();
  });

  it("no se muestra cuando coincide", () => {
    const { t, panel } = setup({ note: false });
    expect(within(panel).queryByText(t.languageNote)).toBeNull();
  });

  it("una dirección que no es de Calendly no carga nada y muestra la alternativa", async () => {
    const { t, user, openButton } = setup({ url: "https://evil.example/confiaing" });
    await user.click(openButton());
    expect(loadCalendly).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(t.unavailable);
  });
});

// scheduling · El calendario se carga solo a petición; Accesibilidad del bloque
describe("acciones de agenda de la página", () => {
  const action = () => screen.getByRole("link", { name: "Acción de la cabecera" });

  it("un clic normal no navega: lleva el foco al título del bloque y carga el calendario", async () => {
    setup();
    const allowed = fireEvent.click(action());
    expect(allowed).toBe(false);
    expect(document.getElementById("agenda-title")).toHaveFocus();
    await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])("con %j el navegador abre el enlace y no se carga nada", (modifier) => {
    setup();
    const allowed = fireEvent.click(action(), modifier);
    expect(allowed).toBe(true);
    expect(loadCalendly).not.toHaveBeenCalled();
  });

  it("se carga una sola vez aunque se pulse varias", async () => {
    const { frame } = setup();
    fireEvent.click(action());
    await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
    fireEvent.click(action());
    fireEvent.click(action());
    await act(async () => {});
    expect(loadCalendly).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(frame()).not.toBeNull();
    expect(document.getElementById("agenda-title")).toHaveFocus();
  });

  it("al desmontar deja de interceptar", () => {
    const { view } = setup();
    const link = document.createElement("a");
    link.href = URL;
    link.dataset.agenda = "";
    document.body.append(link);
    expect(fireEvent.click(link)).toBe(false);
    view.unmount();
    expect(fireEvent.click(link)).toBe(true);
    link.remove();
  });
});

// scheduling · Alternativa si el calendario no carga
describe("alternativa", () => {
  const expectAlternative = (t: ReturnType<typeof setup>["t"]) => {
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(t.unavailable);
    expect(within(alert).getByRole("link", { name: new RegExp(t.openDirect) })).toHaveAttribute("href", URL);
    expect(within(alert).getByRole("link", { name: t.useForm })).toHaveAttribute("href", "#consulta");
    return alert;
  };

  it("si el script no carga, aparece sin esperar al plazo y sin dejar un hueco vacío", async () => {
    loadCalendly.mockRejectedValue(new Error("bloqueado"));
    const { t, user, openButton, panel } = setup();
    await user.click(openButton());
    await waitFor(() => expectAlternative(t));
    expect(panel.querySelector("[data-agenda-slot]")).not.toBeVisible();
  });

  it("vencido el plazo con el marco ya creado, reintentar lo sustituye: un solo marco", async () => {
    vi.useFakeTimers();
    const { t, openButton, panel } = setup();
    fireEvent.click(openButton());
    await act(() => vi.advanceTimersByTimeAsync(21_000));
    expect(panel.querySelectorAll("iframe")).toHaveLength(1);
    expect(panel.querySelector("[data-agenda-slot]")).toBeVisible();
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: t.retry }));
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(init).toHaveBeenCalledTimes(2);
    expect(panel.querySelectorAll("iframe")).toHaveLength(1);
    expect(document.getElementById("agenda-title")).toHaveFocus();
  });

  it("si Calendly no da señales en el plazo, aparece; antes, no", async () => {
    vi.useFakeTimers();
    const { t, openButton } = setup();
    fireEvent.click(openButton());
    await act(() => vi.advanceTimersByTimeAsync(19_000));
    expect(screen.queryByRole("alert")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1_500));
    expectAlternative(t);
  });

  it("una señal de Calendly dentro del plazo lo cancela", async () => {
    vi.useFakeTimers();
    const { openButton } = setup();
    fireEvent.click(openButton());
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    await message("calendly.page_height");
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("si el calendario llega tarde, se retira el aviso", async () => {
    vi.useFakeTimers();
    const { openButton, frame } = setup();
    fireEvent.click(openButton());
    await act(() => vi.advanceTimersByTimeAsync(21_000));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await message("calendly.event_type_viewed");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(frame()).not.toBeNull();
  });

  it("reintentar vuelve a pedir el calendario, sin duplicar el marco", async () => {
    loadCalendly.mockRejectedValueOnce(new Error("bloqueado"));
    const { t, user, openButton, panel } = setup();
    await user.click(openButton());
    const alert = await screen.findByRole("alert");
    await user.click(within(alert).getByRole("button", { name: t.retry }));
    await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
    expect(loadCalendly).toHaveBeenCalledTimes(2);
    expect(document.getElementById("agenda-title")).toHaveFocus();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(panel.querySelectorAll("iframe")).toHaveLength(1);
  });
});

// scheduling · Confirmación con próximos pasos
describe("confirmación", () => {
  it.each(["https://evil.example", "https://calendly.com.evil.example", "http://localhost"])("un aviso de reserva desde %s se ignora", async (origin) => {
    const { t, user, openButton, panel } = setup();
    await user.click(openButton());
    await waitFor(() => expect(init).toHaveBeenCalled());
    await message("calendly.event_scheduled", origin);
    expect(within(panel).queryByText(t.confirmedTitle)).toBeNull();
  });

  it("un aviso con el origen de Calendly pero que no sale del marco del bloque se ignora", async () => {
    const { t, user, openButton, panel } = setup();
    await user.click(openButton());
    await waitFor(() => expect(init).toHaveBeenCalled());
    await message("calendly.event_scheduled", CALENDLY_ORIGIN, null);
    await message("calendly.event_scheduled", CALENDLY_ORIGIN, window);
    expect(within(panel).queryByText(t.confirmedTitle)).toBeNull();
  });

  it("una dirección no válida no cuenta como apertura", async () => {
    const opened = vi.fn();
    document.addEventListener("confia:agenda-opened", opened);
    const { user, openButton } = setup({ url: "https://evil.example/x" });
    await user.click(openButton());
    document.removeEventListener("confia:agenda-opened", opened);
    expect(opened).not.toHaveBeenCalled();
  });

  it("sin haber abierto el calendario, un aviso de reserva no muestra nada", async () => {
    const { t, panel } = setup();
    await message("calendly.event_scheduled");
    expect(within(panel).queryByText(t.confirmedTitle)).toBeNull();
  });

  it("avisa a la página una vez de la apertura y una de la reserva, sin datos", async () => {
    const seen: { type: string; detail: unknown }[] = [];
    const record = (event: Event) => seen.push({ type: event.type, detail: (event as CustomEvent).detail });
    document.addEventListener("confia:agenda-opened", record);
    document.addEventListener("confia:agenda-scheduled", record);
    const { user, openButton } = setup();
    await user.click(openButton());
    await waitFor(() => expect(init).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("link", { name: "Acción de la cabecera" }));
    await message("calendly.event_scheduled");
    await message("calendly.event_scheduled");
    document.removeEventListener("confia:agenda-opened", record);
    document.removeEventListener("confia:agenda-scheduled", record);
    expect(seen).toEqual([
      { type: "confia:agenda-opened", detail: null },
      { type: "confia:agenda-scheduled", detail: null },
    ]);
  });
});

// scheduling · Accesibilidad del bloque
describe("accesibilidad", () => {
  it("sin infracciones en reposo, cargando, no disponible y con reserva", async () => {
    const { user, view, openButton, frame } = setup({ note: true });
    expect(await axe(view.container)).toHaveNoViolations();
    await user.click(openButton());
    await waitFor(() => expect(init).toHaveBeenCalled());
    await message("calendly.event_scheduled");
    // axe no sabe analizar marcos en jsdom: se retira el de mentira antes de medir lo nuestro.
    frame()!.remove();
    expect(await axe(view.container)).toHaveNoViolations();
  });

  it("sin infracciones con la alternativa a la vista", async () => {
    loadCalendly.mockRejectedValue(new Error("bloqueado"));
    const { user, view, openButton } = setup();
    await user.click(openButton());
    await screen.findByRole("alert");
    expect(await axe(view.container)).toHaveNoViolations();
  });
});
