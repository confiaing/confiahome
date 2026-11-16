# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el requisito que cubre.

## 1. Estado legal y textos (L8-1, L8-2)

- [x] 1.1 Pruebas unitarias en rojo: tipos y estructura idéntica ES/EN (mismas secciones, bloques y elementos); temas obligatorios de privacidad y de términos; versión igual a `CONSENT_VERSION`; campos del formulario y plazos coherentes con el sistema; guardas de contenido sobre los textos legales (legal-pages: Política; Términos; La política describe lo que el sitio hace; Datos pendientes). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Escribir `src/i18n/legal/{types,status,es,en}.ts`. Verificación: `npm test` y `typecheck` en verde.
- [x] 1.3 Pruebas en rojo e implementación de `LEGAL_STATUS` como único interruptor: aviso, `robots` y páginas indexables (legal-pages: Borrador señalado y no indexado). Verificación: `npm test` en verde con ambos valores.

## 2. Página legal (L8-1, L8-2)

- [x] 2.1 Pruebas de integración en rojo de `LegalDocument`, en ES y EN, privacidad y términos: un `h1`, un `h2` por sección, aviso antes del texto, correo como enlace, pendientes marcados, axe (legal-pages: Secciones presentes; Aviso de borrador; Pendientes señalados; Páginas accesibles). Verificación: `npm test` falla.
- [x] 2.2 Implementar `legal-document.tsx`, sustituir `LegalPlaceholder` y retirar lo que quede sin uso. Verificación: `npm test`, `typecheck` y `lint` en verde.

## 3. Metadatos e imagen (L8-3, L8-6)

- [x] 3.1 Pruebas en rojo de `pageMetadata` y de las descripciones: idioma, longitud, guardas, canónica, `hreflang`, Open Graph, tarjeta, `robots` de las legales (search-and-agent-discovery: Metadatos por idioma; Vista previa al compartir). Verificación: `npm test` falla.
- [x] 3.2 Añadir `meta.*` a los diccionarios, implementar `src/lib/seo/metadata.ts` y usarlo en la home y en las legales. Verificación: `npm test` en verde.
- [x] 3.3 Pruebas en rojo e implementación de la imagen para redes: 1200×630, PNG, menos de 300 kB, colores de la paleta, regeneración estable (Vista previa: La imagen existe; se regenera). Verificación: `npm run brand:assets` y `npm test` en verde.

## 4. Mapa, reglas y datos estructurados (L8-4, L8-5, L8-7)

- [x] 4.1 Pruebas en rojo e implementación de `sitemap.ts`: dos páginas en borrador, seis en vigente, alternativas, dirección pública (Mapa del sitio; Dirección pública correcta). Verificación: `npm test` en verde.
- [x] 4.2 Pruebas en rojo e implementación de `robots.ts` y `ai-crawlers.ts`: todo permitido salvo `/api/`, mapa absoluto, rastreadores de IA nombrados y permitidos (Reglas de rastreo). Verificación: `npm test` en verde.
- [x] 4.3 Pruebas en rojo e implementación de `structured-data.ts` y `JsonLd`: organización, sitio y servicios del diccionario; lista de propiedades prohibidas; escape de `<` (Datos estructurados). Verificación: `npm test` en verde.
- [x] 4.4 Pruebas en rojo e implementación de `llms.ts` y la ruta `/llms.txt`: contenido, ambos idiomas, textos del diccionario, guardas, conversación exploratoria (Resumen en texto plano para agentes). Verificación: `npm test` en verde.

## 5. El flujo en el navegador

- [x] 5.1 E2E en rojo y ajuste: metadatos reales de `/es` y `/en` en el HTML servido; `og:image` responde 200 con sus dimensiones; `/sitemap.xml`, `/robots.txt` y `/llms.txt` responden con su tipo y contenido; JSON-LD analizable (search-and-agent-discovery). Verificación: `npm run e2e` en verde.
- [x] 5.2 E2E: las cuatro páginas legales, con y sin JavaScript, a 375 y 1280 px: texto completo, aviso, `noindex`, axe y sin desplazamiento horizontal (legal-pages). Verificación: `npm run e2e` en verde.
- [x] 5.3 JS inicial, LCP y CLS dentro de presupuesto; el JS inicial no crece. Verificación: valores anotados aquí.
- [x] 5.4 Comprobación manual (M): validar el JSON-LD con un validador de esquema y revisar la imagen para redes a tamaño real. Verificación: resultado y captura anotados aquí.

## 6. Cierre del lote

