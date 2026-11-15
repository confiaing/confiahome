import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderToString } from "react-dom/server";
import { ContactForm } from "@/components/contact/contact-form";
import { getDictionary } from "@/i18n/dictionaries";

const MODES = ["terminal", "classic"] as const;
type Mode = (typeof MODES)[number];

const fetchMock = vi.fn<typeof fetch>();
const respond = (status: number, body: unknown = {}) => Response.json(body, { status });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function setup(mode: Mode, locale: "es" | "en" = "es") {
  const t = getDictionary(locale).contact;
  const user = userEvent.setup();
  const view = render(<ContactForm labels={t} locale={locale} privacyHref={`/${locale}/privacidad`} siteKey={null} />);
  const field = (name: keyof typeof t.fields) => screen.getByLabelText(t.fields[name], { exact: false }) as HTMLInputElement;
  const consent = () => screen.getByRole("checkbox") as HTMLInputElement;
  const submit = () => screen.getByRole("button", { name: new RegExp(`${t.submit}|${t.sending}`) });
  const fill = async (values: Partial<Record<keyof typeof t.fields, string>> & { consent?: boolean }) => {
    for (const [name, value] of Object.entries(values)) {
      if (name === "consent") {
        if (value) await user.click(consent());
      } else await user.type(field(name as keyof typeof t.fields), value as string);
    }
  };
  const switchTo = async (target: Mode) => user.click(screen.getByRole("button", { name: t[target] }));
  const ready = async () => {
    if (mode === "classic") await switchTo("classic");
  };
  return { t, user, view, field, consent, submit, fill, switchTo, ready };
}

const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0]![1]!.body)) as Record<string, unknown>;

