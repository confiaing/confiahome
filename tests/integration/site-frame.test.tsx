import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LegalPlaceholder } from "@/components/sections/legal-placeholder";
import { NotFoundContent } from "@/components/sections/not-found-content";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { SkipLink } from "@/components/sections/skip-link";
import { AgendaLink } from "@/components/ui/agenda-link";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { NavDisclosure } from "@/components/ui/nav-disclosure";
import { getDictionary } from "@/i18n/dictionaries";

const es = getDictionary("es");
const en = getDictionary("en");

// locale-routing · Cambio manual de idioma (L2-2)
describe("LanguageSwitch", () => {
  it("señala el idioma activo y ofrece el otro como enlace", () => {
    render(<LanguageSwitch locale="es" label={es.language.label} />);
    const group = screen.getByRole("group", { name: "Idioma" });

    const current = within(group).getByText("ES").closest("[aria-current]")!;
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current.tagName).not.toBe("A");

    const other = within(group).getByRole("link", { name: /EN\s*English/ });
    expect(other).toHaveAttribute("href", "/api/locale?to=en");
    expect(other).toHaveAttribute("hreflang", "en");
    expect(other).toHaveAttribute("lang", "en");
    expect(other).toHaveAttribute("rel", "nofollow");
    expect(within(group).getAllByRole("link")).toHaveLength(1);
  });

  it("en inglés el enlace es el español, anunciado en español", async () => {
    const { container } = render(<LanguageSwitch locale="en" label={en.language.label} />);
    const other = screen.getByRole("link", { name: /ES\s*Español/ });
    expect(other).toHaveAttribute("href", "/api/locale?to=es");
    expect(other).toHaveAttribute("lang", "es");
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

// site-navigation · La acción de agenda funciona sin JavaScript (L2-4)
describe("AgendaLink", () => {
  it.each([
    [es, /^Agenda 30 minutos\s*\(se abre en una pestaña nueva\)$/],
    [en, /^Book 30 minutes\s*\(opens in a new tab\)$/],
  ] as const)("es un enlace directo al calendario, en otra pestaña y con aviso", async (dictionary, name) => {
    const { container } = render(<AgendaLink labels={dictionary.agenda} />);
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", "https://calendly.com/confiaing/30min");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("data-agenda");
    expect(link.textContent).not.toMatch(/diagn[oó]s/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// site-navigation · Menú desplegable en pantallas estrechas (L2-4)
describe("NavDisclosure", () => {
  const setup = () => {
    const user = userEvent.setup();
    render(
      <NavDisclosure menuLabel="Menú" navLabel="Principal">
        <a href="/es#como">Cómo lo hacemos realidad</a>
        <span>No es un enlace</span>
      </NavDisclosure>,
    );
    const button = screen.getByRole("button", { name: "Menú" });
    const nav = screen.getByRole("navigation", { name: "Principal", hidden: true });
    return { user, button, nav };
  };

  it("el botón expone su estado y señala la navegación", async () => {
    const { user, button, nav } = setup();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", nav.id);
    expect(nav).toHaveAttribute("data-open", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(nav).toHaveAttribute("data-open", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("se abre con Enter y con Espacio", async () => {
    const { user, button } = setup();
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("Escape lo cierra y devuelve el foco al botón", async () => {
    const { user, button } = setup();
    await user.click(button);
    screen.getByRole("link", { name: "Cómo lo hacemos realidad", hidden: true }).focus();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("Escape con el menú cerrado no mueve el foco", async () => {
    const { user, button } = setup();
    await user.keyboard("{Escape}");
    expect(button).not.toHaveFocus();
  });

  it("si el foco sale hacia el resto de la página, se cierra", async () => {
    const user = userEvent.setup();
    render(
      <>
        <NavDisclosure menuLabel="Menú" navLabel="Principal">
          <a href="/es#como">Cómo lo hacemos realidad</a>
        </NavDisclosure>
        <a href="/es">Fuera del menú</a>
      </>,
    );
    const button = screen.getByRole("button", { name: "Menú" });
    await user.click(button);
    await user.tab();
    expect(screen.getByRole("link", { name: "Cómo lo hacemos realidad", hidden: true })).toHaveFocus();
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    expect(screen.getByRole("link", { name: "Fuera del menú" })).toHaveFocus();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("elegir un enlace lo cierra; pulsar otra cosa, no", async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(screen.getByText("No es un enlace"));
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("link", { name: "Cómo lo hacemos realidad", hidden: true }));
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

// site-navigation · Enlace de salto y cabecera (L2-4)
describe("SkipLink y SiteHeader", () => {
  it("el enlace de salto lleva al contenido principal", () => {
    render(<SkipLink label={es.skipLink} />);
    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#contenido");
  });

  it.each([
    ["es", es, "Dónde empezamos", "Cómo lo hacemos realidad", /Agenda 30 minutos/],
    ["en", en, "Where we start", "How we make it real", /Book 30 minutes/],
  ] as const)("cabecera en %s: logo, anclas a la home, idioma y agenda", async (locale, dictionary, first, second, agenda) => {
    const { container } = render(<SiteHeader locale={locale} dictionary={dictionary} />);
    const banner = screen.getByRole("banner");

    expect(within(banner).getByRole("link", { name: dictionary.nav.home })).toHaveAttribute("href", `/${locale}`);
    const nav = within(banner).getByRole("navigation", { name: dictionary.nav.label, hidden: true });
    // Absolutas: funcionan igual desde una página legal que desde la home.
    expect(within(nav).getByRole("link", { name: first, hidden: true })).toHaveAttribute("href", `/${locale}#donde-empezamos`);
    expect(within(nav).getByRole("link", { name: second, hidden: true })).toHaveAttribute("href", `/${locale}#como`);
    expect(within(nav).getByRole("link", { name: agenda, hidden: true })).toHaveAttribute("data-agenda");
    expect(within(nav).getByRole("group", { name: dictionary.language.label, hidden: true })).toBeInTheDocument();
    expect(within(banner).getByRole("button", { name: dictionary.nav.menu })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

// site-navigation · Pie con contacto, legales e idioma (L2-5)
describe("SiteFooter", () => {
  it.each([
    ["en", en, "/en/privacy", "/en/terms", "Privacy", "Terms"],
    ["es", es, "/es/privacidad", "/es/terminos", "Privacidad", "Términos"],
  ] as const)("pie en %s: correo, legales del idioma, selector y derechos", async (locale, dictionary, privacy, terms, privacyText, termsText) => {
    const { container } = render(<SiteFooter locale={locale} dictionary={dictionary} year={2026} />);
    const footer = screen.getByRole("contentinfo");

    const mail = within(footer).getByRole("link", { name: /hola@confia\.ing/ });
    expect(mail).toHaveAttribute("href", "mailto:hola@confia.ing");
    expect(mail).toHaveTextContent("hola@confia.ing");
    expect(within(footer).getByRole("link", { name: privacyText })).toHaveAttribute("href", privacy);
    expect(within(footer).getByRole("link", { name: termsText })).toHaveAttribute("href", terms);
    expect(within(footer).getByRole("group", { name: dictionary.language.label })).toBeInTheDocument();
    expect(within(footer).getByText("© 2026 Confia.ing")).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: dictionary.nav.home })).toHaveAttribute("href", `/${locale}`);
    expect(footer.className).toContain("theme-dark");
    expect(await axe(container)).toHaveNoViolations();
  });
});

// legal-pages · Aviso de borrador (L2-7)
describe("LegalPlaceholder", () => {
  it.each([
    [es, "Política de privacidad", /borrador pendiente de revisión legal/],
    [en, "Privacy policy", /draft pending legal review/],
  ] as const)("muestra título, aviso de borrador y contacto", async (dictionary, title, draft) => {
    const { container } = render(<LegalPlaceholder title={dictionary.legal.privacyTitle} labels={dictionary.legal} />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "contenido");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(draft)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hola@confia.ing" })).toHaveAttribute("href", "mailto:hola@confia.ing");
    expect(await axe(container)).toHaveNoViolations();
  });
});

// not-found-page · 404 bilingüe (L2-6)
describe("NotFoundContent", () => {
  it("tiene un solo título principal y el mensaje en cada idioma, marcado, con enlace a su home", async () => {
    const { container } = render(<NotFoundContent />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const spanish = screen.getByRole("heading", { level: 2, name: es.notFound.title }).closest("section")!;
    const english = screen.getByRole("heading", { level: 2, name: en.notFound.title }).closest("section")!;
    expect(spanish).toHaveAttribute("lang", "es");
    expect(english).toHaveAttribute("lang", "en");
    expect(within(spanish).getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/es");
    expect(within(english).getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    expect(await axe(container)).toHaveNoViolations();
  });
});
