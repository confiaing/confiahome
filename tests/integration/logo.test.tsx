import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Logo } from "@/components/ui/logo";

// brand-identity · Logo con el concepto elegido (L1-4, L1-8)
describe("Logo", () => {
  it("muestra cinco tramos, el último de acento, y el punto", () => {
    const { container } = render(<Logo label="Confia.ing" />);
    const segments = [...container.querySelectorAll("[data-segment]")];
    expect(segments).toHaveLength(5);
    expect(segments.filter((segment) => segment.getAttribute("class")?.includes("stroke-primary"))).toEqual([segments[4]]);
    expect(container.querySelectorAll("[data-dot]")).toHaveLength(1);
    expect(container.querySelector("[data-dot]")?.getAttribute("class")).toContain("fill-primary");
  });

  it("muestra el nombre con «IA» y el punto resaltados, e «ing» en cursiva", () => {
    const { container } = render(<Logo label="Confia.ing" />);
    const wordmark = container.querySelector("[data-wordmark]")!;
    expect(wordmark).toHaveTextContent("confIA.ing");
    const ia = screen.getByText("IA");
    expect(ia.className).toContain("text-emphasis");
    expect(ia.className).toContain("font-body");
    // Como en el concepto elegido: el punto va recto y de acento; solo «ing» en cursiva.
    expect(screen.getByText("ing").tagName).toBe("EM");
    expect(screen.getByText(".").className).toContain("text-emphasis");
  });

  it("en la variante de símbolo no muestra el nombre", () => {
    const { container } = render(<Logo label="Confia.ing" variant="symbol" />);
    expect(container.querySelector("[data-wordmark]")).toBeNull();
    expect(container.querySelectorAll("[data-segment]")).toHaveLength(5);
  });

  it("expone un único nombre accesible y oculta sus partes", () => {
    const { container } = render(<Logo label="Confia.ing, inicio" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Confia.ing, inicio" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-wordmark]")).toHaveAttribute("aria-hidden", "true");
  });

  it("no lleva colores propios: solo roles y currentColor", () => {
    const { container } = render(<Logo label="Confia.ing" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl/i);
    expect(container.querySelector("[style]")).toBeNull();
  });

  it("dentro de un enlace no tiene infracciones", async () => {
    const { container } = render(<a href="/es"><Logo label="Confia.ing, inicio" /></a>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
