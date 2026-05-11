<script setup>
/**
 * @description Title screen. Entry point of every run.
 *              The "Nueva Partida" button navigates to deck selection where
 *              the player chooses an archetype before the run begins (FR-012).
 */
import { useRouter } from 'vue-router'
import Button from '@/components/shared/Button.vue'

const router = useRouter()

/**
 * @description Navigates to the deck selection screen to start a new run.
 * @returns {void}
 */
function handleNewGame() {
  router.push({ name: 'deck-select' })
}
</script>

<template>
  <main class="menu">
    <h1 class="menu__title">
      ⚓ Fathom's End
    </h1>
    <p class="menu__subtitle">
      Un roguelike de piratas y abismos
    </p>
    <Button
      variant="primary"
      @click="handleNewGame"
    >
      Nueva Partida
    </Button>
  </main>
</template>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1.5rem;
  background: #0d1117;
  color: #cdd6f4;
}
.menu__title {
  font-size: 3rem;
  font-weight: 800;
  color: #d4a017;
  margin: 0;
}
.menu__subtitle {
  font-size: 1.1rem;
  color: #6c7a9c;
  margin: 0;
}
</style>

