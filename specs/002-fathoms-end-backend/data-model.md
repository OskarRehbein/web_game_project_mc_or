# Fase 1 - Modelo de Datos (002-fathoms-end-backend)

## 1. User (Usuario)
- Colección: users
- Propósito: Identidad autenticable y rol de acceso.
- Campos:
  - _id: ObjectId
  - email: string, requerido, único, minúsculas, sin espacios
  - passwordHash: string, requerido
  - role: enum(owner, admin), por defecto owner
  - createdAt: date
  - updatedAt: date
  - lastLoginAt: date | null
- Índices:
  - único(email)
  - índice(role)
- Restricciones:
  - Email válido según RFC básico.
  - El passwordHash nunca se expone en respuestas de la API.

## 2. Profile (Perfil)
- Colección: profiles
- Propósito: Estado persistente de progresión roguelite.
- Campos:
  - _id: ObjectId
  - userId: ObjectId ref users, requerido, único
  - upgrades.damage: number, requerido, min 0, max 999
  - upgrades.maxHp: number, requerido, min 1, max 9999
  - upgrades.speed: number, requerido, min 0, max 999
  - createdAt: date
  - updatedAt: date
- Índices:
  - único(userId)
- Restricciones:
  - Solo el owner del perfil puede mutar sus upgrades.
  - El admin es de solo lectura global.

## 3. GameRun (Partida)
- Colección: game_runs
- Propósito: Trazabilidad de sesiones de juego y estado del Oráculo.
- Campos:
  - _id: ObjectId
  - userId: ObjectId ref users, requerido
  - startedAt: date, requerido
  - endedAt: date | null
  - status: enum(active, completed, abandoned), por defecto active
  - result: enum(victory, defeat, abandoned) | null
  - oracle:
    - guaranteed: boolean, requerido
    - appeared: boolean, por defecto false
    - forcedAtStep: number | null
    - currentQuestionHash: string | null
    - currentQuestionSource: enum(opentdb, local) | null
  - metrics:
    - damageTaken: number, por defecto 0
    - rewardCount: number, por defecto 0
  - createdAt: date
  - updatedAt: date
- Índices:
  - índice(userId, startedAt desc)
  - índice(status)
  - índice(endedAt)
- Restricciones:
  - Una única run activa por usuario (opcional en MVP vía validación de aplicación).
  - Si status = completed, endedAt es obligatorio.

## 4. OracleAttempt (Intento del Oráculo)
- Colección: oracle_attempts
- Propósito: Idempotencia y auditoría de respuestas del Oráculo.
- Campos:
  - _id: ObjectId
  - runId: ObjectId ref game_runs, requerido
  - userId: ObjectId ref users, requerido
  - questionHash: string, requerido
  - selectedAnswer: string, requerido
  - correctAnswer: string, requerido
  - isCorrect: boolean, requerido
  - effectApplied:
    - type: enum(legendaryReward, damagePenalty), requerido
    - payload: object
  - source: enum(opentdb, local), requerido
  - answeredAt: date, requerido
  - createdAt: date
  - updatedAt: date
- Índices:
  - único(runId, questionHash)
  - índice(userId, answeredAt desc)
- Restricciones:
  - La primera respuesta es válida; los reintentos devuelven conflicto (409) sin volver a aplicar el efecto.

## 5. RewardLedger (Registro de Recompensas)
- Colección: reward_ledger
- Propósito: Evidencia de efectos aplicados por run.
- Campos:
  - _id: ObjectId
  - runId: ObjectId ref game_runs, requerido
  - userId: ObjectId ref users, requerido
  - type: enum(legendaryReward, damagePenalty), requerido
  - payload: object, requerido
  - appliedAt: date, requerido
  - createdAt: date
  - updatedAt: date
- Índices:
  - índice(runId, appliedAt desc)
  - índice(userId, appliedAt desc)

## 6. LocalQuestionBank (Banco local de preguntas, archivo)
- Almacenamiento: backend/src/data/local-question-bank.json
- Propósito: Fuente de fallback cuando OpenTDB falla o no entrega preguntas.
- Esquema de cada ítem:
  - id: string
  - question: string
  - correctAnswer: string
  - incorrectAnswers: string[] (longitud 3)
  - category: string
  - difficulty: enum(easy, medium, hard)

## Relaciones
- User 1:1 Profile
- User 1:N GameRun
- GameRun 1:N OracleAttempt
- GameRun 1:N RewardLedger

## Reglas de transición de estado
- Run:
  - active -> completed (victory/defeat)
  - active -> abandoned
- Oráculo dentro de la run:
  - pending -> asked (questionHash asignado)
  - asked -> answered (OracleAttempt creado, currentQuestionHash en null)
