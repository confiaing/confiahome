/** Un párrafo o una lista. El texto es plano: sin HTML. */
export type LegalBlock = { p: string } | { list: string[] };

export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

/**
 * Un texto legal. En sus párrafos pueden aparecer estas marcas, que la página resuelve:
 * `{email}` (el correo de contacto, como enlace) y `{entity:name}`, `{entity:id}`,
 * `{entity:address}` (datos del responsable, o «pendiente» mientras no existan).
 */
export type LegalDocument = {
  title: string;
  /** Versión del texto. La de privacidad es la que se guarda con cada consulta. */
  version: string;
  /** Fecha del texto, ya escrita en el idioma del documento. */
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

export type LegalKind = "privacy" | "terms";
