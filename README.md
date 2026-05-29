<div align="center">

# 🏴‍☠️ Fathom's End

**Un juego web de piratas, monstruos y decisiones imposibles.**

*Navega por mares sin nombre. Enfrenta criaturas que no deberían existir. Cada isla esconde una trampa o un tesoro — y tú no sabrás cuál hasta que elijas.*

![Sistema de Islas](src/assets/concept/exploracion/Sistema%20de%20islas.png)

</div>

---

## 📖 Descripción

**Fathom's End** es un juego web 2D híbrido ambientado en un universo pirata oscuro y sin ley. Combina dos fases de juego que se alternan constantemente:

- **Exploración:** Navegás por un mapa de islas tomando decisiones con consecuencias reales. Cada evento te muestra las probabilidades antes de actuar — pero el riesgo siempre está ahí.
- **Combate:** Cuando encontrás un jefe, el juego cambia a una arena de acción en tiempo real donde debés esquivar patrones de ataque y usar tus cartas para sobrevivir.

El corazón del juego es su **sistema de cartas**: las recolectás explorando el mundo y definen completamente tu estilo de juego — cartas de Acción para el combate, Pasivas que alteran tus estadísticas, y cartas de Utilidad que modifican las decisiones disponibles durante la exploración.

---

## 🎮 Mecánicas Principales

### 🗺️ Exploración basada en decisiones
Al llegar a una isla, el juego presenta un evento narrativo con varias opciones. Cada opción da rangos de recompensa o daño **despues de que elijas**. No hay trampa oculta — pero sí hay riesgo.

> *Ejemplo: "Entrar a las ruinas" Si caes en la trampa: 50% enfrentás al jefe del lugar, 50% recibís daño y salís con poco loot.*

### ⚔️ Combate estilo Bullet Hell
Los jefes tienen patrones de ataque telegrafíados. El jugador se mueve, esquiva y usa cartas en el momento correcto. No hay suerte — solo lectura y reacción.

### 🃏 Sistema de Cartas
Existen tres tipos de cartas que el jugador recolecta durante la partida:

| Tipo | Descripción |
|---|---|
| **Acción** | Habilidades activas para el combate (ataques, dash). Tienen tiempo de recarga. |
| **Pasiva** | Alteran las estadísticas base del jugador (velocidad, daño, vida máxima). |
| **Utilidad** | Se usan en la exploración para desbloquear nuevas opciones de decisión o mejorar las probabilidades a tu favor. |

### 🌊 Eventos oceánicos (Aun No Implementado)
Mientras navegás entre islas, pueden aparecer encuentros inesperados en el mar: el Kraken, tormentas, barcos enemigos o mercantes. Cada uno con sus propias decisiones. 

### 🏝️ Mapa generado por partida
El mundo usa un pool fijo de islas diseñadas a mano que se distribuyen aleatoriamente en el mapa al inicio de cada partida. Algunas islas tienen siempre el mismo jefe — su posición en el mapa cambia, su contenido no.

---

## 🖼️ Imágenes de Concepto

### 🎭 Diseño
![Pelea contra el Kraken](src/assets/concept/diseno/Pelea%20Kraken.png)

### ⚔️ Combate
![Sistema de Peleas](src/assets/concept/combate/Peleas.png)

### 🗺️ Exploración
![Sistema de Islas](src/assets/concept/exploracion/Sistema%20de%20islas.png)

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Framework Frontend | Vue.js 3 (Composition API) |
| Motor de Combate | PixiJS |
| Lógica del Juego | JavaScript Puro |
| Estado Global | Pinia |
| Pruebas Unitarias | Vitest |
| Linter / Formato | ESLint + Prettier |
| Gestor de Paquetes | pnpm |
| Contenedores | Docker |
| CI/CD | GitHub Actions |

---

## 🎮 Cómo Jugar

Requisitos en el PC:

- **Docker Desktop** instalado y corriendo.

Pasos:

```bash
# 1. Descargar la imagen desde DockerHub
docker pull oskarrehbein/fathoms-end:0.1.1

# 2. Ejecutar el contenedor
docker run -d -p 80:934 oskarrehbein/fathoms-end:0.1.1
```

3. Abre el juego en tu navegador 👉 **[http://localhost:80](http://localhost:80)**


🔗 **DockerHub:** [hub.docker.com/repository/docker/oskarrehbein/fathoms-end/general](https://hub.docker.com/repository/docker/oskarrehbein/fathoms-end/general)

---

## 👥 Equipo

Proyecto desarrollado para la asignatura **Aplicaciones y Tecnologías Web**
Profesor: Cristhian Aguilera | Universidad San Sebastián

- **Matías Cárcamo**
- **Oskar Rehbein**