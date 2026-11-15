import type { Device } from "./events.ts";

/**
 * Tipo de dispositivo según el ancho de la ventana, con los mismos cortes que el diseño
 * (768 y 1100 px). Se mide el ancho en vez de leer el agente de usuario: no hace falta
 * saber qué navegador es, solo qué versión de la página vio.
 */
export function deviceFor(width: number): Device {
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}