- [x] 6.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente, con atención a afirmaciones legales o comerciales no respaldadas, y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 6.2 Puerta de cierre: `lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/es` en `preview`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 6.3 Actualizar README, BACKLOG (añadir L8-7 y el cambio del mapa del sitio), `docs/escenarios.md`, `docs/architecture/`, `docs/setup.md` (datos del responsable y revisión legal para L10) y `docs/legal/`. Verificación: enlaces comprobados.
- [x] 6.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Ejecutado el 2026-11-14 sobre el código final del lote. Hubo una pausa a mitad del lote; se reanudó comprobando que pruebas, tipos y lint seguían en verde.

**Puerta de cierre (6.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | Sin errores |
| `npm test` | 873 pruebas en 51 archivos, todas en verde |
| `npm run e2e` | 343 en verde, 21 omitidas (solo aplican en Chromium de escritorio) |
| `npm run build:worker` | 1184,1 KiB de 3072 (L7: 1133,1); sin secretos; sin Three.js |
| `npm run measure:js` (5.3) | 164,0 kB de 200 (L7: 163,7; el aumento es el contador de visitas, que pasó a pedirse desde el navegador) |
| LCP y CLS de `/es`, móvil simulado (5.3) | 0,77 s y 0,0060 (ligera) · 0,76 s y 0,0060 (completa) |
| `preview` (Workers local) | 200 en `/es`, `/es/privacidad`, `/sitemap.xml`, `/robots.txt`, `/llms.txt` y `/brand/og-en.png`; la página legal sale con `noindex, follow` |

**Comprobación manual (5.4, nivel M).**

- Imagen para redes: revisadas `og-es.png` y `og-en.png` a tamaño real. Logo, barra de acento y la frase del hero con su palabra resaltada en cursiva; 26 y 21 kB.
- JSON-LD: revisado a mano contra schema.org (`Organization` con `name`, `url`, `logo`, `email`, `description`, `contactPoint`; `WebSite` con `url`, `name`, `inLanguage`, `publisher`; `Service` con `name`, `description`, `provider`). **No se pasó por un validador externo:** habría supuesto enviar contenido del proyecto a un servicio de terceros.

**Revisión de código (6.1).** Subagente independiente, solo lectura, centrado en la veracidad de los textos legales frente al código.

1. *Crítico, corregido.* La política decía que con Global Privacy Control o Do Not Track «no registramos tu uso de la página», pero el contador de visitas de Cloudflare se cargaba igual. Ahora el contador no se pide con esa señal (cambia `web-analytics.tsx`, del lote L7) y la política lo dice.
2. *Importante, corregido.* Faltaba Google: el aviso de cada consulta, con todos sus datos, termina en un buzón de Gmail. Nombrado como proveedor y cubierto en la conservación.
3. *Importante, corregido.* No se decía que la IP y el tipo de navegador se usan un instante contra el envío automatizado.
4. *Importante, corregido.* La sección de cookies anunciaba dos preferencias y listaba tres cosas, y no decía que la versión de la página va en el almacenamiento local, sin caducidad.
5. *Importante, mitigado.* La conservación de 24 y 13 meses no tiene borrado automático. Queda como compromiso; documentado que no se pase a vigente antes de L9.
6. *Importante, corregido.* El interruptor de «vigente» no tenía guarda: habría publicado «[pendiente: …]» y «borrador». Ahora `publicationBlockers()` y su prueba lo impiden.
7. Corregidos: procedencia e idioma «junto a tu consulta»; la página muestra la versión; dos matices del inglés; `llms.txt` con el resumen en ambos idiomas; tres pruebas que no podían fallar; la prueba de la imagen compara el PNG guardado con el regenerado.
8. *Para el abogado, no corregido:* nueve puntos listados en `docs/legal/README.md` (contenido mínimo, plazos de consultas y reclamos, transferencia frente a transmisión, papel de Calendly, alcance de la autorización, términos, registro ante la SIC, copia en el correo, registros de Cloudflare).
9. *No cambiado:* las etiquetas `utm_*` que acompañan a una consulta admiten texto libre de 120 caracteres, a diferencia de las de la analítica; `Organization.url` apunta a la raíz, que redirige al idioma.

**Desviaciones de TDD**

- Los textos legales se redactaron tras escribir sus pruebas, pero esas pruebas buscaban palabras: no detectaron las inexactitudes que encontró la revisión. Las nuevas son más específicas, y aun así una prueba no puede garantizar que un texto legal sea veraz: hace falta leerlo contra el código cada vez que cambie el tratamiento de datos.

**No verificado**

- La validez jurídica de los textos: son borradores sin revisión de un abogado y sin los datos del responsable.
- El JSON-LD en un validador externo y la vista previa real en redes sociales (necesitan el dominio publicado).
- Que el buzón de destino sea de Gmail: sale de la documentación del proyecto (ADR-0003 y setup), no de una comprobación.
- Qué guardan los registros de invocación de Cloudflare.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
- Antes de L10, del fundador: datos del responsable y revisión legal; entonces `LEGAL_STATUS = "in-force"`.