describe.each(MODES)("formulario en modo %s", (mode) => {
  // contact-form · Campos y consentimiento (L5-2)
  it.each(["es", "en"] as const)("en %s tiene los cinco campos etiquetados y la casilla sin marcar, con enlace a privacidad", async (locale) => {
    const { t, field, consent, ready } = setup(mode, locale);
    await ready();
    expect(field("name")).toHaveAttribute("autocomplete", "name");
    expect(field("company")).toHaveAttribute("autocomplete", "organization");
    expect(field("email")).toHaveAttribute("type", "email");
    expect(field("phone")).toHaveAttribute("type", "tel");
    expect(field("message").tagName).toBe("TEXTAREA");
    // La indicación «correo o teléfono» describe a ambos campos.
    expect(field("email")).toHaveAccessibleDescription(expect.stringContaining(t.contactHint));
    expect(field("phone")).toHaveAccessibleDescription(expect.stringContaining(t.contactHint));

    expect(consent()).not.toBeChecked();
    expect(screen.getByRole("link", { name: t.consentLink })).toHaveAttribute("href", `/${locale}/privacidad`);
    expect(screen.getByRole("form", { name: mode === "terminal" ? t.terminalFormLabel : t.classicFormLabel })).toHaveAttribute("novalidate");
  });

  // contact-form · Errores accesibles (L5-3)
  it("con dos campos inválidos: cada error junto a su campo, foco al primero, valores conservados y sin petición", async () => {
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ company: "Acme", email: "ana@", message: "Conciliar facturas" });
    await user.click(submit());

    expect(field("name")).toHaveAttribute("aria-invalid", "true");
    expect(field("name")).toHaveAccessibleDescription(expect.stringContaining(t.errors.required));
    expect(field("email")).toHaveAttribute("aria-invalid", "true");
    expect(field("email")).toHaveAccessibleDescription(expect.stringContaining(t.errors.emailFormat));
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(expect.stringContaining(t.errors.consentRequired));
    expect(field("company")).not.toHaveAttribute("aria-invalid");

    expect(field("name")).toHaveFocus();
    expect(field("company")).toHaveValue("Acme");
    expect(field("email")).toHaveValue("ana@");
    expect(field("message")).toHaveValue("Conciliar facturas");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin correo ni teléfono: el error va en el correo y describe también al teléfono", async () => {
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", consent: true });
    await user.click(submit());
    expect(field("email")).toHaveAccessibleDescription(expect.stringContaining(t.errors.contactRequired));
    expect(field("phone")).toHaveAccessibleDescription(expect.stringContaining(t.errors.contactRequired));
    expect(field("email")).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("al corregir un campo, su error desaparece", async () => {
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ email: "ana@empresa.com", consent: true });
    await user.click(submit());
    expect(screen.getByText(t.errors.required)).toBeInTheDocument();
    await user.type(field("name"), "Ana");
    expect(screen.queryByText(t.errors.required)).not.toBeInTheDocument();
    expect(field("name")).not.toHaveAttribute("aria-invalid");
  });

  it("escribir un teléfono quita el error de «correo o teléfono»", async () => {
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", consent: true });
    await user.click(submit());
    await user.type(field("phone"), "3");
    expect(screen.queryByText(t.errors.contactRequired)).not.toBeInTheDocument();
  });

  // contact-form · Envío y confirmación (L5-4)
  it("envío aceptado: manda los datos esperados y muestra la confirmación en role=status, con el foco", async () => {
    fetchMock.mockResolvedValue(respond(201, { status: "accepted" }));
    const { t, user, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana Ruiz", company: "Acme", email: "ana@empresa.com", message: "Conciliar facturas", consent: true });
    await user.click(submit());

    const status = await screen.findByRole("status");
    await waitFor(() => expect(status).toHaveTextContent(t.success));
    expect(t.success).not.toMatch(/\d|hora|día|hour|day/i);
    await waitFor(() => expect(status).toHaveFocus());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/contact");
    expect(init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(sentBody()).toMatchObject({
      name: "Ana Ruiz",
      company: "Acme",
      email: "ana@empresa.com",
      message: "Conciliar facturas",
      consent: true,
      locale: "es",
      formMode: mode,
      website: "",
      turnstileToken: "",
    });
    // Tras enviar ya no hay campos que rellenar.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("mientras se envía no admite un segundo envío y lo indica", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)));
    const { t, user, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", phone: "3001234567", consent: true });
    await user.click(submit());

    const button = screen.getByRole("button", { name: t.sending });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => finish(respond(201)));
  });

  it("errores del servidor (422): se muestran en sus campos, con el foco en el primero", async () => {
    fetchMock.mockResolvedValue(respond(422, { status: "invalid", codes: { phone: "phone-format" }, errors: {} }));
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", phone: "3001234567", consent: true });
    await user.click(submit());
    await waitFor(() => expect(field("phone")).toHaveAttribute("aria-invalid", "true"));
    expect(field("phone")).toHaveAccessibleDescription(expect.stringContaining(t.errors.phoneFormat));
    expect(field("phone")).toHaveFocus();
    expect(field("name")).toHaveValue("Ana");
  });

  // contact-form · Degradación (L5-9)
  it.each([
    [503, "unavailable"],
    [500, "unavailable"],
    [429, "rateLimited"],
    [403, "spam"],
  ] as const)("respuesta %s: error claro con el correo y lo escrito intacto", async (status, key) => {
    fetchMock.mockResolvedValue(respond(status));
    const { t, user, field, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", email: "ana@empresa.com", message: "Conciliar", consent: true });
    await user.click(submit());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(t.failures[key]);
    expect(within(alert).getByRole("link", { name: "hola@confia.ing" })).toHaveAttribute("href", "mailto:hola@confia.ing");
    expect(field("name")).toHaveValue("Ana");
    expect(field("message")).toHaveValue("Conciliar");
    expect(screen.getByRole("checkbox")).toBeChecked();
    // Se puede volver a intentar.
    expect(screen.getByRole("button", { name: t.submit })).toBeEnabled();
  });

  it("sin red: error de conexión con el correo, y se puede reintentar", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(respond(201));
    const { t, user, submit, fill, ready } = setup(mode);
    await ready();
    await fill({ name: "Ana", email: "ana@empresa.com", consent: true });
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(t.failures.network);
    await user.click(submit());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.success));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("se completa y envía solo con teclado", async () => {
    fetchMock.mockResolvedValue(respond(201));
    const { t, user, field, ready } = setup(mode);
    await ready();
    field("name").focus();
    await user.keyboard("Ana{Tab}Acme{Tab}ana@empresa.com{Tab}{Tab}Conciliar{Tab}");
    expect(screen.getByRole("checkbox")).toHaveFocus();
    // Tras la casilla viene el enlace a la política de privacidad, y luego el botón.
    await user.keyboard(" {Tab}");
    expect(screen.getByRole("link", { name: t.consentLink })).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(screen.getByRole("button", { name: t.submit })).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.success));
  });

  it("sin infracciones: vacío, con errores y enviado", async () => {
    fetchMock.mockResolvedValue(respond(201));
    const { user, view, submit, fill, ready } = setup(mode);
    await ready();
    expect(await axe(view.container)).toHaveNoViolations();
    await user.click(submit());
    expect(await axe(view.container)).toHaveNoViolations();
    await fill({ name: "Ana", email: "ana@empresa.com", consent: true });
    await user.click(submit());
    await screen.findByRole("status");
    expect(await axe(view.container)).toHaveNoViolations();
  });
});

