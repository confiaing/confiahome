import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LegalDocumentPage } from "@/components/sections/legal-document";
import { getDictionary } from "@/i18n/dictionaries";
import { getLegalDocument } from "@/i18n/legal";

const NONE = { name: null, id: null, address: null };
const setup = (locale: "es" | "en", kind: "privacy" | "terms", options: { draft?: boolean; entity?: typeof NONE | { name: string; id: string; address: string } } = {}) => {
  const labels = getDictionary(locale).legal;
  const document = getLegalDocument(locale, kind);
  const view = render(<LegalDocumentPage document={document} labels={labels} draft={options.draft ?? true} entity={options.entity ?? NONE} />);
  return { labels, document, view };
};

// legal-pages · Secciones presentes; Aviso de borrador; Páginas accesibles (L8-1, L8-2)
describe.each(["es", "en"] as const)("página legal en %s", (locale) => {
  it.each(["privacy", "terms"] as const)("%s: un título, un encabezado por sección y el aviso de borrador antes del texto", async (kind) => {
    const { labels, document, view } = setup(locale, kind);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "contenido");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: document.title })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(document.sections.map((section) => section.heading));
    for (const section of document.sections) expect(view.container.querySelector(`#${section.id}`)).not.toBeNull();

    const notice = screen.getByText(labels.draft);
    const firstSection = screen.getAllByRole("heading", { level: 2 })[0]!;
    expect(notice.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // La versión que queda registrada con cada consulta se puede leer en la página.
    expect(main).toHaveTextContent(`${document.updated} · ${labels.version} ${document.version}`);
    expect(await axe(view.container)).toHaveNoViolations();
  });

  it("el correo de contacto es un enlace allí donde el texto lo nombra, y no queda ninguna marca sin resolver", () => {
    const { view } = setup(locale, "privacy");
    const links = within(view.container).getAllByRole("link", { name: "hola@confia.ing" });
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) expect(link).toHaveAttribute("href", "mailto:hola@confia.ing");
    expect(view.container.textContent).not.toMatch(/[{}]/);
  });

  it("las listas son listas", () => {
    const { document, view } = setup(locale, "privacy");
    const expected = document.sections.flatMap((section) => section.blocks).filter((block) => "list" in block).length;
    expect(view.container.querySelectorAll("main ul")).toHaveLength(expected);
  });

  // legal-pages · Datos pendientes a la vista, nunca inventados
  it("sin datos del responsable, cada uno se muestra como pendiente y se distingue del texto", () => {
    const { labels, view } = setup(locale, "privacy");
    const pending = [...view.container.querySelectorAll("[data-pending]")].map((mark) => mark.textContent);
    expect(pending).toEqual([labels.pending.name, labels.pending.id, labels.pending.address]);
    for (const mark of view.container.querySelectorAll("[data-pending]")) expect(mark.tagName).toBe("MARK");
  });

  it("con los datos del responsable, se muestran y no queda nada pendiente", () => {
    const { view } = setup(locale, "privacy", { entity: { name: "Empresa de Prueba S.A.S.", id: "NIT de prueba", address: "Dirección de prueba" } });
    expect(view.container.querySelector("[data-pending]")).toBeNull();
    expect(view.container.textContent).toContain("Empresa de Prueba S.A.S.");
    expect(view.container.textContent).toContain("Dirección de prueba");
  });

  // legal-pages · Un solo interruptor
  it("vigente, no muestra el aviso de borrador", () => {
    const { labels } = setup(locale, "terms", { draft: false });
    expect(screen.queryByText(labels.draft)).toBeNull();
  });
});
