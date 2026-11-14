# Presupuestos de build

## Purpose

El build hace cumplir el límite de tamaño del plan gratuito de Cloudflare y deja medido el JavaScript inicial, para detectar un exceso en el lote que lo introduce y no en el despliegue.

## ADDED Requirements

### Requirement: Límite de tamaño del Worker
La comprobación de tamaño SHALL fallar cuando el Worker comprimido supere 3 MiB.

#### Scenario: Worker por encima del límite
- **GIVEN** un tamaño medido superior a 3 MiB
- **WHEN** corre la comprobación de tamaño
- **THEN** termina con código distinto de 0
- **AND** muestra el tamaño medido y el límite

#### Scenario: Worker dentro del límite
- **GIVEN** un tamaño medido inferior a 3 MiB
- **WHEN** corre la comprobación
- **THEN** termina con código 0
- **AND** muestra el margen restante

#### Scenario: Medida no disponible
- **GIVEN** que no se puede obtener el tamaño del Worker
- **WHEN** corre la comprobación
- **THEN** termina con código distinto de 0 e indica que no pudo medir

### Requirement: Medición del JS inicial
El proyecto SHALL informar el tamaño comprimido del JavaScript inicial de `/es`.

#### Scenario: Informe del JS inicial
- **GIVEN** el build de producción
- **WHEN** se ejecuta la medición
- **THEN** muestra el tamaño comprimido del JS inicial de `/es` frente al límite de 200 kB
