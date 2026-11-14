import type { Locale } from "@/i18n/locales";

// Marcador del lote L0. El contenido real y los diccionarios llegan en L2 y L3.
const COPY: Record<Locale, { title: string; note: string }> = {
  es: { title: "Confia.ing", note: "Sitio en construcción." },
  en: { title: "Confia.ing", note: "Site under construction." },
};

export function HomePlaceholder({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  return (
    <main>
      <h1>{copy.title}</h1>
      <p>{copy.note}</p>
    </main>
  );
}
