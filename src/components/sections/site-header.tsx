import { AgendaLink } from "@/components/ui/agenda-link";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { Logo } from "@/components/ui/logo";
import { NavDisclosure } from "@/components/ui/nav-disclosure";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { pathFor } from "@/i18n/routes";

const NAV_LINK =
  "border-b border-border py-3 font-display text-2xl text-text no-underline " +
  "nav:border-b-[1.5px] nav:border-transparent nav:px-0.5 nav:py-2 nav:font-body nav:text-[0.98rem] nav:font-medium nav:hover:border-primary";

type SiteHeaderProps = { locale: Locale; dictionary: Dictionary };

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const home = pathFor(locale, "home");
  return (
    <header data-site-header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex min-h-(--header-h) w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-5 px-(--gutter)">
        <a href={home} className="text-2xl text-text no-underline">
          <Logo label={dictionary.nav.home} />
        </a>
        <NavDisclosure menuLabel={dictionary.nav.menu} navLabel={dictionary.nav.label}>
          {/* Las secciones viven en la home: el ancla lleva la ruta para valer desde cualquier página. */}
          <a className={NAV_LINK} href={`${home}#donde-empezamos`}>
            {dictionary.nav.whereWeStart}
          </a>
          <a className={NAV_LINK} href={`${home}#como`}>
            {dictionary.nav.how}
          </a>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 nav:gap-7 nav:pt-0">
            <LanguageSwitch locale={locale} label={dictionary.language.label} />
            <AgendaLink labels={dictionary.agenda} size="sm" />
          </div>
        </NavDisclosure>
      </div>
    </header>
  );
}
