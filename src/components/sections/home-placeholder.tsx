import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import type { Locale } from "@/i18n/locales";

// Página provisional. Desde el lote L1 sirve además de superficie de prueba para
// tokens, tipografías, logo y botón. Sus textos son provisionales y propios de este
// archivo: los diccionarios llegan en L2 y las secciones reales en L3.
const COPY: Record<Locale, { eyebrow: string; title: string; note: string; cta: string }> = {
  es: {
    eyebrow: "Próximamente",
    title: "Sitio en construcción.",
    note: "Mientras tanto, puedes escribirnos.",
    cta: "Escribir a hola@confia.ing",
  },
  en: {
    eyebrow: "Coming soon",
    title: "Site under construction.",
    note: "In the meantime, you can write to us.",
    cta: "Write to hola@confia.ing",
  },
};

export function HomePlaceholder({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-(--gutter) py-16">
      <Logo label="Confia.ing" className="text-[1.75rem]" />
      <p data-eyebrow className="font-mono text-[0.8125rem] tracking-[0.08em] text-text-muted uppercase">
        {copy.eyebrow}
      </p>
      <h1 className="font-display text-[clamp(2.4rem,7vw,4.25rem)] leading-[1.04] font-medium tracking-[-0.022em] text-balance [font-variation-settings:'opsz'_144]">
        {copy.title}
      </h1>
      <p className="text-text-muted">{copy.note}</p>
      <ButtonLink href="mailto:hola@confia.ing">{copy.cta}</ButtonLink>
    </main>
  );
}