// contact-form · Dos modos sobre los mismos datos (L5-10)
describe("modos", () => {
  it("empieza en modo terminal y ofrece el clásico; el control indica el activo y la nota cambia", async () => {
    const { t, user } = setup("terminal");
    const group = screen.getByRole("group", { name: t.modeLabel });
    const terminal = within(group).getByRole("button", { name: t.terminal });
    const classic = within(group).getByRole("button", { name: t.classic });
    expect(terminal).toHaveAttribute("aria-pressed", "true");
    expect(classic).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(t.terminalNote)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: t.terminalFormLabel })).toBeInTheDocument();

    classic.focus();
    await user.keyboard("{Enter}");
    expect(classic).toHaveAttribute("aria-pressed", "true");
    expect(terminal).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(t.classicNote)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: t.classicFormLabel })).toBeInTheDocument();
  });

  it("cambiar de modo conserva lo escrito, en los dos sentidos", async () => {
    const { user, field, consent, fill, switchTo } = setup("terminal");
    await fill({ name: "Ana", company: "Acme", email: "ana@empresa.com", phone: "3001234567", message: "Conciliar", consent: true });
    await switchTo("classic");
    expect(field("name")).toHaveValue("Ana");
    expect(field("company")).toHaveValue("Acme");
    expect(field("email")).toHaveValue("ana@empresa.com");
    expect(field("phone")).toHaveValue("3001234567");
    expect(field("message")).toHaveValue("Conciliar");
    expect(consent()).toBeChecked();
    await user.type(field("name"), " Ruiz");
    await switchTo("terminal");
    expect(field("name")).toHaveValue("Ana Ruiz");
  });

  it("los errores visibles también se conservan al cambiar de modo", async () => {
    const { t, user, submit, switchTo } = setup("terminal");
    await user.click(submit());
    expect(screen.getByText(t.errors.required)).toBeInTheDocument();
    await switchTo("classic");
    expect(screen.getByText(t.errors.required)).toBeInTheDocument();
    expect(screen.getByText(t.errors.contactRequired)).toBeInTheDocument();
  });

  // contact-form · Detalles de cada modo
  it("el panel JSON muestra lo escrito como texto, sin interpretarlo como marcado", async () => {
    const { view, fill, switchTo } = setup("terminal");
    await switchTo("classic");
    await fill({ name: 'Ana "la jefa"', message: "<b>x</b><img src=x onerror=alert(1)>" });
    const panel = view.container.querySelector("[data-live-json]")!;
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel.textContent).toContain("<b>x</b>");
    expect(panel.textContent).toContain('Ana \\"la jefa\\"');
    expect(panel.querySelector("b, img")).toBeNull();
  });

  it("el comando del terminal es decorativo", () => {
    const { t, view } = setup("terminal");
    const command = view.container.querySelector("[data-typed-command]")!;
    expect(command.closest("[aria-hidden='true']")).not.toBeNull();
    // Sin IntersectionObserver ni animación (jsdom), el comando está completo.
    expect(command.textContent).toBe(t.command);
  });

  it("el campo trampa no es visible, ni enfocable, ni se anuncia", () => {
    const { view } = setup("terminal");
    const trap = view.container.querySelector<HTMLInputElement>("[data-trap] input")!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveAttribute("autocomplete", "off");
    // Nada que un autorrelleno o un gestor de contraseñas reconozca: rellenarlo descartaría una consulta real.
    expect(trap.name).not.toMatch(/web|url|site|mail|name|phone|tel|address|company|org/i);
    expect(trap.closest("label")!.textContent).not.toMatch(/web|url|site|mail|name|phone|tel|address|company/i);
    expect(trap).toHaveAttribute("data-1p-ignore");
    expect(trap).toHaveAttribute("data-lpignore", "true");
    expect(trap.closest("[aria-hidden='true']")).not.toBeNull();
  });
});

