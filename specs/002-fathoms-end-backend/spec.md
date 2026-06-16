# Especificación de Funcionalidad: Fathom's End - Backend y Persistencia Fullstack

**Rama de Funcionalidad**: `002-fathoms-end-backend`  
**Creado**: 2026-06-15  
**Estado**: Listo  
**Entrada**: Re-planificación de Solemne 3 para migrar a fullstack con persistencia, autenticación y mecánica del Oráculo

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Registro, Login y Acceso Seguro al Perfil (Prioridad: P1)

Como jugador, quiero registrarme e iniciar sesión para acceder a mi perfil persistente y continuar mi progreso entre partidas.

**Por qué esta prioridad**: La rúbrica exige registro + login + autenticación + autorización. Sin esta base, el backend no entrega valor evaluable.

**Prueba Independiente**: Se prueba de forma independiente consumiendo endpoints de auth y perfil con y sin token, validando el control de acceso.

**Escenarios de Aceptación**:

1. **Dado** un usuario no registrado, **Cuando** envía datos válidos a registro, **Entonces** se crea su cuenta y puede autenticarse.
2. **Dado** un usuario registrado, **Cuando** inicia sesión con credenciales correctas, **Entonces** recibe un JWT válido por 24 horas.
3. **Dado** una petición a perfil sin token o con token inválido, **Cuando** intenta acceder a su perfil, **Entonces** el sistema rechaza el acceso.
4. **Dado** un usuario autenticado, **Cuando** consulta su perfil, **Entonces** recibe solo su propia información (owner scope).

---

### Historia de Usuario 2 - Progresión Roguelite Persistente por Mejoras (Prioridad: P1)

Como jugador autenticado, quiero guardar mejoras permanentes de mi perfil (damage, maxHp, speed) para sentir progreso entre runs.

**Por qué esta prioridad**: Es el principal cambio funcional respecto al core previo y corrige la falta de persistencia detectada en evaluaciones anteriores.

**Prueba Independiente**: Se prueba con PATCH de mejoras y consulta de perfil, verificando persistencia real y reglas de autorización owner/admin.

**Escenarios de Aceptación**:

1. **Dado** un owner autenticado, **Cuando** actualiza mejoras válidas, **Entonces** el sistema persiste los nuevos valores y responde con el perfil actualizado.
2. **Dado** un usuario autenticado, **Cuando** intenta actualizar un perfil que no le pertenece, **Entonces** la operación es rechazada.
3. **Dado** un admin, **Cuando** consulta perfiles/runs para auditoría, **Entonces** puede leer información global pero no modificar mejoras de terceros.

---

### Historia de Usuario 3 - Mecánica Oráculo con API Externa y Fallback (Prioridad: P1)

Como jugador en una run, quiero enfrentar el evento especial "El Oráculo del Mar" con una pregunta de trivia para obtener recompensa legendaria si acierto o daño si fallo.

**Por qué esta prioridad**: Introduce una nueva mecánica/pantalla obligatoria para Solemne 3 y demuestra integración REST externa con manejo de fallos.

**Prueba Independiente**: Se prueba aislando el endpoint de trivia y el endpoint de respuesta del oráculo, forzando tanto el éxito externo como el fallback local.

**Escenarios de Aceptación**:

1. **Dado** una run autenticada, **Cuando** se solicita trivia para el Oráculo, **Entonces** el backend obtiene una pregunta desde OpenTDB o el fallback local si falla el externo.
2. **Dado** una respuesta correcta del jugador, **Cuando** se valida en el backend, **Entonces** se retorna una recompensa legendaria garantizada.
3. **Dado** una respuesta incorrecta, **Cuando** se valida en el backend, **Entonces** se aplica una penalización de daño.
4. **Dado** una run nueva, **Cuando** se completa su flujo de exploración, **Entonces** el Oráculo aparece con baja probabilidad pero al menos una vez por run según un parámetro configurable.

---

