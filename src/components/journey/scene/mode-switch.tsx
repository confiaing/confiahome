"use client";

import { setSceneState, useSceneState } from "@/components/journey/scene/scene-store";
import type { LiteReason, SceneMode } from "@/domain/scene/mode";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";
import { writePreference } from "@/lib/scene-preference";

type Labels = Dictionary["scene"];

const REASON_KEY: Record<LiteReason, keyof Labels["status"]> = {
  chosen: "chosen",
  "no-webgl": "noWebgl",
  "reduced-motion": "reducedMotion",
  "save-data": "saveData",
  "slow-connection": "slowConnection",
  "low-end-device": "lowEndDevice",
  "load-failed": "loadFailed",
  "context-lost": "contextLost",
};

const OPTION =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors duration-200";

/**
 * Control «Versión ligera / Versión completa» del pie. Solo existe en las páginas con
 * escena (la home) y solo con JavaScript: sin él, la única versión es la ligera.
 */
export function ModeSwitch({ labels }: { labels: Labels }) {
  const { hasScene, mode, reason, status, webgl } = useSceneState();
  if (!hasScene) return null;

  const choose = (next: SceneMode) => {
    if (next === "full" && !webgl) {
      // No se puede cumplir: se explica y no se guarda una elección imposible.
      setSceneState({ mode: "lite", reason: "no-webgl" });
      return;
    }
    writePreference(next);
    setSceneState({ mode: next, reason: next === "lite" ? "chosen" : null });
  };

  const message =
    mode === "full"
      ? // Hasta que la escena está lista no se anuncia como tal.
        status === "ready"
        ? labels.status.full
        : labels.status.loading
      : labels.status[REASON_KEY[reason ?? "chosen"]];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9rem]">
      <div role="group" aria-label={labels.label} className="inline-flex gap-0.5 rounded-full border-[1.5px] border-border-strong p-[3px]">
        {(["lite", "full"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => choose(option)}
            className={cx(OPTION, mode === option ? "bg-text text-background" : "text-text hover:bg-surface-strong")}
          >
            {labels[option]}
          </button>
        ))}
      </div>
      <p role="status" className="text-text-muted">
        {message}
      </p>
    </div>
  );
}
