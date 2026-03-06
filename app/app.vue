<template>
  <div class="app-root">
    <NuxtPage />
  </div>
</template>

<style>
html,
body,
#__nuxt {
  height: 100%;
  overflow: hidden;
  user-select: none; /* easier panning */
}

input {
  user-select: text; /* restore selection in inputs */
}
</style>
