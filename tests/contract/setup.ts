import { execFileSync } from "node:child_process";

// Las pruebas de contrato hablan con Supabase LOCAL (Docker). La dirección y las claves
// se piden a la CLI: son las del entorno local, nunca las de producción, y no se imprimen.
export default function setup() {
  let status: { API_URL?: string; SECRET_KEY?: string; PUBLISHABLE_KEY?: string };
  try {
    status = JSON.parse(execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    throw new Error("Supabase local no responde. Abre Docker y ejecuta `npx supabase start` antes de `npm run test:contract`.");
  }
  const { API_URL, SECRET_KEY, PUBLISHABLE_KEY } = status;
  if (!API_URL || !SECRET_KEY || !PUBLISHABLE_KEY) throw new Error("`supabase status` no devolvió la dirección o las claves locales.");
  if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(API_URL)) {
    throw new Error("Las pruebas de contrato solo se ejecutan contra Supabase local.");
  }
  process.env.CONTRACT_SUPABASE_URL = API_URL;
  process.env.CONTRACT_SUPABASE_SECRET_KEY = SECRET_KEY;
  process.env.CONTRACT_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
}
