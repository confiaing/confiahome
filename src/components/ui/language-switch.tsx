import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/locales";
import { cx } from "@/lib/cx";

type LanguageSwitchProps = {
  /** Idioma de la página actual. */
  locale: Locale;
  /** Nombre accesible del grupo, en el idioma de la página. */
  label: string;
  className?: string;
};

const PILL =
  "inline-flex min-h-[34px] min-w-10 items-center justify-center rounded-full px-2 font-mono text-[0.8125rem] tracking-[0.06em] no-underline";

/**
 * Selector ES/EN. El idioma activo es texto; el otro, un enlace al punto del servidor
 * que guarda la preferencia y lleva a la página equivalente (ADR-0012). Sin JavaScript.
 */
export function LanguageSwitch({ locale, label, className }: LanguageSwitchProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("inline-flex items-center gap-0.5 rounded-full border-[1.5px] border-border-strong p-[3px]", className)}
    >
      {LOCALES.map((option) => {
        // Cada opción se anuncia en su propio idioma: «English», no «Inglés».
        const content = (
          <>
            {option.toUpperCase()}
            <span className="sr-only"> {LOCALE_NAMES[option]}</span>
          </>
        );
        return option === locale ? (
          <span key={option} aria-current="true" lang={option} className={cx(PILL, "bg-text text-background")}>
            {content}
          </span>
        ) : (
          <a
            key={option}
            href={`/api/locale?to=${option}`}
            hrefLang={option}
            lang={option}
            rel="nofollow"
            data-locale-switch=""
            className={cx(PILL, "text-text hover:bg-surface-strong")}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}
