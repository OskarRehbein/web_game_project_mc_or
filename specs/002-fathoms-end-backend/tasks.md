# Tasks: Fathom's End - Backend y Persistencia Fullstack

**Funcionalidad**: 002-fathoms-end-backend  
**Lenguaje**: JavaScript/Node.js + Vue 3  
**Objetivo**: Implementación Fullstack Solemne 3  
**Estado**: LISTO PARA IMPLEMENTACIÓN v0.2.0  
**Generado**: 2026-06-15

---

## Estructura General

Proyecto fullstack con backend independiente en carpeta `backend/` que:
- Autentica usuarios con JWT 24h
- Persiste perfiles y mejoras en MongoDB
- Integra trivia desde OpenTDB con fallback local
- Expone API REST protegida por roles owner/admin
- Se despliega en Docker Compose con CI/CD en GitHub Actions

**Alcance MVP (Backend listo sin Docker)**: Fases 1-6 + Fase 7
**Alcance Rubricable (Solemne 3)**: Fases 1-8 (incluye Docker/CI mínimo)
**Alcance Adicional**: Fase 9 completamente + optimizaciones de rendimiento + Google Login

---

## Fase 1: Preparación e Inicialización Backend

*Objetivo*: Establecer estructura base del backend con Express, Mongoose, modelos esqueleto y configuración centralizada.

*Prueba Independiente*: Stack levanta sin errores, modelos generan índices en MongoDB de pruebas, middleware básico funciona.

### T001 Crear estructura de carpetas del backend

- [X] T001 Crear carpeta backend con estructura según plan.md en `backend/` — `backend/src/`, `backend/tests/`, `backend/src/config/`

### T002-T005 Inicializar configuración centralizada

- [X] T002 [P] Crear archivo de configuración variables entorno en `backend/src/config/env.js` — `backend/.env.example` con variables del plan
- [X] T003 [P] Crear modulo logger centralizado en `backend/src/config/logger.js`
- [X] T004 [P] Crear modulo conexion MongoDB en `backend/src/config/db.js`
- [X] T005 [P] Crear archivo raiz `backend/src/app.js` con instancia Express basica

### T006-T008 Inicializar dependencias y package.json

- [X] T006 Crear `backend/package.json` con dependencias para Express, Mongoose, bcrypt, jsonwebtoken, dotenv, zod, axios
- [X] T007 [P] Crear `backend/src/server.js` que levanta app y MongoDB
- [X] T008 [P] Crear `backend/tests/setup.js` con configuracion vitest y connection mongo-memory-server

### T009-T010 Modelos esqueleto (TDD)

- [ ] T009 Escribir test de schema User basico en `backend/tests/unit/models/User.test.js` — expectativas: email unique, password required
- [ ] T010 [P] Implementar modelo User en `backend/src/models/User.js` segun test T009

---

## Fase 2: Autenticación - Registro, Login y JWT

*Objetivo*: Implementar flujo de autenticación completo con password hashing, JWT y middleware de protección.

*Prueba Independiente*: Register exitoso, login con token válido, endpoints protegidos rechazan sin token, token inválido → 401.

*Criterios de Aceptación*:
- POST /auth/register crea usuario con password hasheado
- POST /auth/login valida y entrega token 24h
- GET /profile/me sin token → 401
- Todos los endpoints Auth validados por suite de tests

### T011-T012 Modelos de autenticación

- [ ] T011 [P] Escribir test para modelo User con metodos hash/compare password en `backend/tests/unit/models/User.test.js`
- [ ] T012 Implementar metodos bcrypt en schema User en `backend/src/models/User.js` — methods: hashPassword, comparePassword, toJSON

### T013-T015 Servicio de autenticación (TDD)

- [ ] T013 Escribir test para AuthService (register y login) en `backend/tests/unit/services/auth.service.test.js` — valida inputs, hashing, JWT sign
- [ ] T014 [P] Implementar AuthService en `backend/src/modules/auth/auth.service.js`
- [ ] T015 [P] Implementar generacion de JWT con expiracion 24h en AuthService

### T016-T018 Endpoints de autenticación

- [ ] T016 Escribir test de integracion POST /auth/register en `backend/tests/integration/auth.integration.test.js` — 201 exitoso, 409 email duplicado, 400 validacion
- [ ] T017 [P] Implementar ruta POST /auth/register en `backend/src/modules/auth/auth.routes.js`
- [ ] T017A Escribir test de integracion POST /auth/login en `backend/tests/integration/auth.integration.test.js` — 200 credenciales validas, 401 invalidas, 400 payload invalido
- [ ] T018 [P] Implementar ruta POST /auth/login en `backend/src/modules/auth/auth.routes.js` — retorna `{ accessToken, expiresIn, user }`

