import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'

/**
 * @description Defines all application routes with lazy-loading.
 * Las 7 rutas del juego: menu, seleccion de mazo, mapa, combate, recompensa, game over, victoria.
 * Todas las vistas se cargan bajo demanda para optimizar el bundle inicial (FR-047).
 */
const routes = [
  {
    path: '/',
    name: 'menu',
    component: () => import('@/views/MainMenu.vue'),
  },
  {
    path: '/deck-select',
    name: 'deck-select',
    component: () => import('@/views/DeckSelectionView.vue'),
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/MapView.vue'),
  },
  {
    path: '/combat',
    name: 'combat',
    component: () => import('@/views/CombatView.vue'),
  },
  {
    path: '/reward',
    name: 'reward',
    component: () => import('@/views/RewardScreen.vue'),
  },
  {
    path: '/gameover',
    name: 'gameover',
    component: () => import('@/views/GameOverView.vue'),
  },
  {
    path: '/victory',
    name: 'victory',
    component: () => import('@/views/VictoryView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * @description Global navigation guard that blocks access to phase-sensitive routes
 *              when the game has not started (currentPhase === 'menu').
 *              Prevents the player from navigating directly to /combat or /reward
 *              without going through the proper game flow (FR-001, FR-002).
 * @param {import('vue-router').RouteLocationNormalized} to - Target route
 * @returns {void | { name: string }} Redirect to 'menu' if access is blocked; undefined otherwise
 */
router.beforeEach((to) => {
  const blocked = ['combat', 'reward']
  if (blocked.includes(to.name)) {
    try {
      const gameStore = useGameStore()
      if (gameStore.currentPhase === 'menu') {
        return { name: 'menu' }
      }
    } catch {
      // Pinia not yet initialized during SSR/tests — allow navigation
    }
  }
})

export default router
