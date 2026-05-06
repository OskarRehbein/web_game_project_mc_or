<template>
  <nav v-if="isDev" class="dev-nav">
    <span class="dev-label">🛠 DEV</span>
    <RouterLink
      v-for="route in devRoutes"
      :key="route.to"
      :to="route.to"
      class="dev-tab"
      active-class="dev-tab--active"
    >
      {{ route.icon }} {{ route.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
/**
 * @description Barra de navegación rápida visible solo en modo desarrollo (import.meta.env.DEV).
 *              Permite saltar directamente a cualquier vista sin seguir el flujo del juego.
 *              No se incluye en el bundle de producción porque el template tiene v-if="isDev".
 */
const isDev = import.meta.env.DEV

const devRoutes = [
  { to: '/',            icon: '🏠', label: 'Menú'        },
  { to: '/deck-select', icon: '🃏', label: 'Deck Select' },
  { to: '/map',         icon: '🗺️', label: 'Mapa (Oskar)' },
  { to: '/combat',      icon: '⚔️', label: 'Combate'     },
  { to: '/reward',      icon: '💰', label: 'Recompensa'  },
  { to: '/gameover',    icon: '💀', label: 'Game Over'   },
  { to: '/victory',     icon: '🏆', label: 'Victoria'    },
]
</script>

<style scoped>
.dev-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #1a0a2e;
  border-top: 2px solid #ff6b35;
  padding: 4px 8px;
  z-index: 9999;
  font-size: 12px;
}

.dev-label {
  color: #ff6b35;
  font-weight: bold;
  margin-right: 8px;
  white-space: nowrap;
}

.dev-tab {
  color: #aaa;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}

.dev-tab:hover {
  color: #fff;
  background: #2a1a4e;
  border-color: #555;
}

.dev-tab--active {
  color: #fff;
  background: #ff6b35;
  border-color: #ff6b35;
}
</style>
