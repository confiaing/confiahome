# ADR-0010: Formulario de consulta en dos modos

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing

## Contexto

El fundador pidió un formulario con carácter técnico y, al ver dos propuestas, decidió conservar ambas para que el visitante elija. La audiencia mezcla CTO, a quienes una terminal resulta natural, y CEO, a quienes puede intimidar. El PRD exige validación, errores accesibles y consentimiento explícito (§8, §9).

## Decisión

Un único formulario lógico con dos presentaciones intercambiables:

- **Modo terminal:** ventana de terminal; el comando se teclea al entrar en pantalla, el campo principal muestra ejemplos, y al enviar la consulta se «ejecuta» línea a línea.
- **Modo clásico:** campos convencionales con un panel `consulta.json` que se escribe mientras el visitante teclea.

Reglas:

1. **Un solo esquema Zod y un solo caso de uso** (`submitContact`). Los modos solo cambian la presentación.
2. **Los mismos campos en ambos:** nombre, empresa, correo, teléfono, mensaje y consentimiento.
3. **Cambiar de modo conserva lo escrito.**
4. **Ambos son formularios reales:** campos etiquetados, errores asociados a su campo, operables con teclado.
5. **El panel JSON es decorativo** (`aria-hidden`): duplica lo que ya está en los campos.
6. **Las animaciones de tecleo se desactivan** con `prefers-reduced-motion`; el texto aparece completo.
7. **Modo inicial:** terminal. La elección no se persiste entre visitas.

## Opciones consideradas

- **Solo terminal:** más memorable, pero arriesga a perder al visitante no técnico en el punto de conversión.
- **Solo clásico:** seguro, pero renuncia al rasgo que el fundador quiso destacar.
- **Elegir modo según el dispositivo o la hora:** impredecible y difícil de probar.

## Consecuencias

- La superficie de pruebas de interfaz se duplica; la de dominio no. Las pruebas de integración se parametrizan por modo.
- Los eventos analíticos `form_started` y `form_submitted` llevan el modo, para saber cuál convierte mejor. Es un dato de la interfaz, no del visitante.
- El JSON del modo clásico se construye con nodos de texto, nunca con `innerHTML`, para que lo que escribe el visitante no se interprete como marcado.
- A revisar con datos: si un modo convierte claramente peor, se retira o deja de ser el inicial.