### T019-T020 Middleware de autenticación JWT

- [ ] T019 Escribir test para middleware authJwt en `backend/tests/unit/middleware/authJwt.test.js` — valida token, 401 sin token, 401 token expirado
- [ ] T020 [P] Implementar middleware `authJwt` en `backend/src/middleware/authJwt.js` — verifica JWT y agrega `req.user`

### T020A-T021A Endurecimiento de seguridad (validación, rate limit, CORS)

- [ ] T020A Escribir tests de validación de request schema (zod/joi) para auth/profile/oracle en `backend/tests/unit/middleware/requestValidation.test.js` — 400 ante payload inválido
- [ ] T020B [P] Implementar rate limiting para `/auth/register` y `/auth/login` en `backend/src/middleware/rateLimitAuth.js` — 429 ante abuso
- [ ] T021A [P] Configurar CORS estricto por `CORS_ORIGIN` y test negativo de origen no permitido en `backend/src/app.js` + `backend/tests/integration/cors.integration.test.js`

### T021 Integración middleware en app

- [ ] T021 Aplicar middleware authJwt a app express en `backend/src/app.js` — protege rutas bajo `/profile`, `/game`, `/admin`, `/external`

---

## Fase 3: Docker y CI/CD - Despliegue Reproducible

*Objetivo*: Dockerizar frontend + backend + MongoDB, orquestar con compose, configurar GitHub Actions para lint/test/build/push.

*Prueba Independiente*: `docker compose up --build` levanta stack, endpoints responden, mongod persiste, CI pipeline verde.

*Criterios de Aceptación*:
- docker-compose.yml maneja frontend, backend, mongodb
- Healthchecks en backend y mongodb
- .env.example documenta variables
- GitHub Actions lint, test, build en cada push
- Build y push de imágenes solo en main/tags
- README con instrucciones local/compose/DockerHub

### T022-T024 Dockerfiles

- [ ] T022 [P] Crear Dockerfile para backend multi-stage en `backend/Dockerfile` — builder, runtime, .dockerignore
- [ ] T023 Crear Dockerfile para frontend multi-stage en `Dockerfile` — build Vite, nginx final, .dockerignore existente
- [ ] T024 [P] Configurar nginx.conf (ya existe) para servir SPA y proxy /api al backend

### T025-T027 Docker Compose

- [ ] T025 Crear `docker-compose.yml` (o `compose.yml`) — servicios frontend, backend, mongodb, networks, volumes
- [ ] T026 [P] Configurar healthchecks para backend (/health) y mongodb
- [ ] T027 Crear `.env.compose` o plantilla en `docker-compose.yml` con variables seguras

### T028-T030 GitHub Actions - Lint y Test

- [ ] T028 [P] Crear workflow `lint-test.yml` en `.github/workflows/` — lint backend, lint frontend, test backend unit/integration, test frontend unit
- [ ] T029 Configurar problema matcher para lint/test para visualización en UI
- [ ] T030 [P] Agregar paso de cobertura (opcional, aspirational)
- [ ] T030A [P] Agregar job de performance smoke para SC-002 en `.github/workflows/lint-test.yml` — medir p95 en login/perfil y fallar si supera 2s

### T031-T033 GitHub Actions - Build y Push

- [ ] T031 Crear workflow `build-push.yml` en `.github/workflows/` — build backend y frontend images, push a DockerHub solo si main/tags y con dependencia obligatoria `needs: lint-and-test`
- [ ] T032 [P] Configurar secrets en GitHub (DOCKER_USERNAME, DOCKER_PASSWORD, DOCKER_REGISTRY)
- [ ] T033 Crear tags de imagen coherentes (latest, sha, semver)

### T034 Documentación README

- [ ] T034 [P] Actualizar o crear `backend/README.md` con:
  - Cómo correr localmente (npm install, .env, npm start)
  - Cómo correr con compose
  - Links a contrato API
  - Cómo ejecutar tests
  - Variables de entorno necesarias

---

## Fase 4: Persistencia de Perfil y Control de Acceso

*Objetivo*: Implementar modelo Profile, endpoint GET /profile/me, PATCH upgrades y validación de autorización owner/admin (admin solo lectura global).

