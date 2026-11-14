import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

// Añade toHaveNoViolations() a los tipos de expect de Vitest.
declare module "vitest" {
  interface Assertion<T> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