// contact-form · Verificación antispam (L5-7): el token viaja con la consulta; si la verificación no carga, se dice.
describe("con verificación antispam", () => {
  type Options = { callback(token: string): void; "error-callback"(): void };
  const mount = () => {
    let options: Options | undefined;
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.stubGlobal("turnstile", { render: (_: HTMLElement, received: Options) => ((options = received), "w"), remove: vi.fn() });
    const t = getDictionary("es").contact;
    const user = userEvent.setup();
    render(<ContactForm labels={t} locale="es" privacyHref="/es/privacidad" siteKey="clave-publica" />);
    return { t, user, options: () => options! };
  };

  it("envía el token recibido del widget", async () => {
    fetchMock.mockResolvedValue(respond(201));
    const { t, user, options } = mount();
    act(() => options().callback("token-abc"));
    await user.type(screen.getByLabelText(t.fields.name, { exact: false }), "Ana");
    await user.type(screen.getByLabelText(t.fields.email, { exact: false }), "ana@empresa.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(sentBody().turnstileToken).toBe("token-abc");
  });

  const complete = async (t: ReturnType<typeof mount>["t"], user: ReturnType<typeof mount>["user"]) => {
    await user.type(screen.getByLabelText(t.fields.name, { exact: false }), "Ana");
    await user.type(screen.getByLabelText(t.fields.email, { exact: false }), "ana@empresa.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: t.submit }));
  };

  it("sin token todavía, espera a que llegue en vez de enviar una consulta que el servidor rechazaría", async () => {
    fetchMock.mockResolvedValue(respond(201));
    const { t, user, options } = mount();
    await complete(t, user);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: t.sending })).toBeDisabled();
    act(() => options().callback("token-tardio"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(sentBody().turnstileToken).toBe("token-tardio");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.success));
  });

  it("si el token no llega a tiempo, lo dice y no envía", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { t, user } = mount();
      await complete(t, user);
      await act(() => vi.advanceTimersByTimeAsync(20_000));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent(t.failures.verification);
      expect(screen.getByRole("button", { name: t.submit })).toBeEnabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("tras un fallo de red pide un token nuevo: el anterior pudo gastarse en el servidor", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("red")).mockResolvedValue(respond(201));
    const reset = vi.fn();
    const { t, user, options } = mount();
    (window as unknown as { turnstile: { reset: typeof reset } }).turnstile.reset = reset;
    act(() => options().callback("token-1"));
    await complete(t, user);
    await screen.findByRole("alert");
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("con la verificación caída, enviar lo dice al momento: no hace esperar para repetir el mismo aviso", async () => {
    const { t, user, options } = mount();
    act(() => options()["error-callback"]());
    await complete(t, user);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(t.failures.verification);
    expect(screen.getByRole("button", { name: t.submit })).toBeEnabled();
  });

  it("si la verificación falla, lo avisa con el correo como alternativa", () => {
    const { t, options } = mount();
    act(() => options()["error-callback"]());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(t.failures.verification);
    expect(within(alert).getByRole("link", { name: "hola@confia.ing" })).toHaveAttribute("href", "mailto:hola@confia.ing");
  });
});

// contact-form · Antes de que carguen los scripts el formulario no se puede enviar:
// un envío nativo pondría nombre y correo en la URL de la página.
describe("antes de hidratar", () => {
  it("el HTML servido trae el botón desactivado y el formulario no envía por GET", () => {
    const t = getDictionary("es").contact;
    const html = renderToString(<ContactForm labels={t} locale="es" privacyHref="/es/privacidad" siteKey={null} />);
    const page = new DOMParser().parseFromString(html, "text/html");
    expect(page.querySelector('button[type="submit"]')!.hasAttribute("disabled")).toBe(true);
    expect(page.querySelector("form")!.getAttribute("method")).toBe("post");
  });

  it("ya hidratado, el botón está disponible", () => {
    const { submit } = setup("terminal");
    expect(submit()).toBeEnabled();
  });
});

