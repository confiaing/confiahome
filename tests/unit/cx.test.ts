import { describe, expect, it } from "vitest";
import { cx } from "@/lib/cx";

describe("cx", () => {
  it("une las clases y descarta los valores vacíos", () => {
    expect(cx("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("sin clases devuelve una cadena vacía", () => {
    expect(cx(false, undefined)).toBe("");
  });
});
