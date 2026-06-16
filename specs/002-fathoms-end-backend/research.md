# Fase 0 - Investigación (002-fathoms-end-backend)

## Decisión 1: Stack backend y versionado base
- Decisión: Implementar backend con Node.js 22 LTS, Express 5, Mongoose 8 y MongoDB 7.
- Justificación: Mantiene decisiones ya acordadas, acelera la entrega por curva conocida y facilita el despliegue con Docker oficial.
- Alternativas consideradas: Fastify (mejor rendimiento bruto, pero menor alineación con el conocimiento actual del equipo), NestJS (más estructura, pero sobrecosto para Solemne 3).

## Decisión 2: Autenticación y sesiones
- Decisión: JWT access token único (24h), sin refresh token en el MVP; login local obligatorio.
- Justificación: Cumple la rúbrica con complejidad controlada; evita flujos extra (rotación/revocación avanzada) fuera de alcance.
- Alternativas consideradas: JWT + refresh token (más seguro para sesiones largas, pero mayor costo de implementación), cookies de sesión server-side (requiere manejo de estado y CSRF adicional).

## Decisión 3: Roles y autorización
- Decisión: Modelo RBAC mínimo con roles owner y admin; admin con lectura global sobre perfiles y runs, sin permisos de mutación.
- Justificación: Refleja el requisito funcional exacto y reduce el riesgo de abuso de privilegios.
- Alternativas consideradas: ACL por recurso completa (excesiva para MVP), solo owner sin admin (no cumple la necesidad de auditoría académica).

## Decisión 4: Modelo de persistencia de progresión
- Decisión: Persistir las upgrades del perfil en un documento dedicado (Profile), separado de User y GameRun.
- Justificación: Aísla la seguridad (credenciales) de la progresión, simplifica las consultas y evita acoplar datos de run con estado permanente.
- Alternativas consideradas: Embeber las upgrades en User (simple, pero mezcla dominios), guardar el progreso solo al cerrar la run (pierde robustez ante caídas).

## Decisión 5: Integración de trivia externa
- Decisión: OpenTDB como fuente primaria y banco local JSON como fallback obligatorio, con una normalización interna común.
- Justificación: Garantiza la continuidad del juego ante fallas externas y desacopla el frontend de la API de terceros.
- Alternativas consideradas: Solo OpenTDB (alto riesgo operativo), solo banco local (pierde el requisito de integración REST externa).

## Decisión 6: Idempotencia de la respuesta del Oráculo
- Decisión: Registrar el intento por (runId, questionHash) con índice único y estado de pregunta activa en la run.
- Justificación: Previene doble recompensa/penalización por reenvío o condiciones de carrera.
- Alternativas consideradas: Control solo en memoria (se pierde entre reinicios), bloqueo por usuario sin run (demasiado amplio, falsos positivos).

## Decisión 7: Garantía de aparición del Oráculo
- Decisión: Probabilidad baja por evento y garantía de al menos una aparición por run usando la bandera oracleAppeared + validación en el cierre de la run.
- Justificación: Cumple el requisito de diseño sin romper la dinámica aleatoria.
- Alternativas consideradas: Aparición fija por run (elimina la incertidumbre), solo probabilidad sin garantía (no cumple FR-011/SC-004).

## Decisión 8: Estrategia de testing
- Decisión: Backend con pruebas unitarias (servicios/middlewares) + integración de la API con un Mongo de pruebas; frontend con checks de integración de la API (sin llamadas directas a OpenTDB).
- Justificación: Cobertura enfocada en la rúbrica y en los riesgos críticos de autenticación/autorización/persistencia.
- Alternativas consideradas: Solo unit tests (insuficiente para contratos HTTP), E2E completo fullstack desde el inicio (costo alto para la ventana de Solemne 3).

## Decisión 9: Contenerización y despliegue
- Decisión: Docker Compose con frontend (Vite build + Nginx), backend (Node) y MongoDB; CI que separa lint/test/build e imágenes.
- Justificación: Entrega reproducible y demostrable en la evaluación.
- Alternativas consideradas: Despliegue manual local sin compose (menos repetible), servicios separados sin red de compose (más fricción).

## Decisión 10: Observabilidad mínima
- Decisión: Logging estructurado en el backend (request id, endpoint, fuente de fallback, errores de integración).
- Justificación: Facilita la demo de cumplimiento y el diagnóstico sin un stack complejo de observabilidad.
- Alternativas consideradas: Sin logs estructurados (riesgo alto en la demo), stack ELK completo (fuera de alcance).
