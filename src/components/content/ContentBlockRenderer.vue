<script setup lang="ts">
import type { ContentBlock } from '../../types'
import MarkdownBlock from './MarkdownBlock.vue'
import CodeBlock from './CodeBlock.vue'
import InteractiveCodeBlock from './InteractiveCodeBlock.vue'
import QuizBlock from './QuizBlock.vue'
import VideoBlock from './VideoBlock.vue'
import ImageBlock from './ImageBlock.vue'

defineProps<{
  block: ContentBlock
}>()

const emit = defineEmits<{
  completed: [blockId: string]
}>()

function onCompleted(blockId: string) {
  emit('completed', blockId)
}
</script>

<template>
  <div class="content-block">
    <MarkdownBlock
      v-if="block.type === 'markdown' || block.type === 'text'"
      :block="block as any"
    />

    <CodeBlock
      v-else-if="block.type === 'code'"
      :block="block as any"
    />

    <InteractiveCodeBlock
      v-else-if="block.type === 'interactive-code'"
      :block="block as any"
      @completed="onCompleted(block.id)"
    />

    <QuizBlock
      v-else-if="block.type === 'quiz'"
      :block="block as any"
      @completed="onCompleted(block.id)"
    />

    <VideoBlock
      v-else-if="block.type === 'video'"
      :block="block as any"
      @completed="onCompleted(block.id)"
    />

    <ImageBlock
      v-else-if="block.type === 'image'"
      :block="block as any"
    />
  </div>
</template>
