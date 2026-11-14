import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

// ui-components · Tarjeta
describe("Card", () => {
  it("sin tema propio hereda el del contenedor", () => {
    render(<Card data-testid="card">Contenido</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).not.toMatch(/theme-/);
    expect(card.className).toContain("bg-surface");
  });

  it("con tema propio lleva su clase y usa el fondo de ese tema", () => {
    render(<Card theme="dark" as="section" data-testid="card">Contenido</Card>);
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("SECTION");
    expect(card.className).toContain("theme-dark");
    expect(card.className).not.toContain("bg-surface");
  });
});

describe("Card: accesibilidad", () => {
  it("sin infracciones, con y sin tema", async () => {
    const { container } = render(
      <>
        <Card>Contenido</Card>
        <Card theme="dark" as="section" aria-label="Destacado">Contenido</Card>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// ui-components · Aviso
describe("Notice", () => {
  it("de error tiene role=alert", () => {
    render(<Notice tone="error">No pudimos enviar tu consulta.</Notice>);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos enviar tu consulta.");
  });

  it.each(["success", "info"] as const)("de tipo %s tiene role=status", (tone) => {
    render(<Notice tone={tone}>Recibimos tu consulta.</Notice>);
    expect(screen.getByRole("status")).toHaveTextContent("Recibimos tu consulta.");
  });

  it("su icono es decorativo", () => {
    const { container } = render(<Notice tone="success">Recibimos tu consulta.</Notice>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["error", "success", "info"] as const)("tipo %s sin infracciones", async (tone) => {
    const { container } = render(<Notice tone={tone}>Texto del aviso.</Notice>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
