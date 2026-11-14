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

export interface RateLimiter {
  /** ¿Se admite otro envío de este origen? */
  allow(key: string): Promise<boolean>;
}

export interface Logger {
  /** Registra un fallo. `context` nunca lleva datos del visitante. */
  error(code: string, context?: Record<string, string | number | boolean>): void;
  /** Deja constancia de algo que no es un fallo. Mismas reglas para `context`. */
  info(code: string, context?: Record<string, string | number | boolean>): void;
}
