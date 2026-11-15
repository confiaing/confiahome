# Textos legales

La política de privacidad y los términos del sitio son **borradores pendientes de revisión legal**. Los redactó Claude con base en la Ley 1581 de 2012 (Colombia) y en lo que el sitio hace de verdad con los datos; no sustituyen el concepto de un abogado, que el PRD exige antes del lanzamiento.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Textos en español e inglés | `src/i18n/legal/es.ts` y `en.ts` |
| Estado (borrador o vigente) y datos del responsable | `src/i18n/legal/status.ts` |
| Plazos de conservación | `src/domain/contact/retention.ts` (consultas) y `src/domain/analytics/retention.ts` (eventos) |
| Versión que se guarda con cada consulta | `src/domain/contact/consent.ts` |
| Página | `src/components/sections/legal-document.tsx` |

Las dos versiones deben tener las mismas secciones, párrafos y listas: una prueba lo exige.

## Mientras sea borrador

Con `LEGAL_STATUS = "draft"`:

- Cada página legal muestra al principio el aviso de borrador.
- Las páginas piden a los buscadores no indexarlas (`noindex, follow`).
- No aparecen en `sitemap.xml`.

## Qué falta para publicarlos como vigentes

1. **Datos del responsable** (`LEGAL_ENTITY`): razón social o nombre, número de identificación y domicilio. Hoy se muestran como «[pendiente: …]». No se rellenan con suposiciones.
2. **Revisión de un abogado** de ambos textos, en los dos idiomas.
3. Con lo anterior: `LEGAL_STATUS = "in-force"`. Desaparece el aviso, las páginas se indexan y entran en el mapa del sitio.
4. **Si el texto cambia**, cambia también `CONSENT_VERSION` y el campo `version` de la política en ambos idiomas: es lo que deja constancia de qué aceptó cada persona.

El interruptor tiene guarda: `publicationBlockers()` y su prueba impiden dejar el estado en «vigente» mientras falten los datos del responsable o los textos sigan diciendo «borrador».

**No pasar a vigente antes del lote L9:** la política promete una conservación máxima que aún no se cumple sola.

## Puntos para el abogado

Lista de lo que la revisión del código y del texto dejó abierto. No es asesoría jurídica; varios puntos salen de una lectura no profesional de la Ley 1581 de 2012 y del Decreto 1377 de 2013 y hay que confirmarlos.

1. **Contenido mínimo de la política:** fecha de entrada en vigor, periodo de vigencia de la base de datos, y persona o área responsable de atender peticiones (hoy solo hay un correo).
2. **Procedimiento y plazos de consultas y reclamos:** el texto remite a «los términos que fija la ley» sin detallarlos. Las reglas de contenido del proyecto prohíben prometer plazos en la página; si la ley exige escribirlos, hay que levantar esa regla para los textos legales.
3. **«Transferencia» frente a «transmisión»:** la sección se titula con una y el párrafo usa la otra; son figuras distintas.
4. **Calendly:** el texto lo trata como responsable de su propio servicio. Revisar si debe figurar como encargado, dado que una finalidad declarada es coordinar la conversación.
5. **Alcance de la autorización:** la casilla del formulario dice «para responder mi solicitud»; la política cubre además guardar la procedencia de la visita y enviar los datos a proveedores en el exterior.
6. **Términos:** aceptación por la sola navegación; no se fija jurisdicción; el compromiso de no enviar comunicaciones comerciales es firme y condiciona usos futuros.
7. **Registro Nacional de Bases de Datos ante la SIC:** no sé si aplica a esta empresa.
8. **Copia en el correo:** el aviso de cada consulta llega a un buzón de Gmail con todos sus datos. La política lo nombra y lo incluye en el plazo de conservación, pero su borrado es manual.
9. **Registros de Cloudflare:** falta comprobar qué guardan los registros de invocación del Worker (posible IP y agente de usuario). Pendiente para L9.

## Dependencias con otros lotes

- La política dice que las consultas se conservan como máximo 24 meses y los eventos anónimos 13. El borrado automático que lo cumple llega en el lote L9; hasta entonces el borrado es manual.
- La política nombra a los proveedores que intervienen hoy. Si se añade o cambia alguno, el texto se actualiza en el mismo cambio.
