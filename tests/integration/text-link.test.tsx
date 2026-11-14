import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TextLink } from "@/components/ui/text-link";

// ui-components · Enlace de texto
describe("TextLink", () => {
  it("está subrayado, para no depender solo del color", () => {
    render(<p>Lee la <TextLink href="/es/privacidad">política de privacidad</TextLink>.</p>);
    const link = screen.getByRole("link", { name: "política de privacidad" });
    expect(link.className).toContain("underline");
    expect(link).not.toHaveAttribute("target");
  });

  it("interno sin infracciones", async () => {
    const { container } = render(<p>Lee la <TextLink href="/es/privacidad">política de privacidad</TextLink>.</p>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("externo: abre otra pestaña, protege el origen y lo anuncia", async () => {
    const { container } = render(
      <TextLink href="https://calendly.com/confiaing/30min" external externalLabel="se abre en una pestaña nueva">
        Agendar
      </TextLink>,
    );
    // jsdom recorta el espacio inicial del texto oculto; los navegadores lo conservan.
    const link = screen.getByRole("link", { name: /^Agendar\s*\(se abre en una pestaña nueva\)$/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(await axe(container)).toHaveNoViolations();
  });
});
