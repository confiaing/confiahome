import { Notice } from "@/components/ui/notice";
import { TextLink } from "@/components/ui/text-link";
import type { Dictionary } from "@/i18n/dictionaries";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

type LegalPlaceholderProps = { title: string; labels: Dictionary["legal"] };

/** Página legal provisional: título y aviso de borrador. El texto llega en el lote L8. */
export function LegalPlaceholder({ title, labels }: LegalPlaceholderProps) {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col gap-8 px-(--gutter) py-16 focus-visible:outline-none"
    >
      <h1 className="font-display text-[clamp(2.2rem,6vw,3.5rem)] leading-[1.06] font-medium tracking-[-0.022em] text-balance [font-variation-settings:'opsz'_144]">
        {title}
      </h1>
      <Notice tone="info" live={false}>
        <p>{labels.draft}</p>
        <p className="mt-2 font-normal">
          {labels.contact} <TextLink href={CONTACT_MAILTO}>{CONTACT_EMAIL}</TextLink>.
        </p>
      </Notice>
    </main>
  );
}