*Prueba Independiente*: Owner lee/edita solo su perfil, tercero obtiene 403, admin lee global, actualización persiste en MongoDB.

*Criterios de Aceptación*:
- GET /profile/me retorna perfil autenticado (owner scope)
- PATCH /profile/upgrades actualiza damage, maxHp, speed solo si owner
- Tercero intenta editar → 403 Forbidden
- Admin puede leer pero no escribir → 403 en PUT/PATCH

### T035-T036 Modelos de perfil

- [ ] T035 [P] Escribir test para modelo Profile en `backend/tests/unit/models/Profile.test.js` — userId unique, upgrades con min/max validacion
- [ ] T036 Implementar modelo Profile en `backend/src/models/Profile.js` — userId, upgrades { damage, maxHp, speed }, updatedAt, validacion

### T037-T038 Middleware de autorización

- [ ] T037 Escribir test para middleware requireRole y ownerScope en `backend/tests/unit/middleware/authorization.test.js`
- [ ] T038 [P] Implementar middleware `requireRole` en `backend/src/middleware/requireRole.js` y `ownerScope` en `backend/src/middleware/ownerScope.js`

### T039-T040 Endpoint GET /profile/me

- [ ] T039 Escribir test de integracion GET /profile/me en `backend/tests/integration/profile.integration.test.js` — 401 sin token, 200 con token retorna perfil owner
- [ ] T040 Implementar ruta GET /profile/me en `backend/src/modules/profile/profile.routes.js` — usa authJwt + ownerScope

### T041-T043 Endpoint PATCH /profile/upgrades

- [ ] T041 Escribir test para PATCH con validacion de upgrades en `backend/tests/integration/profile.integration.test.js` — owner 200, tercero 403, admin 403
- [ ] T042 [P] Implementar servicio de actualización upgrades en `backend/src/modules/profile/profile.service.js` — validacion min/max, retorna perfil actualizado
- [ ] T043 Implementar ruta PATCH /profile/upgrades en `backend/src/modules/profile/profile.routes.js` — usa authJwt + ownerScope

### T044 Inicialización de Profile en registro

- [ ] T044 Modificar AuthService para crear Profile automaticamente al registrar usuario en `backend/src/modules/auth/auth.service.js`

---

## Fase 5: Mecánica del Oráculo - OpenTDB, Fallback y Respuestas

*Objetivo*: Implementar normalización de trivia desde OpenTDB, fallback a JSON local, validación de respuestas con idempotencia.

*Prueba Independiente*: GET /external/trivia/random retorna pregunta válida (external u local), POST /game/oracle/answer valida correcta vs incorrecta, doble submit → 409.

*Criterios de Aceptación*:
- GET /external/trivia retorna pregunta normalizada (question, options, category, difficulty, source) sin exponer `correctAnswer`
- OpenTDB timeout/error → fallback local sin bloquear
- Respuesta correcta → recompensa, incorrecta → daño
- Doble submit misma pregunta → 409 Conflict
- Oracle aparece al menos 1 vez por run (forzado si no salió por probabilidad)

### T045 Banco local de preguntas

- [ ] T045 Crear banco de preguntas fallback en JSON en `backend/src/data/local-question-bank.json` — 50+ preguntas con campos: question, correctAnswer, incorrectAnswers, difficulty, category

### T046-T048 Modelos para Oráculo

- [ ] T046 [P] Escribir test para modelo OracleQuestion en `backend/tests/unit/models/OracleQuestion.test.js`
- [ ] T047 [P] Implementar modelo OracleQuestion en `backend/src/models/OracleQuestion.js` — source, question, correctAnswer, incorrectAnswers, difficulty, category
- [ ] T048 Escribir test para modelo OracleAttempt en `backend/tests/unit/models/OracleAttempt.test.js` — runId, userId, questionHash, selectedAnswer, isCorrect, unique(runId, questionHash)

### T049 Modelo OracleAttempt

- [ ] T049 Implementar modelo OracleAttempt en `backend/src/models/OracleAttempt.js` — con índice único (runId, questionHash)

### T050-T051 Cliente y normalizador OpenTDB (TDD)

- [ ] T050 Escribir test para OpenTDB client en `backend/tests/unit/integrations/opentdb.client.test.js` — fetch pregunta, manejo error, timeout
- [ ] T051 [P] Implementar cliente OpenTDB en `backend/src/integrations/opentdb.client.js` — GET con timeout configurable, manejo de error

