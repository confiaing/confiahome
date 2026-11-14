# ADR-0006: Antispam en capas

**Estado:** Aceptada · **Fecha:** 2026-11-13

## Contexto

El formulario es público y cada envío escribe en la base de datos y dispara un correo. El PRD exige protección contra spam sin perjudicar la accesibilidad.

## Decisión

Tres capas, todas verificadas en el servidor:

1. **Cloudflare Turnstile** en modo gestionado (normalmente invisible); el token se valida con `siteverify` antes de cualquier escritura.
2. **Campo trampa** oculto a personas y lectores de pantalla; si llega relleno, se responde 201 sin guardar.
3. **Límite de frecuencia** por IP con el binding de rate limiting de Workers en `/api/contact` y `/api/events`. La IP se usa en memoria y no se persiste.

## Opciones consideradas

- **reCAPTCHA / hCaptcha:** más fricción, cookies de terceros y peor accesibilidad.
- **Solo campo trampa:** insuficiente frente a bots dirigidos.

## Consecuencias

- Turnstile carga un script de Cloudflare: se incluye en la CSP y se inicializa cuando el formulario entra en pantalla.
- En las pruebas U, I y E, Turnstile se sustituye por un doble en memoria. Las claves de prueba oficiales se usan en desarrollo con `SERVICES=real` y en las pruebas de contrato.
- Si Turnstile no carga, el formulario muestra un error claro y ofrece hola@confia.ing.
