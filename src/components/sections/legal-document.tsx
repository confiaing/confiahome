import type { ReactNode } from "react";
import { Notice } from "@/components/ui/notice";
import { TextLink } from "@/components/ui/text-link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LegalDocument } from "@/i18n/legal";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

type Entity = { name: string | null; id: string | null; address: string | null };

type LegalDocumentPageProps = {
  document: LegalDocument;
  labels: Dictionary["legal"];
  /** Texto sin revisión legal: se avisa antes de leerlo. */
  draft: boolean;
  /** Quién trata los datos. Lo que falte se muestra como pendiente. */
  entity: Entity;
};

const MARK = /(\{[^}]+\})/;

/** Un texto con sus marcas resueltas: el correo como enlace, los datos del responsable o su «pendiente». */
function Text({ text, labels, entity }: { text: string; labels: Dictionary["legal"]; entity: Entity }): ReactNode {
  return text.split(MARK).map((part, index) => {
    if (part === "{email}") {
      return (
        <TextLink key={index} href={CONTACT_MAILTO}>
          {CONTACT_EMAIL}
        </TextLink>
      );
    }
    const field = /^\{entity:(name|id|address)\}$/.exec(part)?.[1] as keyof Entity | undefined;
    if (!field) return part;
    return entity[field] ? (
      entity[field]
    ) : (
      <mark key={index} data-pending className="rounded-[4px] bg-surface-warm px-1 font-semibold text-text">
        {labels.pending[field]}
      </mark>
    );
  });
}

/** Política de privacidad o términos: texto servido completo, legible sin JavaScript. */
export function LegalDocumentPage({ document, labels, draft, entity }: LegalDocumentPageProps) {
  const resolve = (text: string) => <Text text={text} labels={labels} entity={entity} />;
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-[44rem] px-(--gutter) py-16 focus-visible:outline-none">
      <h1 className="font-display text-[clamp(2.2rem,6vw,3.5rem)] leading-[1.06] font-medium tracking-[-0.022em] text-balance [font-variation-settings:'opsz'_144]">
        {document.title}
      </h1>
      <p className="mt-4 font-mono text-[0.85rem] text-text-muted">
        {document.updated} · {labels.version} {document.version}
      </p>

      {draft ? (
        <Notice tone="info" live={false} className="mt-8">
          <p>{labels.draft}</p>
          <p className="mt-2 font-normal">
            {labels.contact} <TextLink href={CONTACT_MAILTO}>{CONTACT_EMAIL}</TextLink>.
          </p>
        </Notice>
      ) : null}

      <div className="mt-10 space-y-4 text-[1.05rem] leading-relaxed">
        {document.intro.map((paragraph) => (
          <p key={paragraph}>{resolve(paragraph)}</p>
        ))}
      </div>

      {document.sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="mt-12">
          <h2 id={section.id} className="font-display text-[clamp(1.5rem,3vw,1.9rem)] leading-[1.15] font-medium tracking-[-0.015em]">
            {section.heading}
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed">
            {section.blocks.map((block, index) =>
              "p" in block ? (
                <p key={index}>{resolve(block.p)}</p>
              ) : (
                <ul key={index} className="list-disc space-y-2 pl-6">
                  {block.list.map((item) => (
                    <li key={item}>{resolve(item)}</li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
