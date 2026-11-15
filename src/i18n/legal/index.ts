import type { Locale } from "../locales.ts";
import * as en from "./en.ts";
import * as es from "./es.ts";
import type { LegalDocument, LegalKind } from "./types.ts";

export const LEGAL_DOCUMENTS: Record<Locale, Record<LegalKind, LegalDocument>> = {
  es: { privacy: es.privacy, terms: es.terms },
  en: { privacy: en.privacy, terms: en.terms },
};

export function getLegalDocument(locale: Locale, kind: LegalKind): LegalDocument {
  return LEGAL_DOCUMENTS[locale][kind];
}

export type { LegalBlock, LegalDocument, LegalKind, LegalSection } from "./types.ts";
