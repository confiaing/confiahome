// Utilidades de los Route Handlers que reciben datos (contacto, eventos).

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * ¿La petición viene de una página de este mismo sitio? Exige la cabecera Origin, que
 * los navegadores envían siempre en un POST entre orígenes. Tras el proxy de Cloudflare
 * el host de request.url puede no ser el público: vale también la cabecera Host.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || !URL.canParse(origin)) return false;
  const hosts = [new URL(request.url).host, request.headers.get("host")];
  return hosts.includes(new URL(origin).host);
}

export function isJson(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return type.split(";")[0]!.trim().toLowerCase() === "application/json";
}

export type BodyResult = { ok: true; value: unknown } | { ok: false; reason: "too-large" | "invalid" };

/** Lee un cuerpo JSON sin fiarse de Content-Length: corta en cuanto supera el límite. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<BodyResult> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, reason: "too-large" };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, reason: "invalid" };
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, reason: "too-large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/** Dirección del visitante según Cloudflare. Solo para limitar y verificar: no se guarda ni se registra. */
export function clientAddress(request: Request): string | null {
  return request.headers.get("cf-connecting-ip")?.trim() || null;
}
