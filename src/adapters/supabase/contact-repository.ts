import type { ContactRecord, ContactRepository, SavedContact } from "@/domain/contact/ports";

// Guarda consultas en Supabase por su API REST (PostgREST), con fetch y la secret key.
// Sin el SDK de Supabase: es una sola petición y el Worker tiene un tope de tamaño (ADR-0014).
// Solo se usa en el servidor: la secret key salta la seguridad por filas.

export type SupabaseOptions = { url: string; secretKey: string; fetch?: typeof fetch; newId?: () => string };

/** Tiempo máximo de espera: pasado este, el visitante ve el aviso con el correo. */
const TIMEOUT_MS = 8000;

/** El almacén rechazó la petición. El mensaje no repite nada de lo enviado. */
export class SupabaseError extends Error {
  override readonly name = "SupabaseError";
  constructor(readonly status: number) {
    super(`Supabase respondió ${status} al guardar la consulta.`);
  }
}

export function createSupabaseContactRepository(options: SupabaseOptions): ContactRepository {
  const send = options.fetch ?? fetch;
  const endpoint = `${options.url.replace(/\/+$/, "")}/rest/v1/contact_requests`;

  return {
    async save(record: ContactRecord): Promise<SavedContact> {
      // El identificador se genera aquí: guardar no depende de leer la respuesta.
      const id = (options.newId ?? (() => crypto.randomUUID()))();
      const response = await send(endpoint, {
        method: "POST",
        headers: {
          apikey: options.secretKey,
          Authorization: `Bearer ${options.secretKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        // Solo las columnas de la tabla. No hay ninguna para la IP.
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          id,
          name: record.name,
          company: record.company,
          email: record.email,
          phone: record.phone,
          message: record.message,
          locale: record.locale,
          consent_at: record.consentAt,
          consent_version: record.consentVersion,
          utm_source: record.utmSource,
          utm_medium: record.utmMedium,
          utm_campaign: record.utmCampaign,
          referrer_host: record.referrerHost,
        }),
      });
      if (!response.ok) throw new SupabaseError(response.status);
      return { ...record, id };
    },
  };
}
