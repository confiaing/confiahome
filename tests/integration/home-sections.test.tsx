import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Closing } from "@/components/sections/closing";
import { ContactActions } from "@/components/sections/contact-actions";
import { Hero } from "@/components/sections/hero";
import { HomeContent } from "@/components/sections/home-content";
import { JourneyOverview } from "@/components/sections/journey-overview";
import { Offer } from "@/components/sections/offer";
import { Trust } from "@/components/sections/trust";
import { WhereWeStart } from "@/components/sections/where-we-start";
import { Emphasized } from "@/components/ui/emphasized";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDictionary } from "@/i18n/dictionaries";
import { stripEmphasis } from "@/lib/emphasis";
import { findViolations } from "../support/claims";

const LOCALES = ["es", "en"] as const;
const CALENDLY = "https://calendly.com/confiaing/30min";
const dict = (locale: "es" | "en") => getDictionary(locale);

// Piezas comunes
describe("Emphasized, SectionHeading y Section", () => {
  it("pinta en <em> solo el tramo marcado", () => {
    const { container } = render(<p><Emphasized text="hacemos *juntos*." /></p>);
    expect(container.querySelectorAll("em")).toHaveLength(1);
    expect(container.querySelector("em")).toHaveTextContent("juntos");
    expect(container).toHaveTextContent("hacemos juntos.");
  });

  it("el título de sección lleva su nivel, su id y el antetítulo delante", () => {
    render(<SectionHeading id="x-title" eyebrow="Dónde empezamos" title="Empezamos por el *trabajo*." />);
    const heading = screen.getByRole("heading", { level: 2, name: "Empezamos por el trabajo." });
    expect(heading).toHaveAttribute("id", "x-title");
    expect(screen.getByText("Dónde empezamos").compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("una sección es una región nombrada por su título; con tema, es una banda", () => {
    render(
      <>
        <Section id="a" labelledBy="a-title"><h2 id="a-title">Sobre crema</h2></Section>
        <Section labelledBy="b-title" theme="fresh"><h2 id="b-title">Banda</h2></Section>
      </>,
    );
    const plain = screen.getByRole("region", { name: "Sobre crema" });
    const band = screen.getByRole("region", { name: "Banda" });
    expect(plain).toHaveAttribute("id", "a");
    expect(plain).not.toHaveAttribute("data-band");
    expect(plain.className).not.toMatch(/theme-/);
    expect(band).toHaveAttribute("data-band", "fresh");
    expect(band.className).toContain("theme-fresh");
  });
});

describe.each(LOCALES)("home en %s", (locale) => {
  const dictionary = dict(locale);
  const home = dictionary.home;

  // home-page · Hero y Cierre: las dos vías de contacto
  it("las acciones son dos, distinguibles, con sus destinos", async () => {
    const { container } = render(<ContactActions actions={home.actions} agenda={dictionary.agenda} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    const [primary, secondary] = links as [HTMLElement, HTMLElement];
    // jsdom recorta el espacio previo al aviso oculto; los navegadores lo conservan.
    expect(primary).toHaveAccessibleName(new RegExp(`^${home.actions.schedule}\\s*\\(${dictionary.agenda.newTab}\\)$`));
    expect(primary).toHaveAttribute("href", CALENDLY);
    expect(primary).toHaveAttribute("data-agenda");
    expect(primary.className).toContain("bg-primary");
    expect(secondary).toHaveAccessibleName(home.actions.inquire);
    expect(secondary).toHaveAttribute("href", "#consulta");
    expect(secondary.className).toContain("border-text");
    expect(secondary.className).not.toContain("bg-primary");
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Hero con dos acciones distinguibles (L3-1)
  it("hero: un h1, texto, dos CTA, nota exploratoria y tres pilares", async () => {
    const { container } = render(<Hero home={home} agenda={dictionary.agenda} />);
    const region = screen.getByRole("region", { name: stripEmphasis(home.hero.title) });
    expect(within(region).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(region).getByText(home.hero.eyebrow)).toBeInTheDocument();
    expect(within(region).getByText(home.hero.lede)).toBeInTheDocument();
    expect(within(region).getAllByRole("link")).toHaveLength(2);

    const note = within(region).getByText(home.actions.note);
    expect(note.textContent).not.toMatch(/diagn[oó]stic|assessment/i);

    const pillars = within(region).getByRole("list", { name: home.hero.pillarsLabel });
    expect(within(pillars).getAllByRole("listitem").map((item) => item.textContent)).toEqual(home.hero.pillars);
    expect(container.querySelectorAll("em")).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Dónde empezamos (L3-2)
  it("dónde empezamos: cuatro fricciones y cuatro preguntas en listas ordenadas, en salvia y mantequilla", async () => {
    const { container } = render(<WhereWeStart start={home.start} />);
    const region = screen.getByRole("region", { name: home.start.title });
    expect(region).toHaveAttribute("id", "donde-empezamos");
    expect(region).toHaveAttribute("data-band", "fresh");

    const [frictions, questions] = within(region).getAllByRole("list") as [HTMLElement, HTMLElement];
    expect(frictions.tagName).toBe("OL");
    expect(questions.tagName).toBe("OL");
    expect(within(frictions).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(
      home.start.frictions.map((friction) => friction.title),
    );
    for (const friction of home.start.frictions) expect(within(frictions).getByText(friction.text)).toBeInTheDocument();
    expect(within(questions).getAllByRole("listitem").map((item) => item.textContent)).toEqual(home.start.questions);

    const card = within(region).getByRole("heading", { level: 3, name: home.start.questionsTitle }).closest("[class*='theme-']")!;
    expect(card.className).toContain("theme-warm");
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Las cinco etapas, legibles sin interacción (el detalle, en journey-tabs.test.tsx)
  it("cómo lo hacemos realidad: la sección contiene las cinco etapas completas", async () => {
    const { container } = render(<JourneyOverview journey={home.journey} />);
    const region = screen.getByRole("region", { name: stripEmphasis(home.journey.title) });
    expect(region).toHaveAttribute("id", "como");
    expect(region).not.toHaveAttribute("data-band");

    const stages = [...region.querySelectorAll("article")];
    expect(stages).toHaveLength(5);
    stages.forEach((stage, index) => {
      const copy = home.journey.stages[index]!;
      expect(stage.querySelector("h3")).toHaveTextContent(copy.name);
      expect(stage).toHaveTextContent(copy.tag);
      expect([...stage.querySelectorAll("dd")].map((definition) => definition.textContent)).toEqual([copy.does, copy.gets, copy.next]);
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Servicios con jerarquía (L3-3)
  it("lo que ofrecemos: el servicio principal en tarjeta propia y antes; los otros cuatro, en orden", async () => {
    const { container } = render(<Offer offer={home.offer} />);
    const region = screen.getByRole("region", { name: home.offer.title });
    expect(region).toHaveAttribute("data-band", "coral");

    const cards = within(region).getAllByRole("article");
    expect(cards).toHaveLength(5);
    const [main, ...rest] = cards as [HTMLElement, ...HTMLElement[]];
    expect(main).toHaveAttribute("data-offer", "main");
    expect(main.className).toContain("theme-dark");
    expect(within(main).getByRole("heading", { level: 3 })).toHaveTextContent(stripEmphasis(home.offer.main.title));
    expect(within(main).getByText(home.offer.main.text)).toBeInTheDocument();
    expect(rest.map((card) => within(card).getByRole("heading", { level: 3 }).textContent)).toEqual(
      home.offer.rest.map((service) => service.title),
    );
    for (const card of rest) expect(card.className).not.toContain("theme-dark");
    expect(main.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Credibilidad atribuida al equipo (L3-4, L3-5)
  it("por qué confiar: cuatro evidencias, nota de atribución después, principios y seguridad", async () => {
    const { container } = render(<Trust trust={home.trust} />);
    const region = screen.getByRole("region", { name: home.trust.title });
    expect(region).not.toHaveAttribute("data-band");

    const [evidence, principles] = within(region).getAllByRole("list") as [HTMLElement, HTMLElement];
    expect(within(evidence).getAllByRole("listitem").map((item) => item.textContent)).toEqual(home.trust.items);
    const note = within(region).getByText(home.trust.note);
    expect(evidence.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(principles).getAllByRole("listitem").map((item) => item.textContent)).toEqual(home.trust.principles);
    expect(within(region).getByRole("heading", { level: 3, name: home.trust.principlesTitle })).toBeInTheDocument();

    const security = within(region).getByText(home.trust.security, { exact: false });
    expect(security).toHaveTextContent(home.trust.securityLabel);
    expect(findViolations([["home.trust.security", security.textContent!]])).toEqual([]);
    expect(region.querySelectorAll("img")).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  // home-page · Cierre con las dos vías de contacto (L3-6)
  it("cierre: mismas acciones que el hero y los dos bloques de contacto", async () => {
    const { unmount } = render(<Hero home={home} agenda={dictionary.agenda} />);
    const heroLinks = screen.getAllByRole("link").map((link) => [link.getAttribute("href"), link.textContent]);
    unmount();

    const view = render(<Closing home={home} agenda={dictionary.agenda} />);
    const region = screen.getByRole("region", { name: stripEmphasis(home.closing.title) });
    expect(region).toHaveAttribute("data-band", "calm");
    const actions = within(region).getAllByRole("link").slice(0, 2);
    expect(actions.map((link) => [link.getAttribute("href"), link.textContent])).toEqual(heroLinks);

    const inquiry = view.container.querySelector("#consulta") as HTMLElement;
    expect(within(inquiry).getByRole("heading", { level: 3, name: home.actions.inquire })).toBeInTheDocument();
    const mail = within(inquiry).getByRole("link", { name: "hola@confia.ing" });
    expect(mail).toHaveAttribute("href", "mailto:hola@confia.ing");

    const agenda = view.container.querySelector("#agenda") as HTMLElement;
    expect(within(agenda).getByRole("heading", { level: 3, name: home.actions.schedule })).toBeInTheDocument();
    expect(within(agenda).getByText(home.actions.note)).toBeInTheDocument();
    const direct = within(agenda).getByRole("link");
    expect(direct).toHaveAttribute("href", CALENDLY);
    expect(direct).toHaveAccessibleName(new RegExp(dictionary.agenda.newTab));
    expect(await axe(view.container)).toHaveNoViolations();
  });

  // home-page · Secciones de la home y su orden
  it("la página: seis regiones en orden, un h1 y sin saltos de nivel", async () => {
    const { container } = render(<HomeContent dictionary={dictionary} />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "contenido");

    const names = [...main.querySelectorAll(":scope > section")].map(
      (section) => document.getElementById(section.getAttribute("aria-labelledby")!)!.textContent,
    );
    expect(names).toEqual(
      [home.hero.title, home.start.title, home.journey.title, home.offer.title, home.trust.title, home.closing.title].map(
        stripEmphasis,
      ),
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const levels = [...main.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((heading) => Number(heading.tagName[1]));
    levels.reduce((previous, level) => {
      expect(level - previous).toBeLessThanOrEqual(1);
      return level;
    }, 0);
    expect(new Set([...main.querySelectorAll("[id]")].map((element) => element.id)).size).toBe(main.querySelectorAll("[id]").length);
    expect(await axe(container)).toHaveNoViolations();
  });
});
