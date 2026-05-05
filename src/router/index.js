import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.js'

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

// Guard: block /combat and /reward when game hasn't started yet
router.beforeEach((to) => {
  const blocked = ['combat', 'reward']
  if (blocked.includes(to.name)) {
    try {
      const gameStore = useGameStore()
      if (gameStore.currentPhase === 'menu') {
        return { name: 'menu' }
      }
    } catch {
      // Pinia not yet initialized during SSR/tests — let it through
    }
  }
})

export default router