### Historia de Usuario 4 - Historial de Runs y Auditoría (Prioridad: P2)

Como jugador y como admin, quiero disponer de historial de runs y guardado de partida en curso para la trazabilidad de resultados, la continuidad y el análisis posterior.

**Por qué esta prioridad**: Aporta auditabilidad y evidencia de persistencia, pero no bloquea el MVP de autenticación + progresión + oráculo.

**Prueba Independiente**: Se prueba registrando la finalización de runs y consultando el historial; el admin es de solo lectura global.

**Escenarios de Aceptación**:

1. **Dado** una run terminada, **Cuando** se registra su resultado, **Entonces** queda disponible en el historial persistente.
2. **Dado** un owner autenticado, **Cuando** consulta su historial, **Entonces** solo ve sus runs.
3. **Dado** un admin, **Cuando** consulta runs globales, **Entonces** obtiene visibilidad de auditoría sin permisos de escritura.
4. **Dado** una run en progreso de un owner autenticado, **Cuando** guarda checkpoint y luego reingresa, **Entonces** puede recuperar su estado sin acceder a runs de otros usuarios.

---

### Historia de Usuario 5 - Pantallas Fullstack de Perfil y Evento Oráculo (Prioridad: P2)

Como jugador, quiero ver pantallas claras de autenticación, perfil persistente y evento del Oráculo para interactuar con el backend sin llamadas directas a OpenTDB desde el frontend.

**Por qué esta prioridad**: Cubre el requisito de nuevas pantallas/mecánicas y la separación correcta frontend-backend.

**Prueba Independiente**: Se prueba navegando por el flujo UI (registro/login/perfil/oráculo) y verificando que todas las operaciones pasan por la API propia.

**Escenarios de Aceptación**:

1. **Dado** el frontend en ejecución, **Cuando** el usuario abre auth y perfil, **Entonces** toda la data proviene de la API del proyecto.
2. **Dado** el flujo de Oráculo activo, **Cuando** el frontend solicita una pregunta, **Entonces** nunca consume OpenTDB directamente.

### Casos Límite

- Registro con email duplicado: debe rechazarse con un mensaje claro y sin crear una cuenta duplicada.
- Login con password incorrecta: no debe revelar si el email existe.
- JWT expirado (24h): acceso denegado hasta un nuevo login.
- OpenTDB caído, con timeout o con response_code sin preguntas: usar el banco local JSON sin bloquear el evento.
- Doble envío de respuesta del Oráculo para la misma pregunta: solo la primera respuesta debe ser válida.
- Garantía de aparición del Oráculo: si no salió por probabilidad durante la run, debe forzarse antes de finalizarla.
- Reconexión de un owner durante una run en progreso: debe recuperar un checkpoint válido o recibir una respuesta controlada de no disponible.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE implementar registro y login local con credenciales de usuario.
- **FR-002**: El sistema DEBE emitir un token JWT de acceso con expiración de 24 horas tras un login exitoso.
- **FR-003**: El sistema DEBE aplicar hash de password antes de persistir credenciales.
- **FR-004**: El sistema DEBE requerir autenticación para consultar el perfil propio y responder el evento Oráculo.
- **FR-005**: El sistema DEBE aplicar autorización basada en roles owner y admin.
- **FR-006**: El rol admin DEBE tener acceso global de solo lectura sobre perfiles y runs.
- **FR-007**: El owner DEBE poder editar solo sus propias mejoras persistentes de damage, maxHp y speed.
- **FR-008**: El sistema DEBE persistir las mejoras de perfil entre runs para la progresión roguelite.
- **FR-009**: El sistema DEBE almacenar el historial de runs para auditoría y soportar el guardado/recuperación de partida en curso por owner (checkpoint/resume).
- **FR-010**: El backend DEBE exponer endpoints REST para autenticación, perfil, oráculo y trivia.
- **FR-011**: El evento "El Oráculo del Mar" DEBE usar una probabilidad base configurable entre 10% y 25% por paso/evento (`ORACLE_BASE_PROBABILITY`) y garantizar al menos una aparición por run forzando el evento en o antes del umbral configurable (`ORACLE_FORCE_AT_STEP`).
- **FR-012**: Una respuesta correcta al Oráculo DEBE otorgar una recompensa legendaria garantizada.
- **FR-013**: Una respuesta incorrecta al Oráculo DEBE aplicar una penalización de daño.
- **FR-014**: El backend DEBE consumir OpenTDB como fuente primaria de preguntas y usar un fallback local JSON ante fallo o respuesta vacía.
- **FR-015**: El frontend DEBE consumir exclusivamente la API propia del proyecto para las mecánicas de trivia y oráculo.
- **FR-016**: El cumplimiento de la rúbrica DEBE incluir explícitamente registro + login + autenticación + autorización; el login por sí solo NO es suficiente.
- **FR-017**: El sistema DEBE mantener la trazabilidad de errores en la integración externa para diagnóstico y continuidad del juego.

