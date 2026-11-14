// Violación deliberada: un componente no puede tocar adaptadores ni código de servidor.
import { saveContact } from "@/adapters/supabase/contact";
import { loadServerEnv } from "@/lib/server/env";

export const all = [saveContact, loadServerEnv];
