// Puertos del caso de uso de contacto: lo que el dominio necesita del exterior.
// Los adaptadores (src/adapters/) los implementan; las pruebas usan los de memoria.

/** Una consulta lista para guardar. No lleva IP, token ni nada que no vaya a la tabla. */
export type ContactRecord = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  locale: "es" | "en";
  /** Fecha ISO en la que se aceptó el aviso de privacidad. */
  consentAt: string;
  consentVersion: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrerHost: string | null;
};

export type SavedContact = ContactRecord & { id: string };

export interface ContactRepository {
  /** Guarda la consulta. Lanza un error si el almacén no la acepta. */
  save(record: ContactRecord): Promise<SavedContact>;
}

export interface Notifier {
  /** Avisa al equipo de una consulta ya guardada. Lanza un error si no puede. */
  notify(contact: SavedContact): Promise<void>;
}

export interface SpamVerifier {
  /** ¿El token antispam es válido? `remoteIp` solo se usa para la verificación. */
  verify(token: string, remoteIp: string | null): Promise<boolean>;
}

// Compartidos con analítica y mantenimiento: viven en ../ports.ts.
export type { Logger, RateLimiter } from "../ports.ts";
