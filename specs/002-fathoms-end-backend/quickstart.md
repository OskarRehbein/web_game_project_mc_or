# Inicio Rápido - Funcionalidad 002 Backend Fullstack

## 1. Objetivo
Levantar frontend + backend + MongoDB y validar los flujos exigidos por rubrica:
- register
- login
- autenticacion en endpoint protegido
- autorizacion owner/admin
- mecanica Oraculo con fallback

## 2. Requisitos
- Node.js 22 LTS
- pnpm 9+
- Docker Desktop con Compose v2

## 3. Variables de entorno backend (.env)
- NODE_ENV=development
- PORT=3000
- MONGODB_URI=mongodb://mongodb:27017/fathoms_end
- JWT_SECRET=replace_with_strong_secret
- JWT_EXPIRES_IN=24h
- BCRYPT_SALT_ROUNDS=12
- ORACLE_BASE_PROBABILITY=0.08
- ORACLE_FORCE_AT_STEP=8
- ORACLE_LOW_PROB_MODE=true
- OPENTDB_BASE_URL=https://opentdb.com
- OPENTDB_TIMEOUT_MS=2500
- ORACLE_FALLBACK_PATH=./src/data/local-question-bank.json
- LOG_LEVEL=info
- CORS_ORIGIN=http://localhost:5173

## 4. Variables compose (.env.compose o environment)
- COMPOSE_PROJECT_NAME=fathoms_end
- FRONTEND_PORT=5173
- BACKEND_PORT=3000
- MONGODB_PORT=27017
- MONGO_INITDB_DATABASE=fathoms_end

## 5. Levantar stack con Docker Compose
1. docker compose up --build -d
2. Verificar healths:
   - Backend: GET http://localhost:3000/health
   - Frontend: http://localhost:5173
   - Mongo: puerto 27017 abierto

## 6. Flujo minimo de validacion rubricable
1. Registrar owner:
   - POST /auth/register
2. Login owner:
   - POST /auth/login (capturar accessToken)
3. Probar auth protegida:
   - GET /profile/me sin token => 401
   - GET /profile/me con token => 200
4. Probar owner scope:
   - PATCH /profile/upgrades propio => 200
5. Probar admin readonly:
   - Login admin
   - GET /admin/profiles => 200
   - PATCH /profile/upgrades de tercero => 403
6. Probar Oraculo:
   - GET /external/trivia/random (autenticado)
   - POST /game/oracle/answer correcta => legendaryReward
   - POST /game/oracle/answer duplicada => 409
7. Probar fallback:
   - Simular timeout OpenTDB
   - GET /external/trivia/random => source=local

## 7. Pruebas automatizadas
- Backend unit: pnpm --filter backend test:unit
- Backend integration: pnpm --filter backend test:integration
- Frontend integration checks API: pnpm test -- oracle|auth|profile

## 8. Evidencia para demo
- Captura de respuestas HTTP (200/401/403/409)
- Log backend mostrando fallback local
- Persistencia upgrades visible tras re-login
- Ejecucion verde de lint/test/build en CI
