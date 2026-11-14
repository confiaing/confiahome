// Códigos de error de una consulta. El dominio no contiene textos: quien muestra el
// error (formulario o API) lo traduce con los diccionarios.
export const CONTACT_FIELDS = ["name", "company", "email", "phone", "message", "consent"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const CONTACT_ERROR_CODES = [
  "required",
  "too-long",
  "email-format",
  "phone-format",
  /** No hay ni correo ni teléfono. Se informa en el campo de correo. */
  "contact-required",
  "consent-required",
] as const;
export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;
