import { execSync } from "node:child_process";

export const PREVIEW_PORT = 8791;

/**
 * Cierra el preview de ESTE proyecto: lo que escuche en su puerto (solo quien escucha: la propia prueba también tiene conexiones abiertas a él) y los procesos de workerd
 * lanzados desde su carpeta, que no mueren con el comando que los arrancó. No se cierra
 * por nombre a secas para no tocar otro `wrangler dev` abierto en la máquina.
 */
export function stopPreview() {
  for (const command of [`lsof -ti tcp:${PREVIEW_PORT} -sTCP:LISTEN | xargs kill -9`, `pkill -9 -f "${process.cwd()}/node_modules/@cloudflare/workerd"`]) {
    try {
      execSync(command, { stdio: "ignore" });
    } catch {
      // Nada que cerrar.
    }
  }
}

export default function teardown() {
  stopPreview();
}
