# Recepción de consultas

## Purpose

Define cómo el servidor recibe una consulta: qué acepta, qué rechaza y con qué respuesta, qué guarda, cómo se protege del spam y cómo avisa al equipo, sin perder nunca una consulta válida ni guardar más datos de los necesarios.

## MODIFIED Requirements

### Requirement: Antispam en capas
Antes de guardar, el servidor MUST verificar el token de Turnstile, descartar en silencio los envíos con el campo trampa relleno y limitar la frecuencia por origen. En producción, un token válido MUST rechazarse si Turnstile lo emitió para un dominio distinto del sitio. El widget de Turnstile MUST admitir solo el dominio del sitio. La dirección IP no MUST guardarse ni registrarse.

#### Scenario: Token inválido (I · L5-7)
- **GIVEN** un token de Turnstile inválido
- **WHEN** se envía
- **THEN** responde 403
- **AND** no se guarda ni se notifica

#### Scenario: Token de otro dominio (U · L13-4)
- **GIVEN** el verificador configurado con el dominio del sitio
- **WHEN** Turnstile da por válido un token emitido para otro dominio
- **THEN** el verificador lo rechaza como spam
- **AND** acepta el mismo token si el dominio coincide

#### Scenario: Sin dominio configurado (U)
- **GIVEN** el verificador sin dominio, como en desarrollo y en las pruebas de contrato
- **WHEN** Turnstile da por válido un token
- **THEN** el verificador lo acepta sin mirar el dominio

#### Scenario: Producción exige el dominio (U)
- **GIVEN** la composición de dependencias con servicios reales
- **WHEN** la dirección pública del sitio es HTTPS y no local
- **THEN** el verificador recibe su dominio
- **AND** con una dirección local no lo recibe

#### Scenario: Widget restringido (M · L13-4)
- **GIVEN** el widget de Turnstile en el panel de Cloudflare
- **WHEN** se consultan sus dominios
- **THEN** solo admite `confia.ing`
- **AND** el formulario de `https://confia.ing` sigue enviando consultas

#### Scenario: Campo trampa (I · L5-7)
- **GIVEN** el campo trampa relleno
- **WHEN** se envía
- **THEN** responde 201
- **AND** no se guarda ni se notifica

#### Scenario: Demasiados envíos (I · L5-7)
- **GIVEN** más envíos que el límite desde un mismo origen
- **WHEN** llega el siguiente
- **THEN** responde 429

#### Scenario: Sin IP (I · L5-7)
- **GIVEN** cualquier envío
- **WHEN** se guarda
- **THEN** la fila no contiene la dirección IP

#### Scenario: El verificador real habla con Turnstile (C)
- **GIVEN** las claves de prueba oficiales de Turnstile
- **WHEN** el adaptador verifica un token
- **THEN** acepta con la clave «siempre pasa» y rechaza con la clave «siempre falla»
