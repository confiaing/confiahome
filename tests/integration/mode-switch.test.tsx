import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ModeSwitch } from "@/components/journey/scene/mode-switch";
import { SceneController } from "@/components/journey/scene/scene-controller";
import { getSceneState, resetSceneStore, setSceneState, subscribeScene } from "@/components/journey/scene/scene-store";
import { getDictionary } from "@/i18n/dictionaries";
import { PREFERENCE_KEY } from "@/lib/scene-preference";

const es = getDictionary("es").scene;
const en = getDictionary("en").scene;

beforeEach(() => {
  resetSceneStore();
  window.localStorage.clear();
  delete document.documentElement.dataset.mode;
});
afterEach(() => resetSceneStore());

const pressed = () => screen.getAllByRole("button").map((button) => button.getAttribute("aria-pressed"));

// scene-rendering · Control de versión del visitante (L4-9)
describe("ModeSwitch", () => {
  it("no se pinta en una página sin escena", () => {
    const { container } = render(<ModeSwitch labels={es} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("con escena ofrece las dos versiones e indica la activa", async () => {
    setSceneState({ hasScene: true, webgl: true, mode: "full", reason: null, status: "ready" });
    const { container } = render(<ModeSwitch labels={es} />);
    const group = screen.getByRole("group", { name: "Versión de la página" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Versión ligera" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Versión completa" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(es.status.full);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("elegir «ligera» cambia la versión al instante, lo explica y lo recuerda", async () => {
    setSceneState({ hasScene: true, webgl: true, mode: "full", reason: null });
    const user = userEvent.setup();
    render(<ModeSwitch labels={es} />);
    await user.click(screen.getByRole("button", { name: "Versión ligera" }));
    expect(getSceneState()).toMatchObject({ mode: "lite", reason: "chosen" });
    expect(pressed()).toEqual(["true", "false"]);
    expect(screen.getByRole("status")).toHaveTextContent(es.status.chosen);
    expect(window.localStorage.getItem(PREFERENCE_KEY)).toBe("ligera");
    expect(window.localStorage.length).toBe(1);
  });

  it("elegir «completa» con WebGL la activa y la recuerda", async () => {
    setSceneState({ hasScene: true, webgl: true, mode: "lite", reason: "slow-connection" });
    const user = userEvent.setup();
    render(<ModeSwitch labels={es} />);
    await user.click(screen.getByRole("button", { name: "Versión completa" }));
    expect(getSceneState()).toMatchObject({ mode: "full", reason: null });
    expect(window.localStorage.getItem(PREFERENCE_KEY)).toBe("completa");
  });

  it("sin WebGL, «completa» no cambia la versión, explica el motivo y no guarda nada", async () => {
    setSceneState({ hasScene: true, webgl: false, mode: "lite", reason: "chosen" });
    const user = userEvent.setup();
    render(<ModeSwitch labels={es} />);
    await user.click(screen.getByRole("button", { name: "Versión completa" }));
    expect(getSceneState()).toMatchObject({ mode: "lite", reason: "no-webgl" });
    expect(pressed()).toEqual(["true", "false"]);
    expect(screen.getByRole("status")).toHaveTextContent(es.status.noWebgl);
    expect(window.localStorage.getItem(PREFERENCE_KEY)).toBeNull();
  });

  it.each([
    ["reduced-motion", "reducedMotion"],
    ["save-data", "saveData"],
    ["slow-connection", "slowConnection"],
    ["low-end-device", "lowEndDevice"],
    ["load-failed", "loadFailed"],
    ["context-lost", "contextLost"],
    ["no-webgl", "noWebgl"],
  ] as const)("explica el motivo «%s» en español y en inglés", (reason, key) => {
    setSceneState({ hasScene: true, webgl: true, mode: "lite", reason });
    const { unmount } = render(<ModeSwitch labels={es} />);
    expect(screen.getByRole("status")).toHaveTextContent(es.status[key]);
    unmount();
    render(<ModeSwitch labels={en} />);
    expect(screen.getByRole("status")).toHaveTextContent(en.status[key]);
    expect(screen.getByRole("group", { name: "Page version" })).toBeInTheDocument();
  });

  it.each(["idle", "loading"] as const)("mientras la escena no está lista (%s), no la anuncia como tal", (status) => {
    setSceneState({ hasScene: true, webgl: true, mode: "full", reason: null, status });
    render(<ModeSwitch labels={es} />);
    expect(screen.getByRole("status")).toHaveTextContent(es.status.loading);
  });

  it("se puede usar con teclado", async () => {
    setSceneState({ hasScene: true, webgl: true, mode: "full", reason: null });
    const user = userEvent.setup();
    render(<ModeSwitch labels={es} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Versión ligera" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(getSceneState().mode).toBe("lite");
  });
});

describe("almacén de la escena", () => {
  it("avisa a quien escucha solo cuando algo cambia, y deja de avisar al desuscribirse", () => {
    let calls = 0;
    const unsubscribe = subscribeScene(() => (calls += 1));
    setSceneState({ stage: 3 });
    expect(getSceneState().stage).toBe(3);
    expect(calls).toBe(1);
    setSceneState({ stage: 3 });
    expect(calls).toBe(1);
    unsubscribe();
    setSceneState({ stage: 4 });
    expect(calls).toBe(1);
  });

  it("empieza en la etapa 1, versión ligera y sin escena", () => {
    expect(getSceneState()).toEqual({ stage: 1, mode: "lite", reason: null, status: "idle", hasScene: false, webgl: false });
  });
});

// scene-rendering · Elección automática de versión, en el navegador
describe("SceneController", () => {
  it("registra la escena, decide la versión y la refleja en el documento", () => {
    const { unmount } = render(<SceneController />);
    // jsdom no ofrece WebGL: la versión es ligera, con su motivo.
    expect(getSceneState()).toMatchObject({ hasScene: true, webgl: false, mode: "lite", reason: "no-webgl" });
    expect(document.documentElement.dataset.mode).toBe("lite");
    unmount();
    expect(getSceneState().hasScene).toBe(false);
  });

  it("no pinta nada", () => {
    const { container } = render(<SceneController />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sigue los cambios de versión y limpia el documento al salir", () => {
    const { unmount } = render(<SceneController />);
    expect(document.documentElement.dataset.mode).toBe("lite");
    act(() => setSceneState({ mode: "full", reason: null }));
    expect(document.documentElement.dataset.mode).toBe("full");
    act(() => setSceneState({ mode: "lite", reason: "chosen" }));
    expect(document.documentElement.dataset.mode).toBe("lite");
    unmount();
    expect(document.documentElement.dataset.mode).toBeUndefined();
  });
});
