import type { SavedContact } from "@/domain/contact/ports";

// Compone el aviso al equipo: un correo de texto plano. Función pura.
//
// Defensa contra inyección de cabeceras: ningún texto del visitante se escribe en una
// cabecera, salvo su correo en Reply-To y solo si es una dirección limpia. Todo lo demás
// va en el cuerpo, que viaja en base64.

export type ComposedMail = { from: string; to: string; raw: string };
export type ComposeOptions = { from: string; to: string; now: Date; messageId: string };

const SAFE_ADDRESS = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const encodedWord = (text: string) => `=?UTF-8?B?${base64(text)}?=`;
const lines76 = (text: string) => text.match(/.{1,76}/g)?.join("\r\n") ?? "";

export function composeNotification(contact: SavedContact, options: ComposeOptions): ComposedMail {
  const body = [
    "Nueva consulta desde confia.ing",
    "",
    `Nombre: ${contact.name}`,
    `Empresa: ${contact.company ?? "—"}`,
    `Correo: ${contact.email ?? "—"}`,
    `Teléfono: ${contact.phone ?? "—"}`,
    `Idioma: ${contact.locale}`,
    "",
    "¿Dónde quiere aplicar IA?",
    contact.message ?? "(sin mensaje)",
    "",
    `Consentimiento: ${contact.consentAt} · aviso ${contact.consentVersion}`,
    `Origen: ${[contact.utmSource, contact.utmMedium, contact.utmCampaign, contact.referrerHost].filter(Boolean).join(" · ") || "—"}`,
    `Identificador: ${contact.id}`,
  ].join("\r\n");

  const replyTo = contact.email && SAFE_ADDRESS.test(contact.email) ? contact.email : null;
  const domain = options.from.split("@")[1] ?? "confia.ing";
  const headers = [
    `From: ${encodedWord("Confia.ing")} <${options.from}>`,
    `To: ${options.to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodedWord("Nueva consulta desde confia.ing")}`,
    `Message-ID: <${options.messageId}@${domain}>`,
    `Date: ${options.now.toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];

  return { from: options.from, to: options.to, raw: `${headers.join("\r\n")}\r\n\r\n${lines76(base64(body))}\r\n` };
}
