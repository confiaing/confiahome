// Entrada del Worker (ADR-0016). Envuelve a la que genera OpenNext para dos cosas que
// Next.js no cubre aquí: las cabeceras de seguridad de cada respuesta y la tarea diaria.
// Los archivos estáticos no pasan por este código: sus cabeceras están en public/_headers.

// @ts-expect-error: lo genera OpenNext al construir (.open-next/ no está en el repositorio)
import openNext from "../.open-next/worker.js";
import { runMaintenance } from "@/domain/maintenance/run-maintenance";
import { consoleLogger } from "@/lib/server/logger";
import { createMaintenanceDeps } from "@/lib/server/maintenance";
import { newNonce, securityHeaders } from "@/lib/server/security/headers";

// @ts-expect-error: clases que OpenNext exige exportar desde la entrada
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

type Env = Record<string, unknown>;
type Context = { waitUntil(promise: Promise<unknown>): void };
type ElementHandler = { element(element: { setAttribute(name: string, value: string): void }): void };
// Transformador de HTML del runtime de Workers: reescribe la página mientras se envía.
declare const HTMLRewriter: new () => { on(selector: string, handler: ElementHandler): { transform(response: Response): Response } };

const isHtml = (response: Response) => (response.headers.get("content-type") ?? "").toLowerCase().includes("text/html");

function withHeaders(response: Response, extra: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  headers.delete("x-powered-by");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    const response: Response = await (openNext as { fetch(request: Request, env: Env, ctx: Context): Promise<Response> }).fetch(request, env, ctx);
    if (!isHtml(response)) return withHeaders(response, securityHeaders({ html: false }));

    // Cada respuesta HTML lleva un código nuevo: la política de contenido solo deja
    // ejecutar los scripts que lo llevan, y aquí se le pone a los que vienen en la página.
    const nonce = newNonce();
    const secured = withHeaders(response, securityHeaders({ html: true, nonce }));
    return new HTMLRewriter().on("script", { element: (element) => element.setAttribute("nonce", nonce) }).transform(secured);
  },

  /** Tarea diaria (wrangler.jsonc → triggers): latido contra la pausa de Supabase y borrado por conservación. */
  async scheduled(_controller: unknown, env: Env, ctx: Context): Promise<void> {
    const work = (async () => {
      try {
        // En un disparo programado no hay petición: la configuración se lee del entorno del Worker.
        const source = Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
        await runMaintenance(createMaintenanceDeps(source), new Date());
      } catch (error) {
        // runMaintenance no lanza; esto cubre una configuración incompleta.
        consoleLogger.error("maintenance.not-started", { reason: error instanceof Error ? error.name : "unknown" });
      }
    })();
    ctx.waitUntil(work);
    await work;
  },
};

export default worker;
