import { ButtonLink } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

// Contenido provisional de la home. Las secciones reales llegan en el lote L3.
export function HomePlaceholder({ copy }: { copy: Dictionary["placeholder"] }) {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-start justify-center gap-6 px-(--gutter) py-16 focus-visible:outline-none"
    >
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
