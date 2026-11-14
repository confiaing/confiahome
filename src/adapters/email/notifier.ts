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

export function createEmailNotifier(options: EmailNotifierOptions): Notifier {
  return {
    async notify(contact) {
      const mail = composeNotification(contact, {
        from: options.from,
        to: options.to,
        now: options.now(),
        messageId: options.newId(),
      });
      await options.binding.send(await options.createMessage(mail.from, mail.to, mail.raw));
    },
  };
}