### Contrato de Endpoints MVP

- **POST /auth/register**: crea una cuenta local.
- **POST /auth/login**: valida credenciales y entrega un JWT de acceso de 24h.
- **GET /profile/me**: requiere auth; retorna el perfil del owner autenticado.
- **PATCH /profile/upgrades**: requiere auth y owner; actualiza las mejoras persistentes permitidas.
- **GET /external/trivia/random**: **requiere auth**; retorna una pregunta normalizada para el evento Oráculo.
  - Justificación: reduce el abuso del endpoint, mantiene la trazabilidad por usuario/run y alinea el consumo al flujo de juego autenticado.
- **POST /game/oracle/answer**: requiere auth; valida la respuesta y devuelve reward/penalty.

### Arquitectura Fullstack (alcance funcional)

- Frontend web: gestiona las pantallas de auth, perfil y evento Oráculo.
- API REST propia: única capa que expone el contrato al frontend.
- Persistencia documental: perfiles, mejoras y runs históricos.
- Integración externa: el backend orquesta OpenTDB y el fallback local; el cliente nunca habla con OpenTDB.

### Entidades Clave *(incluir si la funcionalidad involucra datos)*

- **User**: identidad autenticable del jugador.
  - Campos clave: id, email, passwordHash, role (owner/admin), createdAt, lastLoginAt.
- **Profile**: estado persistente de progreso por usuario.
  - Campos clave: userId, upgrades { damage, maxHp, speed }, updatedAt.
- **GameRun**: sesión jugable auditable.
  - Campos clave: id, userId, startedAt, endedAt, oracleGuaranteed, oracleAppeared, result, damageTaken, rewards.
- **OracleQuestion**: pregunta normalizada para uso interno.
  - Campos clave: source (opentdb/local), externalId opcional, question, correctAnswer, incorrectAnswers, difficulty, category.
- **OracleAttempt**: respuesta del jugador al Oráculo.
  - Campos clave: runId, userId, questionId/hash, selectedAnswer, isCorrect, effectApplied, answeredAt.
- **RewardLedger**: registro de recompensas/penalizaciones aplicadas.
  - Campos clave: runId, type (legendaryReward/damagePenalty), payload, appliedAt.

### Integración Externa REST (OpenTDB)

- **API externa elegida**: Open Trivia Database (sin API key).
- **Endpoint principal consumido**:
  - GET https://opentdb.com/api.php?amount=1&type=multiple
- **Endpoint opcional de control de sesión (si aplica en la implementación)**:
  - GET https://opentdb.com/api_token.php?command=request
- **Mapeo de la respuesta externa al modelo interno**:
  - question -> OracleQuestion.question
  - correct_answer -> OracleQuestion.correctAnswer
  - incorrect_answers[] -> OracleQuestion.incorrectAnswers[]
  - category -> OracleQuestion.category
  - difficulty -> OracleQuestion.difficulty
