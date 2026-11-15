/**
 * Rastreadores de asistentes de IA a los que `robots.txt` nombra para dejar claro que
 * pueden leer el sitio. El grupo general ya los permite; nombrarlos es declarar la intención.
 * Revisado el 2026-11-14 con guías de terceros, no con la documentación de cada proveedor:
 * conviene repasar la lista de vez en cuando.
 */
export const AI_CRAWLERS = [
  // OpenAI: entrenamiento, buscador y peticiones hechas por un usuario.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic.
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity.
  "PerplexityBot",
  "Perplexity-User",
  // Google: no es un rastreador, es la señal para el uso en sus modelos.
  "Google-Extended",
];
