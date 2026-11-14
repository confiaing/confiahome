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

  it("no tiene infracciones de accesibilidad", async () => {
    const { container } = render(<HomePlaceholder locale="es" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