### T052-T053 Normalizador de trivia

- [ ] T052 Escribir test para normalizador en `backend/tests/unit/integrations/trivia.normalizer.test.js` — decode HTML, baraja opciones, hash deterministico
- [ ] T053 [P] Implementar normalizador en `backend/src/integrations/trivia.normalizer.js`

### T054 Repositorio fallback local

- [ ] T054 Implementar carga de banco local en `backend/src/integrations/trivia.fallback.repository.js` — lector de JSON con selección aleatoria
- [ ] T054A [P] Implementar trazabilidad de fallback y errores externos en `backend/src/config/logger.js` + `backend/src/modules/oracle/oracle.service.js` — campos mínimos: requestId, source, fallbackReason, errorCode, timestamp

### T055-T057 Servicio de Oráculo (TDD)

- [ ] T055 Escribir test para OracleService (getQuestion) en `backend/tests/unit/modules/oracle.service.test.js` — intenta OpenTDB, fallback si falla, retorna pregunta normalizada
- [ ] T056 [P] Escribir test para OracleService (answerQuestion) — valida respuesta, detecta doble submit (409), aplica reward/penalty
- [ ] T057 Implementar OracleService en `backend/src/modules/oracle/oracle.service.js`

### T058-T060 Endpoints del Oráculo

- [ ] T058 Escribir test de integracion GET /external/trivia/random en `backend/tests/integration/oracle.integration.test.js` — requiere auth, retorna pregunta válida
- [ ] T059 [P] Implementar ruta GET /external/trivia/random en `backend/src/modules/oracle/oracle.routes.js` — usa authJwt
- [ ] T060 Escribir test para POST /game/oracle/answer en `backend/tests/integration/oracle.integration.test.js` — correcta (reward), incorrecta (penalty), doble submit (409)

### T061 Endpoint POST /game/oracle/answer

- [ ] T061 Implementar ruta POST /game/oracle/answer en `backend/src/modules/oracle/oracle.routes.js` — usa authJwt, valida respuesta, manejo 409
- [ ] T061A Escribir test para garantía del Oráculo por run en `backend/tests/integration/oracle-guarantee.integration.test.js` — en 100% de runs completas aparece al menos 1 vez
- [ ] T061B [P] Implementar lógica de forzado del Oráculo con `ORACLE_FORCE_AT_STEP` en `backend/src/modules/oracle/oracle.service.js`

---

## Fase 6: Historial de Runs y Control Administrativo (Solo Lectura)

*Objetivo*: Implementar GameRun, RewardLedger, endpoints /admin/{profiles,runs} con autorización admin de solo lectura.

*Prueba Independiente*: Owner ve solo sus runs, admin ve global sin permisos de escritura, finalizacion de run persiste en DB.

*Criterios de Aceptación*:
- Finalización de run crea GameRun entry
- Owner consulta `/game/runs` → solo sus runs
- Admin consulta `/admin/runs` → global solo lectura
- Admin consulta `/admin/profiles` → global solo lectura
- Admin intenta PATCH upgrade de tercero → 403

### T062-T063 Modelos de historial

- [ ] T062A Escribir test para modelo GameRun en `backend/tests/unit/models/GameRun.test.js` — schema, indices y validaciones minimas
- [ ] T062 [P] Implementar modelo GameRun en `backend/src/models/GameRun.js` — userId, startedAt, endedAt, oracleGuaranteed, oracleAppeared, result, rewards
- [ ] T063A Escribir test para modelo RewardLedger en `backend/tests/unit/models/RewardLedger.test.js` — tipos permitidos, payload y campos de auditoria
- [ ] T063 Implementar modelo RewardLedger en `backend/src/models/RewardLedger.js` — runId, type (legendaryReward/damagePenalty), payload, appliedAt

### T064-T065 Endpoints admin lectura global

- [ ] T064 Escribir test de integracion GET /admin/profiles en `backend/tests/integration/admin.integration.test.js` — admin 200 sin filtro, owner 403, tercero 403
- [ ] T065 [P] Escribir test para GET /admin/runs — admin 200 sin filtro, owner 403

### T066-T067 Rutas admin

- [ ] T066 Implementar ruta GET /admin/profiles en `backend/src/modules/admin/admin.routes.js` — requiere authJwt + requireRole('admin')
- [ ] T067 [P] Implementar ruta GET /admin/runs en `backend/src/modules/admin/admin.routes.js`

