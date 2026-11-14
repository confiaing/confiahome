// Identificadores de la navegación principal. Viven fuera del componente de cliente
// porque también los usan globals.css (regla para navegadores sin scripts) y las pruebas.
export const NAV_ID = "site-nav";
export const NAV_TOGGLE_ID = "site-nav-toggle";

/** Coincide con --breakpoint-nav de tokens.css: desde aquí la navegación va en línea. */
export const NAV_WIDE_QUERY = "(min-width: 56.25rem)";
