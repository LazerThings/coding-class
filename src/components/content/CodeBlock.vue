<script setup lang="ts">
import { ref } from 'vue'
import type { CodeBlock } from '../../types'

const props = defineProps<{
  block: CodeBlock
}>()

const copied = ref(false)

function copyCode() {
  navigator.clipboard.writeText(props.block.code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<template>
  <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ block.filename || block.language }}</span>
        <span class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
          {{ block.language }}
        </span>
      </div>
      <button
        @click="copyCode"
        class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="bg-gray-900 p-4 overflow-x-auto"><code class="text-sm font-mono text-gray-100" v-html="escapeHtml(block.code)"></code></pre>
  </div>
</template>
