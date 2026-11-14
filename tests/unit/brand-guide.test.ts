import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTokens } from "../support/tokens";

const guide = readFileSync(fileURLToPath(new URL("../../docs/brand/README.md", import.meta.url)), "utf8");

// brand-identity · La guía coincide con los tokens (L1-6)
describe("guía de marca", () => {
  it("su tabla de paleta tiene los mismos nombres y HEX que tokens.css", () => {
    const rows = [...guide.matchAll(/^\| `([a-z]+(?:-\d+)?)` \| `(#[0-9A-Fa-f]{6})` \|/gm)];
    const documented = Object.fromEntries(rows.map((row) => [`--${row[1]}`, row[2]!.toUpperCase()]));
    const tokens = Object.fromEntries(
      Object.entries(loadTokens().primitives).map(([name, value]) => [name, value.toUpperCase()]),
    );
    expect(documented).toEqual(tokens);
  });
});
