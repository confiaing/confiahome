import type { Logger } from "@/domain/contact/ports";

/**
 * Registro de fallos del servidor. Escribe una línea JSON con un código y un contexto
 * técnico. Quien lo llama nunca pasa datos del visitante (nombre, correo, teléfono,
 * mensaje, IP): lo impone el tipo del contexto y lo comprueban las pruebas.
 */
export const consoleLogger: Logger = {
  error(code, context) {
    console.error(JSON.stringify({ level: "error", code, ...context }));
  },
  info(code, context) {
    console.log(JSON.stringify({ level: "info", code, ...context }));
  },
};
