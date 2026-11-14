import type { Dictionary } from "../../../src/i18n/dictionaries/types.ts";
import { es } from "../../../src/i18n/dictionaries/es.ts";

// Violación deliberada: al diccionario le sobra `soloEnIngles`. Lo compila una prueba.
export const excessive: Dictionary = { ...es, nav: { ...es.nav, soloEnIngles: "Only here" } };
