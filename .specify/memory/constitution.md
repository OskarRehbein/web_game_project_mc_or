# Fathom's End Constitution

## Core Principles

### I. Security-First API Boundaries (NON-NEGOTIABLE)
- Todos los endpoints protegidos DEBEN exigir JWT valido.
- Las reglas owner/admin DEBEN aplicarse en middleware reusable, no inline por controlador.
- El rol admin es estrictamente lectura global para perfiles y runs.

### II. Test-First Delivery
- Toda funcionalidad de dominio (auth, profile, oracle, game runs) DEBE iniciar con tests.
- Para cada endpoint nuevo, DEBEN existir pruebas de integracion con casos 200/4xx relevantes.
- Ninguna tarea se considera terminada sin evidencia automatizada ejecutable.

### III. External API Resilience
- OpenTDB es fuente primaria, pero el juego NUNCA debe quedar bloqueado por falla externa.
- Fallback local de trivia es obligatorio ante timeout, error o payload invalido.
- Cada fallback DEBE registrarse con causa y requestId para trazabilidad.

### IV. Data Integrity and Idempotence
- Operaciones de recompensa/penalizacion del Oraculo DEBEN ser idempotentes.
- Se DEBEN usar constraints/indices para prevenir doble aplicacion de efectos.
- Checkpoint de run en curso DEBE respetar scope owner y no filtrar datos cruzados.

### V. Reproducible Delivery
- El repositorio DEBE poder levantarse via Docker Compose con frontend, backend y MongoDB.
- CI DEBE ejecutar lint, tests y build antes de permitir publicacion de imagenes.
- Criterios de rendimiento rubricables DEBEN medirse con script reproducible y reporte versionado.

## Additional Constraints

- Stack backend oficial: Node.js + Express + Mongoose.
- Auth MVP: register/login local con JWT 24h (sin refresh token).
- Frontend no puede llamar OpenTDB directamente; solo API propia.
- Requisito academico obligatorio: demostrar registro + login + autenticacion + autorizacion.

## Workflow and Quality Gates

- Gate 1: Spec sin contradicciones en contratos y roles.
- Gate 2: Plan alineado a spec (entidades, endpoints, seguridad, testing, despliegue).
- Gate 3: Tasks trazables a FR/SC, con dependencias claras y pruebas asociadas.
- Gate 4: Validacion final con demo checklist y evidencia de CI verde.

## Governance

- Esta constitucion prevalece sobre planes/tareas en caso de conflicto.
- Cambios a principios requieren actualizar este archivo y documentar impacto en spec/plan/tasks.
- Todo PR o revision interna debe verificar conformidad con los cinco principios.

**Version**: 1.0.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
