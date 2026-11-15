/** Borra las filas de una tabla creadas antes de una fecha. Devuelve cuántas borró. */
export interface Purger {
  purgeOlderThan(cutoff: Date): Promise<number>;
}
