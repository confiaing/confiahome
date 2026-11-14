import { ButtonLink } from "@/components/ui/button";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES } from "@/i18n/locales";
import { pathFor } from "@/i18n/routes";

/**
 * Contenido de la página 404: el mismo mensaje en cada idioma, marcado con su `lang`,
 * y un enlace a la home de ese idioma. Es bilingüe porque la página no sabe qué ruta
 * se pidió (src/app/global-not-found.tsx).
 */
export function NotFoundContent() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-12 px-(--gutter) py-16 focus-visible:outline-none"
    >
      <h1 className="font-mono text-[0.8125rem] font-normal tracking-[0.08em] text-text-muted">404</h1>
      {LOCALES.map((locale) => {
        const copy = getDictionary(locale).notFound;
        return (
          <section key={locale} lang={locale} className="flex flex-col items-start gap-5">
            <h2 className="font-display text-[clamp(2rem,6vw,3.25rem)] leading-[1.06] font-medium tracking-[-0.022em] text-balance [font-variation-settings:'opsz'_144]">
              {copy.title}
            </h2>
            <p className="text-text-muted">{copy.body}</p>
            <ButtonLink href={pathFor(locale, "home")}>{copy.cta}</ButtonLink>
          </section>
        );
      })}
    </main>
  );
}
