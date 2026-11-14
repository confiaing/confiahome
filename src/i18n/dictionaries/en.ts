import type { Dictionary } from "./types.ts";

// English dictionary. Must match es.ts key for key: `typecheck` fails otherwise.
export const en: Dictionary = {
  meta: {
    homeTitle: "Confia.ing · AI transformation for SMEs",
  },
  skipLink: "Skip to content",
  nav: {
    label: "Main",
    home: "Confia.ing, home",
    whereWeStart: "Where we start",
    how: "How we make it real",
    menu: "Menu",
  },
  language: {
    label: "Language",
  },
  agenda: {
    cta: "Book 30 minutes",
    newTab: "opens in a new tab",
  },
  footer: {
    legalLabel: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    emailLabel: "Write to us",
  },
  legal: {
    privacyTitle: "Privacy policy",
    termsTitle: "Terms and conditions",
    draft: "This text is a draft pending legal review. It is not yet the version in force.",
    contact: "If you have questions, write to us at",
  },
  notFound: {
    title: "We couldn't find this page",
    body: "The link may be broken, or the page may no longer exist.",
    cta: "Back to home",
  },
  placeholder: {
    eyebrow: "Coming soon",
    title: "Site under construction.",
    note: "In the meantime, you can write to us.",
    cta: "Write to hola@confia.ing",
  },
};