### T068 Crear entrada GameRun al finalizar run

- [ ] T068 Implementar lógica de cierre de run y creación GameRun en `backend/src/modules/game/game.service.js`
- [ ] T068A Escribir test de integración para `GET /game/runs` owner-scope en `backend/tests/integration/game-runs.integration.test.js` — owner 200 solo sus runs, tercero 403
- [ ] T068B [P] Implementar ruta `GET /game/runs` en `backend/src/modules/game/game.routes.js` — authJwt + ownerScope
- [ ] T068C Implementar persistencia de partida en curso (checkpoint) en `backend/src/modules/game/game.service.js` — guarda estado parcial de run
- [ ] T068D [P] Escribir test de integración para `PATCH /game/runs/:runId/checkpoint` y `GET /game/runs/:runId/resume` en `backend/tests/integration/game-checkpoint.integration.test.js`
- [ ] T068E Implementar rutas de checkpoint en `backend/src/modules/game/game.routes.js` — guardar y recuperar partida en curso por owner

### T069 Middleware denegación mutación admin

- [ ] T069 Escribir test de no-regresión para denegación de mutación admin en endpoints de escritura en `backend/tests/integration/admin-write-deny.integration.test.js` — siempre 403 para admin

---

## Fase 7: Integración Frontend - Pantallas de Auth, Perfil y Oráculo

*Objetivo*: Crear/adaptar pantallas Vue3 que consumen API propia (nunca OpenTDB directo), con flujo de registro, login, perfil persistente y evento Oráculo.

*Prueba Independiente*: Flujo UI completo (register → login → perfil → oraculo), todas las llamadas a API propia, persistencia visible tras re-login, cero llamadas directas a OpenTDB.

*Criterios de Aceptación*:
- Pantalla de Registro funcional (email, password)
- Pantalla de Login funcional (email, password)
- Pantalla de Perfil muestra upgrades, permite editar (solo owner)
- Evento Oráculo carga pregunta desde API, no de OpenTDB directo
- Token JWT persistido en localStorage/sessionStorage
- Re-login recupera perfil actualizado
- Cero llamadas directas a OpenTDB

### T070-T072 Pantalla de Registro

- [ ] T070 Escribir test para componente RegisterForm en `tests/unit/components/RegisterForm.test.js` — input email/password, submit valida formato
- [ ] T071 [P] Implementar componente RegisterForm.vue en `src/components/auth/RegisterForm.vue` — formulario, validación, manejo error 409 email duplicado
- [ ] T072 Integrar RegisterForm en vista o router

### T073-T075 Pantalla de Login

- [ ] T073 Escribir test para componente LoginForm en `tests/unit/components/LoginForm.test.js` — validacion inputs, submit POST /auth/login
- [ ] T074 [P] Implementar componente LoginForm.vue en `src/components/auth/LoginForm.vue` — formulario, persistencia token, redirección
- [ ] T075 Integrar LoginForm en vista o router

### T076-T078 Servicio API frontend

- [ ] T076 [P] Crear servicio API centralizado en `src/services/api.js` — base URL, interceptors para token JWT, manejo 401
- [ ] T077 Escribir test para api.js en `tests/unit/services/api.test.js`
- [ ] T078 [P] Implementar metodos en api.js: register, login, getProfile, updateProfile, getTrivia, answerOracle

### T079-T081 Pantalla/Componente de Perfil

- [ ] T079 Escribir test para componente ProfileCard en `tests/unit/components/ProfileCard.test.js` — muestra upgrades, permite editar si owner
- [ ] T080 [P] Implementar componente ProfileCard.vue en `src/components/profile/ProfileCard.vue` — display upgrades, modal/inline edit
- [ ] T081 Integrar ProfileCard en vista Profile existente o nueva

### T082-T084 Evento Oráculo - Componente Pregunta

- [ ] T082 Escribir test para componente OracleQuestion en `tests/unit/components/OracleQuestion.test.js` — carga pregunta, muestra opciones, valida respuesta
- [ ] T083 [P] Implementar componente OracleQuestion.vue en `src/components/oracle/OracleQuestion.vue` — GET /external/trivia/random, POST answer, manejo reward/penalty
- [ ] T084 Integrar OracleQuestion en evento Oráculo del juego (MapView o EventWindow existente)

### T085 Test: Verificar cero llamadas directas a OpenTDB

