/**
 * ¿Pidió el visitante que no se le rastree? (Global Privacy Control o Do Not Track.)
 * Con esa señal el sitio no registra su uso de la página, no carga el contador de visitas
 * y no guarda de dónde llegó, como dice la política de privacidad.
 */
export function optedOut(): boolean {
  const flags = navigator as Navigator & { globalPrivacyControl?: boolean };
  return flags.globalPrivacyControl === true || navigator.doNotTrack === "1";
}
