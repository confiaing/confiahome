# Auditoría de seguridad y revisión de la v1

**Fecha:** 2026-11-14 · **Alcance:** todo el repositorio antes del lanzamiento (lote L9) · **Método:** una auditoría con el skill `security-audit` y dos revisiones de código independientes (servidor y datos; cliente, contenido y build), las tres de solo lectura sobre el código.

## Resultado

**Sin hallazgos críticos, altos ni medios de seguridad.** No se encontró ninguna vía por la que la IP, el agente de usuario o los datos del formulario lleguen a la analítica o a los registros; la base está cerrada por RLS sin políticas; no hay secretos en el repositorio ni en su historial.

Las revisiones de código sí dieron hallazgos de severidad media, todos de corrección o de mantenimiento. Están corregidos, salvo los tres que se listan como aceptados, que necesitan la configuración de producción.

## Hallazgos de seguridad

| ID | Sev. | Hallazgo | Estado |
|---|---|---|---|
| S-01 | Baja | El control «Worker sin secretos» solo miraba el bloque de producción de las variables que OpenNext incrusta. El bloque de desarrollo llevaba la clave local de Supabase y la de prueba de Turnstile, tomadas de `.env.development.local`, y habría viajado en el Worker desplegado | **Corregido.** `build:worker` vacía los bloques de desarrollo y de pruebas y comprueba los tres (`scripts/lib/worker-env.ts`) |
| S-02 | Baja | El sitio de procedencia que acompaña a una consulta admitía texto libre: permitía líneas falsas en el aviso por correo, y un carácter nulo provocaba un 503 | **Corregido.** Misma validación que en la analítica (`src/domain/attribution.ts`) y restricción en la base |
| S-03 | Baja | `/api/events` no pide Turnstile: con muchas IP se podrían falsear métricas o hacer crecer la tabla | **Corregido en L13.** Límite de 20 por minuto y origen en el Worker, valores acotados y borrado a 13 meses, y una regla de frecuencia de Cloudflare en el borde: 20 peticiones en 10 s por IP ([operations.md](../operations.md#configuración-de-la-zona)). Vigilar el tamaño sigue en `docs/analytics.md` |
| S-04 | Baja | Sin `SERVICES` el servidor usa adaptadores en memoria: un entorno futuro sin esa variable aceptaría consultas sin guardarlas | **Aceptado.** `wrangler.jsonc` fija `real` y una prueba lo comprueba |
| S-05 | Inf. | El Worker autoriza todos los scripts del HTML | **Vigilado.** Next.js copia la ruta y los parámetros pedidos en uno de sus scripts de datos, siempre codificados; hay una prueba con direcciones hostiles (`tests/preview/security.spec.ts`). Ver [ADR-0016](../architecture/adr/0016-entrada-propia-del-worker-cabeceras-y-tarea-diaria.md) |
| S-06 | Inf. | Los archivos estáticos no llevaban política de contenido | **Corregido** para `/brand/*` (`public/_headers`) |
| S-07 | Inf. | La verificación de Turnstile no comprueba el dominio del token | **Corregido en L13.** El widget solo admite `confia.ing`, y el servidor rechaza en producción los tokens emitidos para otro dominio (`src/adapters/turnstile/verifier.ts`) |
| S-08 | Inf. | El identificador del proyecto de Supabase aparece en la documentación | **Aceptado.** No es un secreto; el acceso lo impide RLS |

## Hallazgos de la revisión de código (severidad media)

| Hallazgo | Estado |
|---|---|
| Al pulsar un enlace a otra sección, el recorrido volvía a la etapa 1 | **Corregido**, con prueba |
| La limpieza de la suite contra Workers mataba cualquier `wrangler` de la máquina | **Corregido:** cierra por puerto y por carpeta del proyecto |
| Con la verificación antispam bloqueada, cada envío esperaba 15 s para repetir el mismo aviso | **Corregido**, con prueba |
| Con «No rastrear», la consulta seguía guardando de dónde llegó la visita | **Corregido:** no se envía, con prueba |
| El contenedor conservaba un latido falso y un campo sin uso | **Corregido:** retirados |
| Dos lectores del entorno con reglas y errores distintos | **Corregido:** una sola lectura del modo de servicios |
| Etiquetas de campaña y procedencia validadas de dos formas | **Corregido:** un módulo del dominio para ambos casos |
| La atribución «recordada» no sobrevive a un cambio de página | **Aceptado como límite:** documentado en `docs/analytics.md`; guardarla en el navegador sería almacenar algo sobre la visita |
| El verificador en memoria acepta un token vacío y el real no: un build de producción sin la clave pública de Turnstile rechazaría todas las consultas | **Aceptado, pendiente de L10.** `build:worker` avisa si falta la clave; el despliegue debe exigirla |
| La entrada del Worker solo se prueba con `e2e:preview`, que no estaba en la puerta de cierre | **Corregido:** añadido a la puerta de cierre de `CLAUDE.md` con el visto bueno del fundador |

Corregidos además, de severidad baja: un campo trampa muy largo delataba la trampa; el aviso por correo no tenía tiempo máximo; los puertos compartidos estaban en la carpeta de contacto; faltaba una prueba de que los máximos del formulario caben en la base; el lector de pantalla oía «se abre en una pestaña nueva» en enlaces que ya no la abren; varias pruebas que no podían fallar.

## Aceptados de severidad baja, sin corregir

- Si el JavaScript no llega a ejecutarse en un móvil, el menú no se abre; el resto de la página y las dos acciones siguen disponibles.
- El año del pie se fija al construir.
- Tres copias de la comprobación de hidratación y una casilla reimplementada en el formulario.
- `src/i18n/legal/status.ts` guarda estado y política de indexación dentro de `i18n/`.
- El borrado devuelve cero si la base no informa de la cuenta.
- Claves de diccionario sin uso (`legal.privacyTitle`, `legal.termsTitle`, tres de `contact.examples`).

## Lo que no se pudo verificar

- La configuración real de Cloudflare y de Supabase en producción: secretos, dominio del widget de Turnstile, reglas, y que las migraciones aplicadas coincidan con el repositorio.
- Vulnerabilidades conocidas de las dependencias (`npm audit` necesita red).
- Los registros de Cloudflare tras desactivar los de invocación: se configuró según su documentación, no se observó.
