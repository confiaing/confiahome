import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { WebAnalytics } from "@/components/analytics/web-analytics";
import { NotFoundContent } from "@/components/sections/not-found-content";
import { Logo } from "@/components/ui/logo";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { publicEnv } from "@/lib/public-env";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

// Única página 404 del sitio. Next.js solo entrega una 404 completa en el HTML desde
// aquí: la de un layout bajo [locale] llega vacía y se pinta con JavaScript. Esta página
// es estática y no conoce la ruta pedida, así que muestra el mensaje en los dos idiomas.
export const metadata: Metadata = { title: "404 · Confia.ing" };

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE} className={fontVariables}>
      <body>
        <header className="border-b border-border">
          <div className="mx-auto flex min-h-(--header-h) w-full max-w-[1320px] items-center px-(--gutter)">
            {/* "/" elige el idioma del visitante. */}
            <a href="/" className="text-2xl text-text no-underline">
              <Logo label="Confia.ing" />
            </a>
          </div>
        </header>
        <NotFoundContent />
        {/* Una 404 también cuenta como vista: sirve para encontrar enlaces rotos. */}
        <AnalyticsTracker />
        <WebAnalytics token={publicEnv.analyticsToken} />
      </body>
    </html>
  );
}
