"use client";

import { useEffect } from "react";
import { detectCapabilities } from "@/components/journey/scene/capabilities";
import { getSceneState, setSceneState, useSceneState } from "@/components/journey/scene/scene-store";
import { decideMode } from "@/domain/scene/mode";
import { readPreference } from "@/lib/scene-preference";

// Three.js viaja en un trozo aparte, solo para el navegador. La condición se resuelve al
// compilar: en el build del servidor esta importación desaparece y three no entra en el
// Worker (lo comprueba scripts/check-worker-size.ts).
const loadThreeScene = typeof window === "undefined" ? null : () => import("@/components/journey/scene/three-scene");

type IdleWindow = Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number };

/** Ejecuta `task` cuando la página ya cargó y el navegador está ocioso. Devuelve cómo cancelarlo. */
function afterLoadAndIdle(task: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) task();
  };
  const whenIdle = () => {
    const idle = (window as IdleWindow).requestIdleCallback;
    if (idle) idle(run, { timeout: 1500 });
    else window.setTimeout(run, 200);
  };
  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", whenIdle);
  };
}

/**
 * Gobierna la escena de la página: decide la versión (completa o ligera), la refleja en
 * <html data-mode> para el CSS y, en versión completa, carga la escena 3D cuando la
 * página ya es legible. No pinta nada: la ilustración ligera ya está en el HTML.
 */
export function SceneController() {
  const { mode } = useSceneState();

  // Al montar: esta página tiene escena; se decide su versión.
  useEffect(() => {
    const capabilities = detectCapabilities();
    setSceneState({ hasScene: true, webgl: capabilities.webgl, ...decideMode(capabilities, readPreference()) });
    return () => {
      setSceneState({ hasScene: false, status: "idle" });
      delete document.documentElement.dataset.mode;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    if (mode !== "full") return;

    let scene: { destroy(): void } | null = null;
    let cancelled = false;
    const cancelWait = afterLoadAndIdle(() => {
      setSceneState({ status: "loading" });
      // Solo se pide aquí, cuando la página ya es legible; nunca en el arranque.
      (loadThreeScene?.() ?? Promise.reject(new Error("La escena solo existe en el navegador")))
        .then(({ createScene }) => {
          if (cancelled) return;
          scene = createScene({
            slots: [...document.querySelectorAll<HTMLElement>("[data-scene]")],
            getStage: () => getSceneState().stage,
            onContextLost: () => setSceneState({ mode: "lite", reason: "context-lost" }),
          });
          setSceneState({ status: "ready" });
        })
        .catch(() => {
          // La librería no llegó o la escena no pudo arrancar: la página sigue en ligera.
          if (!cancelled) setSceneState({ mode: "lite", reason: "load-failed", status: "idle" });
        });
    });

    return () => {
      cancelled = true;
      cancelWait();
      scene?.destroy();
      setSceneState({ status: "idle" });
    };
  }, [mode]);

  return null;
}
