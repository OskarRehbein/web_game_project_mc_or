<template>
  <div class="deck-viewer">
    <h2 class="deck-viewer__title">
      🃏 Tu Mazo <span class="deck-viewer__count">({{ deckStore.cards.length }})</span>
    </h2>

    <div
      v-if="deckStore.cards.length === 0"
      class="deck-viewer__empty"
    >
      <p>El mazo está vacío.</p>
    </div>

    <template v-else>
      <!-- Action cards -->
      <section
        v-if="deckStore.actionCards.length"
        class="deck-viewer__section"
      >
        <h3 class="deck-viewer__section-title">
          ⚡ Acción ({{ deckStore.actionCards.length }})
        </h3>
        <div class="deck-viewer__grid">
          <CardThumbnail
            v-for="card in deckStore.actionCards"
            :key="card.id + '-' + Math.random()"
            :card="card"
          />
        </div>
      </section>

      <!-- Passive cards -->
      <section
        v-if="deckStore.passiveCards.length"
        class="deck-viewer__section"
      >
        <h3 class="deck-viewer__section-title">
          🛡️ Pasiva ({{ deckStore.passiveCards.length }})
        </h3>
        <div class="deck-viewer__grid">
          <CardThumbnail
            v-for="card in deckStore.passiveCards"
            :key="card.id + '-' + Math.random()"
            :card="card"
          />
        </div>
      </section>

      <!-- Utility cards -->
      <section
        v-if="deckStore.utilityCards.length"
        class="deck-viewer__section"
      >
        <h3 class="deck-viewer__section-title">
          🔧 Utilidad ({{ deckStore.utilityCards.length }})
        </h3>
        <div class="deck-viewer__grid">
          <CardThumbnail
            v-for="card in deckStore.utilityCards"
            :key="card.id + '-' + Math.random()"
            :card="card"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { useDeckStore } from '@/stores/deckStore.js'
import CardThumbnail from './CardThumbnail.vue'

const deckStore = useDeckStore()
</script>

<style scoped>
.deck-viewer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: #071220;
  border-radius: 12px;
  color: #e8e8f0;
}

.deck-viewer__title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.deck-viewer__count {
  font-weight: 400;
  color: #7788aa;
}

.deck-viewer__empty {
  color: #556677;
  font-size: 0.9rem;
  text-align: center;
  padding: 24px 0;
}

.deck-viewer__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deck-viewer__section-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7788aa;
  margin: 0;
}

.deck-viewer__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
