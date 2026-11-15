import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { forgetVisit, track } from "@/components/analytics/track";

const pathname = vi.hoisted(() => ({ value: "/en" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

type Sent = Record<string, unknown>;
const beacon = vi.fn<(url: string, data: Blob) => boolean>();
const fetchMock = vi.fn<typeof fetch>();

const read = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
const sent = async (): Promise<Sent[]> => Promise.all(beacon.mock.calls.map(async ([, blob]) => JSON.parse(await read(blob)) as Sent));
const names = async () => (await sent()).map((event) => event.name);

function visit(options: { url?: string; width?: number; lang?: string; referrer?: string } = {}) {
  window.history.replaceState(null, "", options.url ?? "/en");
  pathname.value = window.location.pathname;
  document.documentElement.lang = options.lang ?? "en";
  Object.defineProperty(window, "innerWidth", { configurable: true, value: options.width ?? 390 });
  Object.defineProperty(document, "referrer", { configurable: true, value: options.referrer ?? "" });
}

const setPrivacy = (flags: { gpc?: boolean; dnt?: string | null }) => {
  Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: flags.gpc });
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: flags.dnt ?? null });
};

beforeEach(() => {
  beacon.mockReset().mockReturnValue(true);
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
  vi.stubGlobal("fetch", fetchMock);
  setPrivacy({});
  forgetVisit();
  visit();
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

// analytics-instrumentation · Contexto de cada evento; La medición no afecta a la página
describe("track", () => {
  it("envía a /api/events, como JSON, el nombre y el contexto de la visita", async () => {
    visit({ url: "/en?utm_source=linkedin&utm_medium=social&utm_campaign=q4&email=ana@empresa.com", width: 390, referrer: "https://www.google.com/search?q=x" });
    track("cta_contact_click");
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]![0]).toBe("/api/events");
    expect(beacon.mock.calls[0]![1].type).toBe("application/json");
    expect(await sent()).toEqual([
      { name: "cta_contact_click", locale: "en", device: "mobile", path: "/en", referrerHost: "www.google.com", utmSource: "linkedin", utmMedium: "social", utmCampaign: "q4" },
    ]);
  });

  it.each([
    [390, "mobile"],
    [800, "tablet"],
    [1440, "desktop"],
  ])("a %i px el dispositivo es %s", async (width, device) => {
    visit({ width });
    track("page_view");
    expect((await sent())[0]!.device).toBe(device);
  });

  it("la procedencia propia no se envía, y el modo solo si se indica", async () => {
    visit({ referrer: `${window.location.origin}/es` });
    track("form_started", { formMode: "terminal" });
    const [event] = await sent();
    expect(event).not.toHaveProperty("referrerHost");
    expect(event!.formMode).toBe("terminal");
  });

  it("la campaña y la procedencia de la llegada se mantienen al pasar a otra página del sitio", async () => {
    visit({ url: "/en?utm_source=linkedin", referrer: "https://www.google.com/" });
    track("page_view");
    visit({ url: "/en/privacy", referrer: `${window.location.origin}/en?utm_source=linkedin` });
    track("page_view");
    expect((await sent()).map((event) => [event.path, event.utmSource, event.referrerHost])).toEqual([
      ["/en", "linkedin", "www.google.com"],
      ["/en/privacy", "linkedin", "www.google.com"],
    ]);
  });

  it("sin sendBeacon, o si lo rechaza, usa fetch sin esperar la respuesta", () => {
    beacon.mockReturnValue(false);
    track("page_view");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/events");
    expect(init).toMatchObject({ method: "POST", keepalive: true, headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(init!.body))).toMatchObject({ name: "page_view", locale: "en" });

    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: undefined });
    track("page_view");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("nunca lanza: ni si el envío revienta ni si la red falla", () => {
    beacon.mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => track("page_view")).not.toThrow();
    beacon.mockReturnValue(false);
    fetchMock.mockRejectedValue(new TypeError("red"));
    expect(() => track("page_view")).not.toThrow();
  });

  // analytics-instrumentation · Respeto de la preferencia de no rastreo
  it.each([{ gpc: true }, { dnt: "1" }])("con %j no envía nada", (flags) => {
    setPrivacy(flags);
    track("page_view");
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{ gpc: false }, { dnt: "0" }, { dnt: "unspecified" }])("con %j sí envía", (flags) => {
    setPrivacy(flags);
    track("page_view");
    expect(beacon).toHaveBeenCalledTimes(1);
  });

  it("no guarda nada en el navegador", () => {
    const before = [document.cookie, window.localStorage.length, window.sessionStorage.length];
    track("page_view");
    expect([document.cookie, window.localStorage.length, window.sessionStorage.length]).toEqual(before);
  });
});

