import { ModeSwitch } from "@/components/journey/scene/mode-switch";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { Logo } from "@/components/ui/logo";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { pathFor } from "@/i18n/routes";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

type SiteFooterProps = { locale: Locale; dictionary: Dictionary; year: number };

export function SiteFooter({ locale, dictionary, year }: SiteFooterProps) {
  return (
    <footer className="theme-dark pt-14 pb-9">
      <div className="mx-auto w-full max-w-[1320px] px-(--gutter)">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
          <a href={pathFor(locale, "home")} className="text-[2rem] text-text no-underline">
            <Logo label={dictionary.nav.home} />
          </a>
          <a
            href={CONTACT_MAILTO}
            className="font-display text-[clamp(1.3rem,3vw,1.9rem)] italic"
          >
            <span className="sr-only">{dictionary.footer.emailLabel}: </span>
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4.5 border-t border-border pt-6 text-[0.95rem]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <nav aria-label={dictionary.footer.legalLabel} className="flex flex-wrap gap-x-6 gap-y-2">
              <a href={pathFor(locale, "privacy")} className="py-2 text-text">
                {dictionary.footer.privacy}
              </a>
              <a href={pathFor(locale, "terms")} className="py-2 text-text">
                {dictionary.footer.terms}
              </a>
            </nav>
            <LanguageSwitch locale={locale} label={dictionary.language.label} />
          </div>
          {/* Solo la marca: sin razón social hasta que el fundador la defina (README, decisiones). */}
          <p className="text-text-muted">© {year} Confia.ing</p>
        </div>
        <ModeSwitch labels={dictionary.scene} />
      </div>
    </footer>
  );
}
