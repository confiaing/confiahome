import { recordEvent } from "@/domain/analytics/record-event";
import { getContainer } from "@/lib/server/container";
import { clientAddress, isJson, isSameOrigin, json, readJsonBody } from "@/lib/server/http";

// Recibe los eventos anónimos de la página (ADR-0005). Solo acepta JSON enviado desde el
// propio sitio. La IP y el agente de usuario se usan aquí y no pasan de aquí.
export const dynamic = "force-dynamic";

/** Un evento ocupa unos 200 bytes; el resto es margen. */
const MAX_BODY_BYTES = 2000;

const NO_CONTENT = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ status: "forbidden" }, 403);
  if (!isJson(request)) return json({ status: "unsupported-media-type" }, 415);

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.reason === "too-large" ? json({ status: "too-large" }, 413) : json({ status: "malformed" }, 400);

  const result = await recordEvent(
    body.value,
    { clientKey: clientAddress(request), userAgent: request.headers.get("user-agent") },
    getContainer().analytics,
  );

  switch (result) {
    case "recorded":
    case "ignored":
      return NO_CONTENT();
    case "invalid":
      return json({ status: "invalid" }, 400);
    case "rate-limited":
      return json({ status: "rate-limited" }, 429);
  }
}
