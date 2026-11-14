// Violación deliberada: lib/ es segura para el cliente y no puede arrastrar código de servidor.
import { loadServerEnv } from "./server/env";
import { getContainer } from "@/lib/server/container";
import { isLocale } from "@/i18n/locales";
const lazy = import("./server/env");

export const all = [loadServerEnv, getContainer, isLocale, lazy];
