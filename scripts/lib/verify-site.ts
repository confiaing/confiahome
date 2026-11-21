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

  await checkZone(origin, send, add);
  return checks;
}

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$|\.(localhost|test)$/;

/**
 * Configuración de la zona de Cloudflare (L13): HTTP lleva a HTTPS y `www` lleva al dominio,
 * con la ruta y los parámetros. Solo contra el dominio público: ni local, ni subdominios.
 */
async function checkZone(origin: string, send: typeof fetch, add: (name: string, ok: boolean, detail?: string) => void) {
  const base = new URL(origin);
  if (base.protocol !== "https:" || LOCAL.test(base.hostname) || base.hostname.split(".").length !== 2) return;
  const host = base.host;
  const probe = "/es?verificacion=1";

  // Una sola petición sin seguir la redirección; un error de red se devuelve como texto.
  const hop = async (url: string) => {
    try {
      const response = await send(url, { redirect: "manual", headers: { "user-agent": AGENT } });
      return { status: response.status, location: response.headers.get("location") ?? "" };
    } catch (error) {
      return { status: 0, location: "", error: error instanceof Error ? error.message : String(error) };
    }
  };
  const describe = (result: { status: number; location: string; error?: string }) =>
    result.error ? `sin respuesta: ${result.error}` : `respondió ${result.status}${result.location ? ` hacia ${result.location}` : ""}`;

  const http = await hop(`http://${host}${probe}`);
  add("http → https conserva ruta y parámetros", http.status === 301 && http.location === `https://${host}${probe}`, describe(http));

  const www = await hop(`https://www.${host}${probe}`);
  add("https://www lleva al dominio con ruta y parámetros", www.status === 301 && www.location === `https://${host}${probe}`, describe(www));

  // Por HTTP, Cloudflare puede pasar antes por https://www: se admiten dos saltos, todos 301.
  let url = `http://www.${host}/es`;
  let last = await hop(url);
  let arrived = false;
  for (let jumps = 0; jumps < 2 && last.status === 301 && last.location; jumps++) {
    url = new URL(last.location, url).href;
    if (url === `https://${host}/es`) {
      arrived = true;
      break;
    }
    last = await hop(url);
  }
  add("http://www lleva a https del dominio", arrived, describe(last));
}
