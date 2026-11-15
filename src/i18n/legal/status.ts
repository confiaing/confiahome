// Estado de los textos legales. Es el ÚNICO punto que cambia cuando un abogado los
// aprueba: de aquí salen el aviso de borrador, la indexación de las páginas legales y
// su presencia en el mapa del sitio.

export type LegalStatus = "draft" | "in-force";

export const LEGAL_STATUS: LegalStatus = "draft";

/**
 * Quién trata los datos (Ley 1581 de 2012). Solo el fundador puede aportarlo; mientras
 * un valor sea null, la página lo muestra como pendiente. No se rellena con suposiciones.
 */
export const LEGAL_ENTITY: { name: string | null; id: string | null; address: string | null } = {
  name: null,
  id: null,
  address: null,
};

export const isLegalDraft = (status: LegalStatus = LEGAL_STATUS): boolean => status === "draft";

/** Un borrador no se indexa, pero sus enlaces sí se siguen. */
export const legalRobots = (status: LegalStatus = LEGAL_STATUS) => ({ index: status === "in-force", follow: true });

/** Páginas que se anuncian a los buscadores. Anunciar una que se pide no indexar sería contradictorio. */
export function indexablePages(status: LegalStatus = LEGAL_STATUS): ("home" | "privacy" | "terms")[] {
  return status === "in-force" ? ["home", "privacy", "terms"] : ["home"];
}

/**
 * Qué impide publicar los textos como vigentes. Con el estado en «borrador» no hay nada
 * que comprobar. Vigentes, hacen falta los datos del responsable, y ni la versión ni la
 * fecha pueden seguir diciendo «borrador»: se indexaría como definitivo un texto a medias.
 * Una prueba exige que el estado actual no tenga ningún bloqueo.
 */
export function publicationBlockers(
  status: LegalStatus,
  entity: typeof LEGAL_ENTITY,
  documents: { version: string; updated: string }[],
): string[] {
  if (status === "draft") return [];
  const blockers = (["name", "id", "address"] as const).filter((field) => !entity[field]?.trim()).map((field) => `entity.${field}`);
  if (documents.some((document) => /borrador|draft/i.test(`${document.version} ${document.updated}`))) blockers.push("draft-wording");
  return blockers;
}
