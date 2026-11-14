// Preferencia de versión de la escena. Es una preferencia funcional: una clave con
// «ligera» o «completa», sin ningún dato del visitante.
export const PREFERENCE_KEY = "confia-modo";

type Mode = "full" | "lite";
type Store = Pick<Storage, "getItem" | "setItem">;

const VALUES: Record<Mode, string> = { lite: "ligera", full: "completa" };

function defaultStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    // En modo privado o con el almacenamiento bloqueado, acceder ya lanza error.
    return undefined;
  }
}

export function readPreference(store: Store | undefined = defaultStore()): Mode | null {
  try {
    const value = store?.getItem(PREFERENCE_KEY);
    if (value === VALUES.lite) return "lite";
    if (value === VALUES.full) return "full";
  } catch {
    // Sin almacenamiento no hay preferencia: decide el criterio automático.
  }
  return null;
}

export function writePreference(mode: Mode, store: Store | undefined = defaultStore()): void {
  try {
    store?.setItem(PREFERENCE_KEY, VALUES[mode]);
  } catch {
    // La elección vale para esta visita aunque no se pueda recordar.
  }
}