- [ ] T085 [P] Escribir test de integracion en `tests/integration/oracle.no-direct-calls.test.js` — simular flujo oraculo, verificar headers/network que nunca va a opentdb.com

---

## Fase 8: Mejoras de Juego y Experiencia - Backlog Expandible

*Objetivo*: Dejar registradas, priorizadas y preparadas para implementación las mejoras de juego definidas en PLANNING.md, sin cerrar aún decisiones de detalle (por ejemplo, tipo de jefe/isla específica).

*Prueba Independiente*: Existe un backlog de mejoras con tareas marco implementables, criterios de aceptación por bloque y orden de ejecución sugerido para iteraciones posteriores.

*Criterios de Aceptación*:
- Las mejoras imprescindibles y deseables quedan mapeadas a tareas generales ejecutables
- Cada bloque deja espacio explícito para definir contenido específico durante implementación
- Se prioriza primero la base de experiencia de juego antes de Docker/CI
- Queda trazabilidad entre PLANNING.md y este tasks.md

### T085A-T085C Exploración, eventos y mapa

- [ ] T085A Crear backlog general de exploración y decisiones de viaje en `specs/002-fathoms-end-backend/backlog/gameplay-exploration.md` — marco para más islas/eventos y consecuencias sin fijar contenido final
- [ ] T085B [P] Crear backlog general de mapa del mundo en `specs/002-fathoms-end-backend/backlog/gameplay-worldmap.md` — vista global, progresión visible y espacios para zonas por descubrir
- [ ] T085C [P] Crear backlog general de encuentros intermedios en `specs/002-fathoms-end-backend/backlog/gameplay-encounters.md` — variedad de enemigos/encuentros entre hitos principales

### T085D-T085F Combate, progresión y rejugabilidad

- [ ] T085D Crear backlog general de pulido de combate en `specs/002-fathoms-end-backend/backlog/combat-polish.md` — patrones, feedback de impacto y animaciones clave a definir por iteración
- [ ] T085E [P] Crear backlog general de meta-progresión y rejugabilidad en `specs/002-fathoms-end-backend/backlog/metaprogression.md` — mejoras de largo plazo entre runs sin fijar valores finales
- [ ] T085F [P] Crear backlog general de integración de progresión persistente en `specs/002-fathoms-end-backend/backlog/persistence-loop.md` — puente frontend/backend para guardado y continuidad entre partidas

### T085G-T085I Identidad visual, narrativa y assets

- [ ] T085G Crear backlog general de identidad visual en `specs/002-fathoms-end-backend/backlog/visual-identity.md` — lineamientos de menús, HUD y pantallas de estado
- [ ] T085H [P] Crear backlog general de narrativa y lore en `specs/002-fathoms-end-backend/backlog/narrative-lore.md` — distribución de contexto narrativo en eventos/islas/cartas/jefes
- [ ] T085I [P] Crear backlog general de expansión visual en `specs/002-fathoms-end-backend/backlog/assets-roadmap.md` — sprites, fondos e iconografía con estándar de calidad

---

## Fase 9: Validación de Cobertura, Demostración y Documentación

*Objetivo*: Validar cobertura de tests, crear script de demostración rubricable, documentar decisiones, evidenciar cumplimiento de rubrica.

*Prueba Independiente*: Cobertura ≥ 80% en módulos clave, script demo ejecuta flujos FR sin bypass manual, documentación clara.

*Criterios de Aceptación*:
- Cobertura unit + integration ≥ 80% en auth, profile, oracle
- Script demo.sh ejecuta flujos completos y muestra respuestas HTTP
- Documentación de decisiones arquitectónicas en ARCHITECTURE.md
- Checklist rubrica completado y evidenciado

### T086-T087 Validación de cobertura

- [ ] T086 [P] Crear configuración `vitest.config.js` en `backend/` con coverage reports
- [ ] T087 Escribir resumen de cobertura en `backend/COVERAGE.md` — target ≥ 80%, excepciones documentadas

### T088-T089 Script de demostración

- [ ] T088 [P] Crear `backend/scripts/demo.sh` (bash) o `demo.ps1` (PowerShell) que:
  - Limpia/resetea base de datos
  - Registra owner y admin
  - Login, obtiene token
  - GET /profile/me (auth check)
  - PATCH upgrades (owner scope)
  - Intenta PATCH de tercero (403)
  - Login admin, GET /admin/profiles
  - GET /external/trivia, POST answer correcta, POST duplicada (409)
  - Simula OpenTDB caído, obtiene fallback local
