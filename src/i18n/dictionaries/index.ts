import type { Locale } from "../locales.ts";
import { en } from "./en.ts";
import { es } from "./es.ts";
import type { Dictionary } from "./types.ts";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
