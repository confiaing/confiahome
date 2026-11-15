import type { Notifier } from "@/domain/contact/ports";
import { composeNotification } from "./compose";

// Avisa al equipo con el binding `send_email` de Cloudflare (ADR-0003). Solo puede
// enviar a direcciones verificadas en Email Routing.

/** El binding `send_email` del Worker. */
export type EmailBinding = { send(message: unknown): Promise<unknown> };

export type EmailNotifierOptions = {
  from: string;
  to: string;
  binding: EmailBinding;
  /** Construye el mensaje del runtime de Workers (`EmailMessage` de "cloudflare:email"). */
  createMessage(from: string, to: string, raw: string): Promise<unknown>;
  now(): Date;
  newId(): string;
};

/** El correo no salió a tiempo. La consulta ya está guardada: solo se pierde el aviso. */
export class EmailTimeoutError extends Error {
  override readonly name = "EmailTimeoutError";
}

const TIMEOUT_MS = 8000;

export function createEmailNotifier(options: EmailNotifierOptions): Notifier {
  return {
    async notify(contact) {
      const mail = composeNotification(contact, {
        from: options.from,
        to: options.to,
        now: options.now(),
        messageId: options.newId(),
      });
      // Con tiempo máximo: el visitante espera la respuesta, y su consulta ya está guardada.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new EmailTimeoutError("El aviso por correo no salió a tiempo.")), TIMEOUT_MS);
      });
      try {
        await Promise.race([options.createMessage(mail.from, mail.to, mail.raw).then((message) => options.binding.send(message)), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
