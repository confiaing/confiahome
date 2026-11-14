import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button, ButtonLink } from "@/components/ui/button";

// ui-components · Botón con variantes y estados (L1-5)
describe("Button", () => {
  it("se activa una vez con Enter y una vez con Espacio", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Enviar</Button>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("deshabilitado no dispara su acción ni con ratón ni con teclado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={onClick}>Enviar</Button>);

    const button = screen.getByRole("button", { name: "Enviar" });
    await user.click(button);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("no envía formularios salvo que se pida", () => {
    render(<Button>Enviar</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("la variante primaria toma su color del rol, sin estilos propios", () => {
    render(
      <div className="theme-dark">
        <Button>Agendar</Button>
      </div>,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-on-primary");
    expect(button).not.toHaveAttribute("style");
  });

  it("la variante secundaria y el tamaño reducido cambian las clases", () => {
    render(<Button variant="secondary" size="sm">Consulta</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-text");
    expect(button.className).toContain("min-h-11");
    expect(button.className).not.toContain("bg-primary");
  });

  it.each(["primary", "secondary"] as const)("variante %s sin infracciones, también deshabilitada", async (variant) => {
    const { container } = render(
      <>
        <Button variant={variant}>Agendar</Button>
        <Button variant={variant} disabled>Enviar</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ButtonLink", () => {
  it("es un enlace con su destino, no un botón", () => {
    render(<ButtonLink href="/es#contacto">Enviar una consulta</ButtonLink>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Enviar una consulta" });
    expect(link).toHaveAttribute("href", "/es#contacto");
    expect(link.className).toContain("bg-primary");
  });
});
