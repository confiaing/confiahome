import { z } from "zod";
import { LOCALE_VALUES } from "@/domain/shared/locale";
import { helper } from "./helper";

export const schema = z.object({ locale: z.enum(LOCALE_VALUES), extra: z.string().transform(helper) });
