import { HomePlaceholder } from "@/components/sections/home-placeholder";
import { createMemoryHealthCheck } from "@/adapters/memory/health";
import { isLocale } from "@/i18n/locales";

export const all = [HomePlaceholder, createMemoryHealthCheck, isLocale];
