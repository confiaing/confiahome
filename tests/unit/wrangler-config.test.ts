import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
// wrangler.jsonc admite comentarios de línea: se quitan los que no están dentro de un texto.
const config = JSON.parse(
  readFileSync(`${ROOT}wrangler.jsonc`, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n"),
) as {
  main: string;
  triggers?: { crons?: string[] };
  observability?: { enabled?: boolean; logs?: { enabled?: boolean; invocation_logs?: boolean } };
  ratelimits: { name: string; simple: { limit: number; period: number } }[];
  vars: Record<string, string>;
  send_email: Record<string, string>[];
};

// scheduled-maintenance · Programado una vez al día; Registros de la plataforma sin datos del visitante
describe("configuración del Worker", () => {
  it("la entrada es la propia, que envuelve a la de OpenNext", () => {
    expect(config.main).toBe("worker/index.ts");
    expect(existsSync(ROOT + config.main)).toBe(true);
  });

  it("tiene exactamente un disparo programado, diario", () => {
    expect(config.triggers?.crons).toHaveLength(1);
    const [minute, hour, dayOfMonth, month, dayOfWeek] = config.triggers!.crons![0]!.split(" ");
    expect(Number(minute)).toBeGreaterThanOrEqual(0);
    expect(Number(hour)).toBeGreaterThanOrEqual(0);
    expect([dayOfMonth, month, dayOfWeek]).toEqual(["*", "*", "*"]);
  });

  it("conserva los registros propios y no los automáticos de cada petición, que pueden llevar la IP", () => {
    expect(config.observability?.enabled).toBe(true);
    expect(config.observability?.logs?.invocation_logs).toBe(false);
    expect(config.observability?.logs?.enabled).not.toBe(false);
  });

  // production-release · Secretos solo en el Worker
  it("declara solo variables que no son secretas; las claves y la dirección de aviso van como secretos", () => {
    expect(Object.keys(config.vars).sort()).toEqual(["NOTIFY_FROM", "SERVICES"]);
    expect(config.vars.SERVICES).toBe("real");
    expect(config.vars.NOTIFY_FROM).toBe("web@confia.ing");
    const text = JSON.stringify(config);
    // La dirección de la base de producción tampoco va aquí: el preview local lee este archivo,
    // y un entorno local nunca debe poder apuntar a producción por descuido.
    expect(text).not.toMatch(/supabase\.co/);
    expect(text).not.toMatch(/sb_secret_|0x4AAAA|@gmail\.com/);
    // El buzón de destino es una dirección personal: no se publica en el repositorio.
    for (const binding of config.send_email) expect(binding).not.toHaveProperty("destination_address");
  });

  it("los límites de frecuencia son los documentados", () => {
    expect(Object.fromEntries(config.ratelimits.map((item) => [item.name, item.simple]))).toEqual({
      CONTACT_RATE_LIMITER: { limit: 5, period: 60 },
      EVENTS_RATE_LIMITER: { limit: 20, period: 60 },
    });
  });
});

// security-headers · Respuestas que no son HTML: los archivos estáticos no pasan por el Worker
describe("cabeceras de los archivos estáticos", () => {
  it("public/_headers pone HSTS y nosniff a todo lo estático, y caché larga a lo que lleva huella en el nombre", () => {
    const text = readFileSync(`${ROOT}public/_headers`, "utf8");
    const all = text.split(/\n(?=\/)/).find((block) => block.startsWith("/*\n"))!;
    expect(all).toContain("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    expect(all).toContain("X-Content-Type-Options: nosniff");
    expect(all).not.toMatch(/preload/);
    expect(text).toMatch(/\/_next\/static\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
  });
});
