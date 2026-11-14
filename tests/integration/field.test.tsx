import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";

// ui-components · Campo de formulario (L1-5)
describe("Field", () => {
  it("asocia la etiqueta y la ayuda con el control", () => {
    render(<Field label="Correo o teléfono" name="contact" hint="Para poder responderte." />);
    const input = screen.getByLabelText("Correo o teléfono");
    expect(input).toHaveAttribute("name", "contact");
    expect(input).toHaveAccessibleDescription("Para poder responderte.");
  });

  it("con error: aria-invalid y mensaje asociado por aria-describedby", () => {
    render(<Field label="Nombre" name="name" hint="Como quieras que te llamemos." error="Escribe tu nombre." />);
    const input = screen.getByLabelText("Nombre");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    const error = screen.getByText("Escribe tu nombre.");
    expect(ids).toContain(error.id);
    expect(input).toHaveAccessibleDescription("Como quieras que te llamemos. Escribe tu nombre.");
  });

  it("sin error: ni aria-invalid ni mensaje", () => {
    render(<Field label="Empresa" name="company" />);
    const input = screen.getByLabelText("Empresa");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("obligatorio: el control está marcado como requerido", () => {
    render(<Field label="Nombre" name="name" required />);
    expect(screen.getByLabelText(/Nombre/)).toBeRequired();
  });

  it("de texto largo: es un área de texto", () => {
    render(<Field label="Mensaje" name="message" multiline />);
    expect(screen.getByLabelText("Mensaje").tagName).toBe("TEXTAREA");
  });

  it("con éxito: el mensaje forma parte de la descripción; si hay error, se ignora", () => {
    const { unmount } = render(<Field label="Correo" name="email" success="Se ve bien." />);
    expect(screen.getByLabelText("Correo")).toHaveAccessibleDescription("Se ve bien.");
    unmount();

    render(<Field label="Correo" name="email" success="Se ve bien." error="Revisa el correo." />);
    expect(screen.getByLabelText("Correo")).toHaveAccessibleDescription("Revisa el correo.");
    expect(screen.queryByText("Se ve bien.")).not.toBeInTheDocument();
  });

  it("respeta el id y la descripción que recibe", () => {
    render(
      <>
        <p id="extra">Solo para uso interno.</p>
        <Field label="Nombre" name="name" id="nombre" aria-describedby="extra" error="Escribe tu nombre." />
      </>,
    );
    const input = screen.getByLabelText("Nombre");
    expect(input).toHaveAttribute("id", "nombre");
    expect(input).toHaveAccessibleDescription("Solo para uso interno. Escribe tu nombre.");
  });

  it("dos campos no comparten identificador", () => {
    render(<><Field label="Nombre" name="name" /><Field label="Empresa" name="company" /></>);
    expect(screen.getByLabelText("Nombre").id).not.toBe(screen.getByLabelText("Empresa").id);
  });

  it("sin infracciones en reposo, con error, deshabilitado y con éxito", async () => {
    const { container } = render(
      <form>
        <Field label="Nombre" name="name" required />
        <Field label="Correo" name="email" error="Revisa el correo." />
        <Field label="Empresa" name="company" disabled />
        <Field label="Mensaje" name="message" multiline success="Se ve bien." />
      </form>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// ui-components · Casilla
describe("Checkbox", () => {
  it("se marca con Espacio y admite enlaces en la etiqueta", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox name="consent">
        Acepto la <a href="/es/privacidad">política de privacidad</a>
      </Checkbox>,
    );
    const box = screen.getByRole("checkbox", { name: /Acepto la política de privacidad/ });
    await user.tab();
    expect(box).toHaveFocus();
    await user.keyboard(" ");
    expect(box).toBeChecked();
    expect(screen.getByRole("link", { name: "política de privacidad" })).toBeInTheDocument();
  });

  it("respeta el id que recibe y conserva la etiqueta asociada", () => {
    render(<Checkbox name="consent" id="consentimiento">Acepto</Checkbox>);
    expect(screen.getByLabelText("Acepto")).toHaveAttribute("id", "consentimiento");
  });

  it("sin infracciones en reposo y deshabilitada", async () => {
    const { container } = render(
      <>
        <Checkbox name="a">Acepto</Checkbox>
        <Checkbox name="b" disabled>No disponible</Checkbox>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("con error: aria-invalid y mensaje asociado", async () => {
    const { container } = render(<Checkbox name="consent" error="Necesitamos tu consentimiento.">Acepto</Checkbox>);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription("Necesitamos tu consentimiento.");
    expect(await axe(container)).toHaveNoViolations();
  });
});
