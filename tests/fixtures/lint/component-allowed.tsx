import { isLocale } from "@/i18n/locales";
import { publicEnv } from "@/lib/public-env";
import { contactSchema } from "@/domain/contact/schema";

export const all = [isLocale, publicEnv, contactSchema];
