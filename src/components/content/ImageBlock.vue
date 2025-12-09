<script setup lang="ts">
import type { ImageBlock } from '../../types'

defineProps<{
  block: ImageBlock
}>()
</script>

<template>
  <figure class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <img
      :src="block.url"
      :alt="block.alt"
      class="w-full h-auto"
      loading="lazy"
    />
    <figcaption v-if="block.caption" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 text-center">
      {{ block.caption }}
    </figcaption>
  </figure>
</template>
