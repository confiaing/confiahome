// Comprobaciones de solo lectura sobre un sitio desplegado. No crea datos: la única
// consulta que envía va sin verificación antispam, y lo que se comprueba es que el
// servidor la rechace.

export type Check = { name: string; ok: boolean; detail?: string };

const PAGES = ["/es", "/en", "/es/privacidad"];
const AGENT = "Mozilla/5.0 (verificación de despliegue de Confia.ing)";

export async function verifySite(base: string, send: typeof fetch = fetch): Promise<Check[]> {
  const origin = base.replace(/\/+$/, "");
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail?: string) => void checks.push({ name, ok, ...(ok || !detail ? {} : { detail }) });
  const get = (path: string, init: RequestInit = {}) => send(origin + path, { redirect: "manual", headers: { "user-agent": AGENT }, ...init });

  for (const path of PAGES) {
    const response = await get(path);
    add(`GET ${path} responde 200`, response.status === 200, `respondió ${response.status}`);
    const policy = response.headers.get("content-security-policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    add(`${path} lleva política de contenido con código`, Boolean(nonce) && policy.includes("frame-ancestors 'none'") && !/unsafe-inline|unsafe-eval/.test(policy));
    add(
      `${path} lleva HSTS y nosniff`,
      /max-age=31536000;\s*includeSubDomains/.test(response.headers.get("strict-transport-security") ?? "") && response.headers.get("x-content-type-options") === "nosniff",
    );
    const scripts = [...(await response.text()).matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]!);
    add(`${path}: todos los scripts llevan el código`, scripts.length > 0 && Boolean(nonce) && scripts.every((attributes) => attributes.includes(`nonce="${nonce}"`)));
  }

  const root = await get("/");
  add("GET / redirige a un idioma", root.status === 307 && /^\/(es|en)$/.test(root.headers.get("location") ?? ""), `respondió ${root.status}`);

  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
    const response = await get(path);
    const body = await response.text();
    add(`GET ${path} responde 200`, response.status === 200, `respondió ${response.status}`);
    add(`${path} usa la dirección pública`, body.includes(origin) && !/localhost|127\.0\.0\.1/.test(body));
  }

  const post = (path: string, body: unknown) =>
    send(origin + path, { method: "POST", headers: { "content-type": "application/json", origin, "user-agent": AGENT }, body: JSON.stringify(body) });
  // Sin token antispam: con los servicios reales debe rechazarse (403) y no guardar nada.
  const contact = await post("/api/contact", { name: "Verificación", email: "verificacion@example.com", consent: true, locale: "es", formMode: "classic", website: "", turnstileToken: "" });
  add("una consulta sin verificación antispam se rechaza", contact.status === 403, `respondió ${contact.status}`);
  const event = await post("/api/events", { name: "no-existe", locale: "es", device: "desktop" });
  add("un evento fuera de la lista se rechaza", event.status === 400, `respondió ${event.status}`);

  return checks;
}
