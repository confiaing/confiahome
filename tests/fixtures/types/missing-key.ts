import type { Dictionary } from "../../../src/i18n/dictionaries/types.ts";
import { es } from "../../../src/i18n/dictionaries/es.ts";

// Violación deliberada: al diccionario le falta `skipLink`. Lo compila una prueba.
const { skipLink: _removed, ...rest } = es;
void _removed;
export const incomplete: Dictionary = rest;
