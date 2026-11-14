import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Turnstile } from "@/components/contact/turnstile";

// contact-form · Verificación antispam en el navegador (L5-7)

type Options = { sitekey: string; callback(token: string): void; "error-callback"(): void; "expired-callback"(): void };
type Observed = { callback: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> };

const observers: Observed[] = [];
function stubObserver() {
  observers.length = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect });
      }
      observe() {}
    },
  );
}
const approach = () =>
  act(() => observers[0]!.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
const script = () => document.head.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com"]');

afterEach(() => {
  vi.unstubAllGlobals();
  script()?.remove();
  delete (window as unknown as { turnstile?: unknown }).turnstile;
});

describe("Turnstile", () => {
  it("sin clave no pinta nada ni pide ningún script", () => {
    stubObserver();
    const view = render(<Turnstile siteKey={null} onToken={vi.fn()} onError={vi.fn()} />);
    expect(view.container).toBeEmptyDOMElement();
    expect(observers).toHaveLength(0);
    expect(script()).toBeNull();
  });

  it("con clave espera a que el formulario se acerque para pedir el script", () => {
    stubObserver();
    render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={vi.fn()} />);
    expect(script()).toBeNull();
    approach();
    expect(script()).not.toBeNull();
    expect(script()!.src).toContain("render=explicit");
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it("al cargar monta el widget con la clave y entrega el token; si caduca, lo retira", () => {
    stubObserver();
    const onToken = vi.fn();
    let options: Options | undefined;
    const remove = vi.fn();
    render(<Turnstile siteKey="clave-publica" onToken={onToken} onError={vi.fn()} />);
    approach();
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: (_element: HTMLElement, received: Options) => {
        options = received;
        return "widget-1";
      },
      remove,
    };
    act(() => void script()!.dispatchEvent(new Event("load")));
    expect(options!.sitekey).toBe("clave-publica");
    act(() => options!.callback("token-1"));
    expect(onToken).toHaveBeenLastCalledWith("token-1");
    act(() => options!["expired-callback"]());
    expect(onToken).toHaveBeenLastCalledWith("");
  });

  it("si el script no carga o el widget falla, avisa", () => {
    stubObserver();
    const onError = vi.fn();
    render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={onError} />);
    approach();
    act(() => void script()!.dispatchEvent(new Event("error")));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("un token solo vale una vez: al cambiar resetKey pide uno nuevo y olvida el anterior", () => {
    stubObserver();
    const reset = vi.fn();
    const onToken = vi.fn();
    (window as unknown as { turnstile: unknown }).turnstile = { render: () => "widget-3", remove: vi.fn(), reset };
    const view = render(<Turnstile siteKey="clave-publica" resetKey={0} onToken={onToken} onError={vi.fn()} />);
    approach();
    expect(reset).not.toHaveBeenCalled();
    view.rerender(<Turnstile siteKey="clave-publica" resetKey={1} onToken={onToken} onError={vi.fn()} />);
    expect(reset).toHaveBeenCalledWith("widget-3");
    expect(onToken).toHaveBeenLastCalledWith("");
  });

  it("sin IntersectionObserver carga ya, y al desmontar retira el widget igualmente", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const remove = vi.fn();
    (window as unknown as { turnstile: unknown }).turnstile = { render: () => "widget-5", remove };
    const view = render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={vi.fn()} />);
    view.unmount();
    expect(remove).toHaveBeenCalledWith("widget-5");
  });

  it("montado dos veces antes de que cargue el script, lo pide una sola vez", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const first = render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={vi.fn()} />);
    first.unmount();
    render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={vi.fn()} />);
    expect(document.head.querySelectorAll('script[src*="challenges.cloudflare.com"]')).toHaveLength(1);
  });

  it("al desmontar retira el widget", () => {
    stubObserver();
    const remove = vi.fn();
    (window as unknown as { turnstile: unknown }).turnstile = { render: () => "widget-9", remove };
    const view = render(<Turnstile siteKey="clave-publica" onToken={vi.fn()} onError={vi.fn()} />);
    approach();
    view.unmount();
    expect(remove).toHaveBeenCalledWith("widget-9");
  });
});
