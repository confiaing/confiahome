import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { HomePlaceholder } from "@/components/sections/home-placeholder";

// app-shell · Pruebas ejecutables en los tres niveles (L0-3)
describe("página mínima", () => {
  it("muestra un único título principal en cada idioma", () => {
    const { unmount } = render(<HomePlaceholder locale="es" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Sitio en construcción.")).toBeInTheDocument();
    unmount();

    render(<HomePlaceholder locale="en" />);
    expect(screen.getByText("Site under construction.")).toBeInTheDocument();
  });

  // design.md D6: la página provisional es la superficie de prueba de la marca.
  it.each([
    ["es", "Escribir a hola@confia.ing"],
    ["en", "Write to hola@confia.ing"],
  ] as const)("en %s muestra el logo y la acción de contacto", (locale, cta) => {
    render(<HomePlaceholder locale={locale} />);
    expect(screen.getByRole("img", { name: "Confia.ing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: cta })).toHaveAttribute("href", "mailto:hola@confia.ing");
  });

  it("no tiene infracciones de accesibilidad", async () => {
    const { container } = render(<HomePlaceholder locale="es" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
