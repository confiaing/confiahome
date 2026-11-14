import type { Capabilities } from "@/domain/scene/mode";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };
type NavigatorHints = Navigator & {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  deviceMemory?: number;
};

function hasWebGL(): boolean {
  try {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // El contexto de sondeo se suelta: los navegadores limitan cuántos puede haber.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

/**
 * Lo que el navegador dice de sí mismo. Safari y Firefox no informan de la conexión
 * ni de la memoria: esos campos llegan como `undefined` y no cuentan como restricción.
 */
export function detectCapabilities(): Capabilities {
  const hints = navigator as NavigatorHints;
  const connection = hints.connection ?? hints.mozConnection ?? hints.webkitConnection;
  return {
    webgl: hasWebGL(),
    reducedMotion: typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData,
    effectiveType: connection?.effectiveType,
    deviceMemory: hints.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency || undefined,
  };
}
