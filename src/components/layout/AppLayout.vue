<script setup lang="ts">
import Navbar from './Navbar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Navbar />
    <main>
      <slot />
    </main>
  </div>
</template>