- [ ] T089 Crear `DEMO_CHECKLIST.md` que evidencia cada punto de rubrica

### T090-T091 Documentación arquitectónica

- [ ] T090 [P] Crear `ARCHITECTURE.md` en raíz o `backend/ARCHITECTURE.md` con:
  - Overview flujo auth/profile/oracle
  - Decisiones de seguridad (JWT, bcrypt, CORS)
  - Mapeo entidades a endpoints
  - Estrategia de testing
  - Variables de entorno explicadas
- [ ] T091 Crear `DECISIONS.md` documentando:
  - Por qué JWT sin refresh (MVP)
  - Por qué Open Trivia Database
  - Por qué fallback local obligatorio
  - Por qué admin de solo lectura

### T092-T093 Checklist de rubrica

- [ ] T092 [P] Crear `RUBRIC_CHECKLIST.md` mapeando cada requerimiento de rubrica a tareas/tests realizados
- [ ] T093 Agregar checklist a este tasks.md y marcar completado tras validacion final

### T094 Validación final e integración

- [ ] T094 Ejecutar suite completa (lint + test + build + docker) y documentar en `VALIDATION.md`
- [ ] T094A Ejecutar prueba de carga reproducible (k6 o autocannon) para `/auth/login` y `/profile/me`, guardar reporte p95 en `backend/reports/performance.md`

---

## Dependencias y Ejecución

### Grafo de Dependencias Críticas

```
Fase 1 (Setup)
    ↓
Fase 2 (Auth) ← Backend ready, models basic
    ↓
Fase 3 (Profile) ← User model + Auth middlewares
    ↓
Fase 4 (Oracle) ← Profile model + API structure
    ↓
Fase 5 (Admin) ← GameRun model, Admin routes
    ↓
Fase 6 (Frontend) ← API completa prototipada
    ↓
Fase 7 (Mejoras Juego) ← Frontend integrado y backlog refinado
    ↓
Fase 8 (Docker/CI) ← Backend + Frontend + mejoras base
  ↓
Fase 9 (Validation) ← Todas fases completadas
```

### Oportunidades de Paralelización

- **T002-T005**: Setup configuración (parallelizable)
- **T006-T008**: Dependencias y server (parallelizable después de T002)
- **T046-T048**: Modelos Oracle (parallelizable)
- **T050-T053**: Integraciones OpenTDB (parallelizable)
- **T070-T075**: Componentes frontend (parallelizable)
- **T022-T027**: Dockerfiles y Compose (parallelizable)

### Orden de Ejecución Recomendado para MVP

1. **Fase 1 completa** (T001-T010) — infraestructura base
2. **Fase 2 completa** (T011-T021A) — autenticación funcional
3. **Fase 3 completa** (T035-T044) — perfil y persistencia
4. **Fase 4 completa** (T045-T061B) — oráculo con fallback
5. **Fase 5 completa** (T062A-T069) — historial y admin
6. **Fase 6 completa** (T070-T085) — integración UI obligatoria para cumplir FR-015 y SC-007
7. **Fase 7 (T085A-T085I)** — backlog de mejoras de juego antes de dockerización
8. **Fase 8 (T022-T034)** — Docker + CI/CD mínimo
9. **Fase 9 (T086-T094A)** — validación y demo

---

## Checklist de Validación Rubricable

### Inscripción: Requisitos Funcionales (FR)

- [ ] **FR-001**: Registro y login local ← Fase 2 (T016-T018, T017A)
- [ ] **FR-002**: JWT acceso 24h ← Fase 2 (T015)
- [ ] **FR-003**: Password hash bcrypt ← Fase 2 (T012, T014)
- [ ] **FR-004**: Auth requerida en perfil y oraculo ← Fase 3 (T040) + Fase 4 (T058)
- [ ] **FR-005**: Autorización roles owner/admin ← Fase 3 (T038, T043) + Fase 5 (T064-T067)
- [ ] **FR-006**: Admin de solo lectura global ← Fase 5 (T064-T067)
- [ ] **FR-007**: Owner edita solo propias mejoras ← Fase 3 (T043)
- [ ] **FR-008**: Persistencia upgrades ← Fase 3 (T036, T043)
- [ ] **FR-009**: Historial y partida en curso (checkpoint/resume) ← Fase 5 (T062-T063, T068A-T068E)
- [ ] **FR-010**: Endpoints REST ← Fases 2-6 completas
- [ ] **FR-011**: Oráculo baja probabilidad + garantía ← Fase 4 (T055-T061B)
- [ ] **FR-012**: Respuesta correcta → recompensa ← Fase 4 (T056-T061)
- [ ] **FR-013**: Respuesta incorrecta → daño ← Fase 4 (T056-T061)
- [ ] **FR-014**: OpenTDB + fallback local ← Fase 4 (T050-T054)
- [ ] **FR-015**: Frontend usa API propia (cero OpenTDB directo) ← Fase 6 (T085)
- [ ] **FR-016**: Registro + login + auth + autorizacion demostrado ← Fases 2-5 + Fase 9 (demo)
- [ ] **FR-017**: Trazabilidad de errores externos ← Fase 4 (T050-T055, T054A)

