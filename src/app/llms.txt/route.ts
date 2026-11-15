import { publicEnv } from "@/lib/public-env";
import { llmsText } from "@/lib/server/seo/llms";

// Resumen del sitio en texto plano para asistentes de IA. Se genera al construir.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsText(publicEnv.siteUrl), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
