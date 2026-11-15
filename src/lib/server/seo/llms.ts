import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/locales";
import { CONTACT_EMAIL } from "@/lib/contact";
import { stripEmphasis } from "@/lib/emphasis";
import { SITE_NAME } from "./metadata";
import { serviceName } from "./structured-data";

function section(locale: Locale, site: string): string[] {
  const dictionary = getDictionary(locale);
  const { hero, offer, journey, actions } = dictionary.home;
  const home = `${site}/${locale}`;
  return [
    `## ${LOCALE_NAMES[locale]}`,
    "",
    hero.lede,
    "",
    `### ${offer.title}`,
    "",
    ...[offer.main, ...offer.rest].map((item) => `- ${serviceName(item.title)}: ${item.text}`),
    "",
    `### ${journey.eyebrow}`,
    "",
    ...journey.stages.map((stage, index) => `${index + 1}. ${stage.name}. ${stage.does} ${journey.labels.gets}: ${stage.gets}`),
    "",
    `### ${dictionary.footer.emailLabel}`,
    "",
    `- [${actions.schedule}](${home}#agenda): ${actions.note}`,
    `- [${actions.inquire}](${home}#consulta)`,
    `- ${CONTACT_EMAIL}`,
    `- [${stripEmphasis(dictionary.meta.homeTitle)}](${home})`,
    "",
  ];
}

/**
 * Resumen del sitio en Markdown para asistentes de IA (convención llms.txt): quién es
 * Confia.ing, qué ofrece, cómo trabaja y cómo contactar. Se compone solo con textos de
 * la página, así que no puede decir nada que la página no diga.
 */
export function llmsText(siteUrl: string): string {
  const site = siteUrl.replace(/\/+$/, "");
  const summaries = LOCALES.flatMap((locale) => [`> ${getDictionary(locale).meta.homeDescription}`, ""]);
  return [`# ${SITE_NAME}`, "", ...summaries, ...LOCALES.flatMap((locale) => section(locale, site))].join("\n");
}
