<template>
  <RouterView />
</template>

<script setup>
// Root component — renders the active route view.
// All layout chrome (nav, global modals) lives here in later phases.
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  background: #0a0a1a;
  color: #e8e8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
</style>
