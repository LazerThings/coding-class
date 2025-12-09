<script setup lang="ts">
import { computed } from 'vue'
import type { VideoBlock } from '../../types'

const props = defineProps<{
  block: VideoBlock
}>()

const emit = defineEmits<{
  completed: []
}>()

// Extract YouTube video ID if it's a YouTube URL
const youtubeId = computed(() => {
  const url = props.block.url
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match ? match[1] : null
})

const isYoutube = computed(() => youtubeId.value !== null)

function onVideoEnded() {
  emit('completed')
}
</script>

<template>
  <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <div v-if="block.title" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ block.title }}</span>
    </div>

    <div class="aspect-video bg-black">
      <!-- YouTube embed -->
      <iframe
        v-if="isYoutube"
        :src="`https://www.youtube.com/embed/${youtubeId}`"
        class="w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>

      <!-- Regular video -->
      <video
        v-else
        :src="block.url"
        controls
        class="w-full h-full"
        @ended="onVideoEnded"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>
