type ClassValue = string | false | null | undefined;

/** Une clases condicionales descartando los valores vacíos. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