- **Fallback local obligatorio**:
  - Si OpenTDB retorna error, timeout, payload inválido o cero preguntas, se usa el banco local JSON versionado por el proyecto.
- **Manejo de fallas**:
  - Nunca bloquear la partida por una falla externa.
  - Registrar la causa del fallback para auditoría.
  - Responder al frontend con una pregunta válida desde la fuente disponible.

### Seguridad y Autenticación

- Autenticación local obligatoria en el MVP con register/login.
- Hashing de password obligatorio antes de la persistencia.
- JWT access token único con expiración fija de 24h.
- Google login queda como objetivo adicional (stretch goal), fuera del MVP.
- Regla owner: acceso de lectura/escritura solo sobre su propio perfil y acciones de run.
- Regla admin: lectura global de perfiles/runs, sin permisos de mutación.
- Validación de autorización en cada endpoint protegido.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: 100% de los flujos de rúbrica (register, login, autenticación de endpoint protegido y autorización owner/admin) se demuestran en pruebas funcionales sin bypass manual.
- **SC-002**: Al menos el 95% de las solicitudes válidas a login y perfil completan en menos de 2 segundos bajo la carga académica esperada, con medición reproducible (k6 o autocannon) y reporte versionado.
- **SC-003**: 100% de las actualizaciones válidas de upgrades (damage, maxHp, speed) quedan persistidas y recuperables en sesiones posteriores.
- **SC-004**: El evento Oráculo aparece al menos 1 vez en el 100% de las runs completas, respetando la baja probabilidad en apariciones no forzadas.
- **SC-005**: En el 100% de los fallos simulados de OpenTDB, el sistema responde con el fallback local sin interrumpir la continuidad del juego.
- **SC-006**: 100% de las respuestas correctas al Oráculo entregan recompensa legendaria y el 100% de las respuestas incorrectas aplican daño.
- **SC-007**: 0 llamadas directas del frontend a OpenTDB detectadas durante las pruebas de integración.

## Supuestos

- Se mantiene la arquitectura web cliente-servidor con API REST y persistencia documental para el alcance de Solemne 3.
- El rol admin existe para supervisión académica/operativa y no participa como jugador competitivo.
- El historial de runs puede crecer sin políticas avanzadas de retención en esta fase.
- La configuración de probabilidad del Oráculo se controla por parámetro de juego y puede ajustarse sin cambiar las reglas funcionales.
- El reset de nombres en DockerHub se considera un requisito de entrega pero no altera el comportamiento funcional del juego.

## Fuera de Alcance

- Login social con Google en el MVP (queda como objetivo adicional).
- Matchmaking o multijugador en tiempo real.
- Frontend consumiendo APIs externas de forma directa.
- Balanceo avanzado de economía más allá de la mecánica del Oráculo y las mejoras persistentes.

## Aclaraciones

### Sesión 2026-06-15

- Stack backend acordado: Node.js + Express + Mongoose.
- Persistencia acordada: MongoDB para usuarios, perfiles, mejoras y runs.
- Auth acordada: register/login local obligatorio, JWT access token de 24h, sin refresh token en el MVP.
- Login Google: solo objetivo adicional.
- Roles y autorización: owner + admin; el admin es de lectura global en perfiles/runs.
- Progresión roguelite persistente: upgrades persistidos de damage, maxHp y speed; historial de runs para auditoría.
- API externa seleccionada: OpenTDB sin API key.
- Mecánica nueva acordada: "El Oráculo del Mar" con baja probabilidad pero mínimo 1 aparición garantizada por run (configurable).
- Resultado Oráculo: acierto = recompensa legendaria garantizada; error = daño.
- Fallback obligatorio: banco local JSON si OpenTDB falla o no trae preguntas.
- Capa de integración: el backend consume OpenTDB; el frontend nunca lo consume directamente.
- Rúbrica explicitada: register + login + autenticación + autorización son obligatorios; el login aislado no cumple.