### Métricas de Éxito (SC)

- [ ] **SC-001**: Flujos rubrica demostrados sin bypass ← Fase 9 (T088-T089)
- [ ] **SC-002**: p95 < 2s en login/perfil (bajo carga academica) ← Fase 8-9 (T030A, T094A)
- [ ] **SC-003**: 100% actualizaciones upgrades persistidas ← Fase 3 (T043) + tests
- [ ] **SC-004**: Oráculo aparece ≥ 1 por run ← Fase 4 (T061A-T061B)
- [ ] **SC-005**: Fallback sin interrupciones ← Fase 4 (T055) + Fase 9 (demo)
- [ ] **SC-006**: Respuestas correctas/incorrectas aplicadas ← Fase 4 (T056-T061)
- [ ] **SC-007**: 0 llamadas directas OpenTDB ← Fase 6 (T085)

---

## Resumen de Ejecución

| Fase | Cantidad | Tareas Clave | Dependencias | Duración Est. |
|------|-------|-------------|---|---|
| 1 | 10 | Setup, config, models base | Ninguna | 2h |
| 2 | 14 | Auth, JWT, password hash, hardening seguridad | Fase 1 | 8h |
| 3 | 14 | Docker, compose, Actions, performance smoke | Fase 2 | 7h |
| 4 | 10 | Profile, CRUD, authz owner | Fase 3 | 5h |
| 5 | 20 | Oracle, OpenTDB, fallback, trazabilidad, garantía | Fase 4 | 12h |
| 6 | 13 | Admin, runs history, checkpoint/resume | Fase 5 | 7h |
| 7 | 16 | Components Vue3, API client | Fase 6 | 8h |
| 8 | 9 | Backlog expandible de mejoras gameplay/UX | Fase 7 | 4h |
| 9 | 10 | Coverage, demo, docs, benchmark reproducible | Todas | 5h |
| **TOTAL** | **116** | | | **~58h** |

**Scope MVP (Backend listo sin Docker)**: Fases 1-7 completas + Fase 8 (mejoras generales)
**Scope MVP (Solemne 3 Mínimo)**: Fases 1-8 completas (con Docker en Fase 3)
**Scope Completo**: Todas las fases = ~58h

---

## Próximos Pasos

1. **Validar este plan** con equipo (revisar dependencias, paralelización)
2. **Ejecutar Fase 1-2** en paralelo con setup de repositorio
3. **Validar Docker Fase 3** en environment de CI
4. **Iterar Fase 4-5-6** con TDD (tests first)
5. **Integrar frontend Fase 7** una vez API prototipada
6. **Refinar backlog de mejoras en Fase 8** antes de definir contenido específico
7. **Demostración Fase 9** con script y evidencia en DEMO_CHECKLIST.md

## Criterio de Cierre (Salida de Draft)

1. Checklist FR/SC completo sin contradicciones de trazabilidad.
2. Todas las tareas TDD críticas con orden test -> implementación.
3. Reanálisis de consistencia en estado READY.
4. Aprobación de alcance MVP por equipo/docente.

---

## Notas de Decisión

- **TDD obligatorio** en servicios y modelos clave (auth, oracle, profile)
- **Tests de integración** validan flujos end-to-end con MongoDB real o en-memory
- **Fallback local de trivia** garantiza resiliencia sin API externa
- **JWT 24h sin refresh** simplifica MVP; extensible post-Solemne 3
- **Admin de solo lectura** reduce complejidad; mutaciones siempre por owner
- **Docker desde el inicio** facilita reproducibilidad y entrega
- **CI/CD en GitHub Actions** automatiza validación de rubrica antes de merge

---

**Status**: READY v0.2.0 — Listo para ejecución inmediata.
