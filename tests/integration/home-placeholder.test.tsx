import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { HomePlaceholder } from "@/components/sections/home-placeholder";
import { getDictionary } from "@/i18n/dictionaries";

const copy = (locale: "es" | "en") => getDictionary(locale).placeholder;

// app-shell · Pruebas ejecutables en los tres niveles (L0-3)
describe("página mínima", () => {
  it("muestra un único título principal en cada idioma", () => {
    const { unmount } = render(<HomePlaceholder copy={copy("es")} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Sitio en construcción.")).toBeInTheDocument();
    unmount();

    render(<HomePlaceholder copy={copy("en")} />);
    expect(screen.getByText("Site under construction.")).toBeInTheDocument();
  });

  it.each([
    ["es", "Escribir a hola@confia.ing"],
    ["en", "Write to hola@confia.ing"],
  ] as const)("en %s muestra la acción de contacto", (locale, cta) => {
    render(<HomePlaceholder copy={copy(locale)} />);
    expect(screen.getByRole("link", { name: cta })).toHaveAttribute("href", "mailto:hola@confia.ing");
  });

  // translations · Todo texto visible sale de los diccionarios
  it("sus textos son los del diccionario y el contenido principal es el destino del salto", () => {
    const texts = { eyebrow: "Uno", title: "Dos", note: "Tres", cta: "Cuatro" };
    render(<HomePlaceholder copy={texts} />);
    for (const text of Object.values(texts)) expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "contenido");
  });

  it("no tiene infracciones de accesibilidad", async () => {
    const { container } = render(<HomePlaceholder copy={copy("es")} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