// analytics-instrumentation · Formulario iniciado una sola vez; Formulario enviado sin contenido; Envío rechazado
describe("avisos para la analítica", () => {
  const listen = () => {
    const seen: { type: string; detail: unknown }[] = [];
    const record = (event: Event) => seen.push({ type: event.type, detail: (event as CustomEvent).detail });
    document.addEventListener("confia:form-started", record);
    document.addEventListener("confia:form-submitted", record);
    return {
      seen,
      stop: () => {
        document.removeEventListener("confia:form-started", record);
        document.removeEventListener("confia:form-submitted", record);
      },
    };
  };

  it("avisa de «iniciado» una sola vez, con el modo en uso, y de «enviado» solo cuando el servidor acepta", async () => {
    fetchMock.mockResolvedValueOnce(respond(503)).mockResolvedValue(respond(201));
    const { seen, stop } = listen();
    const { user, fill, submit, switchTo } = setup("terminal");
    expect(seen).toEqual([]);
    await fill({ name: "Ana" });
    await switchTo("classic");
    await fill({ email: "ana@empresa.com", message: "Conciliar pagos", consent: true });
    expect(seen).toEqual([{ type: "confia:form-started", detail: { mode: "terminal" } }]);

    await user.click(submit());
    await screen.findByRole("alert");
    expect(seen).toHaveLength(1);

    await user.click(submit());
    await screen.findByText(getDictionary("es").contact.success);
    stop();
    expect(seen).toEqual([
      { type: "confia:form-started", detail: { mode: "terminal" } },
      { type: "confia:form-submitted", detail: { mode: "classic" } },
    ]);
    expect(JSON.stringify(seen)).not.toMatch(/Ana|ana@|Conciliar/);
  });

  it.each([403, 422, 429, 503])("un envío que el servidor rechaza con %i no avisa de «enviado»", async (status) => {
    fetchMock.mockResolvedValue(respond(status, { codes: {} }));
    const { seen, stop } = listen();
    const { user, fill, submit } = setup("classic");
    await fill({ name: "Ana", email: "ana@empresa.com", consent: true });
    await user.click(submit());
    await screen.findByRole("alert");
    stop();
    expect(seen.map((event) => event.type)).toEqual(["confia:form-started"]);
  });

  it("un envío con errores no avisa de «enviado»", async () => {
    const { seen, stop } = listen();
    const { user, submit } = setup("terminal");
    await user.click(submit());
    stop();
    expect(seen).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// legal-pages · La política describe lo que el sitio hace: con «No rastrear» no se guarda de dónde llegó la visita
describe("procedencia de la visita en la consulta", () => {
  const setPrivacy = (flags: { gpc?: boolean; dnt?: string | null }) => {
    Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: flags.gpc });
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: flags.dnt ?? null });
  };
  const send = async () => {
    fetchMock.mockResolvedValue(respond(201));
    const { user, fill, submit } = setup("classic");
    await fill({ name: "Ana", email: "ana@empresa.com", consent: true });
    await user.click(submit());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    return sentBody();
  };
  beforeEach(() => {
    window.history.replaceState(null, "", "/es?utm_source=linkedin&utm_campaign=q4");
    Object.defineProperty(document, "referrer", { configurable: true, value: "https://www.google.com/" });
  });
  afterEach(() => {
    setPrivacy({});
    window.history.replaceState(null, "", "/es");
    Object.defineProperty(document, "referrer", { configurable: true, value: "" });
  });

  it("sin la señal, acompaña a la consulta", async () => {
    setPrivacy({});
    expect(await send()).toMatchObject({ utmSource: "linkedin", utmCampaign: "q4", referrerHost: "www.google.com" });
  });

  it.each([{ gpc: true }, { dnt: "1" }])("con %j no se envía", async (flags) => {
    setPrivacy(flags);
    const body = await send();
    for (const key of ["utmSource", "utmMedium", "utmCampaign", "referrerHost"]) expect(body).not.toHaveProperty(key);
    expect(body).toMatchObject({ name: "Ana", email: "ana@empresa.com" });
  });
});
