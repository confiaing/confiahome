// De dónde llegó una visita: etiquetas de campaña y sitio de procedencia. Es un dato de
// contexto, no del visitante, pero llega desde el navegador: aquí se decide qué forma
// puede tener. Lo usan la analítica y el formulario, con las mismas reglas.

/**
 * Una etiqueta de campaña: letras, números y . _ ~ -, hasta 40. Un correo o una frase no
 * encajan. Un código corto sí cabría: los enlaces de campaña nunca deben llevar un valor
 * por destinatario (docs/analytics.md).
 */
export const TAG_PATTERN = /^[A-Za-z0-9._~-]{1,40}$/;

/** La etiqueta, o null si no lo es. */
export const tag = (value: unknown): string | null => (typeof value === "string" && TAG_PATTERN.test(value) ? value : null);

const HOST = /^(?=.{1,255}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** De un host o una dirección completa, solo el nombre de host público; null si no lo hay. */
export function host(value: unknown): string | null {
  if (typeof value !== "string" || value === "" || value.length > 2048) return null;
  let name = value.trim().toLowerCase();
  if (name.includes("/") || name.includes(":")) {
    try {
      const url = new URL(name);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      name = url.hostname;
    } catch {
      return null;
    }
  }
  return HOST.test(name) ? name : null;
}
