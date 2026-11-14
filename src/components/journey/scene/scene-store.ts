import { useSyncExternalStore } from "react";
import type { LiteReason, SceneMode } from "@/domain/scene/mode";

// Estado compartido de la escena. Las pestañas (en la página) escriben la etapa, el
// control del pie (en el layout) escribe la versión, y el controlador los lee. No
// comparten un ancestro donde poner un contexto de React sin volver cliente todo el
// árbol; por eso es un almacén de módulo.

export type SceneStatus = "idle" | "loading" | "ready";

export type SceneState = {
  /** Etapa seleccionada en el recorrido, de 1 a 5. */
  stage: number;
  mode: SceneMode;
  /** Por qué la versión es ligera; null en versión completa. */
  reason: LiteReason | null;
  /** Estado de la escena 3D. */
  status: SceneStatus;
  /** La página tiene ranuras de escena (la home sí; las legales, no). */
  hasScene: boolean;
  /** El navegador puede dibujar en 3D. */
  webgl: boolean;
};

const INITIAL: SceneState = { stage: 1, mode: "lite", reason: null, status: "idle", hasScene: false, webgl: false };

let state: SceneState = INITIAL;
const listeners = new Set<() => void>();

export function getSceneState(): SceneState {
  return state;
}

export function setSceneState(patch: Partial<SceneState>): void {
  const next = { ...state, ...patch };
  if ((Object.keys(next) as (keyof SceneState)[]).every((key) => next[key] === state[key])) return;
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeScene(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Solo para pruebas: vuelve al estado inicial. */
export function resetSceneStore(): void {
  state = INITIAL;
  for (const listener of listeners) listener();
}

const getServerState = () => INITIAL;

export function useSceneState(): SceneState {
  return useSyncExternalStore(subscribeScene, getSceneState, getServerState);
}