// analytics-instrumentation · Qué se mide y cuándo
describe("AnalyticsTracker", () => {
  const link = (attributes: Record<string, string>) => {
    const anchor = document.createElement("a");
    anchor.href = "#x";
    for (const [name, value] of Object.entries(attributes)) anchor.setAttribute(name, value);
    anchor.innerHTML = "<span>texto</span>";
    document.body.append(anchor);
    return anchor.firstElementChild!;
  };

  it("no pinta nada y envía una sola vista de página por carga", async () => {
    const view = render(<AnalyticsTracker />);
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(<AnalyticsTracker />);
    expect(await names()).toEqual(["page_view"]);
  });

  it("al cambiar de página dentro del sitio envía otra vista", async () => {
    const view = render(<AnalyticsTracker />);
    visit({ url: "/en/privacy" });
    view.rerender(<AnalyticsTracker />);
    expect((await sent()).map((event) => [event.name, event.path])).toEqual([
      ["page_view", "/en"],
      ["page_view", "/en/privacy"],
    ]);
  });

  it("cada acción envía su evento, también al pulsar un elemento de dentro del enlace", async () => {
    render(<AnalyticsTracker />);
    fireEvent.click(link({ "data-agenda": "" }));
    fireEvent.click(link({ "data-cta": "contact" }));
    fireEvent.click(link({ "data-locale-switch": "" }));
    fireEvent.click(link({ "data-cta": "contact" }));
    expect(await names()).toEqual(["page_view", "cta_schedule_click", "cta_contact_click", "language_switched", "cta_contact_click"]);
  });

  it("un enlace cualquiera no envía nada", async () => {
    render(<AnalyticsTracker />);
    fireEvent.click(link({ href: "/es/privacidad" }));
    expect(await names()).toEqual(["page_view"]);
  });

  it("la agenda y el formulario avisan y se envían sus eventos, con el modo del formulario", async () => {
    render(<AnalyticsTracker />);
    act(() => {
      document.dispatchEvent(new CustomEvent("confia:agenda-opened"));
      document.dispatchEvent(new CustomEvent("confia:agenda-scheduled"));
      document.dispatchEvent(new CustomEvent("confia:form-started", { detail: { mode: "terminal" } }));
      document.dispatchEvent(new CustomEvent("confia:form-submitted", { detail: { mode: "classic", name: "Ana", email: "ana@empresa.com" } }));
    });
    const events = await sent();
    expect(events.map((event) => [event.name, event.formMode])).toEqual([
      ["page_view", undefined],
      ["calendar_opened", undefined],
      ["meeting_scheduled", undefined],
      ["form_started", "terminal"],
      ["form_submitted", "classic"],
    ]);
    expect(JSON.stringify(events)).not.toMatch(/Ana|ana@/);
  });

  it("al desmontar deja de escuchar", async () => {
    const view = render(<AnalyticsTracker />);
    view.unmount();
    fireEvent.click(link({ "data-agenda": "" }));
    document.dispatchEvent(new CustomEvent("confia:agenda-opened"));
    expect(await names()).toEqual(["page_view"]);
  });
});
