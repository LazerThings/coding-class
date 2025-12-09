<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QuizBlock } from '../../types'

const props = defineProps<{
  block: QuizBlock
}>()

const emit = defineEmits<{
  completed: []
}>()

const selectedOption = ref<string | null>(null)
const isSubmitted = ref(false)

const isCorrect = computed(() => {
  if (!selectedOption.value) return false
  const selected = props.block.options.find(o => o.id === selectedOption.value)
  return selected?.isCorrect ?? false
})

function submitAnswer() {
  if (!selectedOption.value) return
  isSubmitted.value = true
  if (isCorrect.value) {
    emit('completed')
  }
}

function resetQuiz() {
  selectedOption.value = null
  isSubmitted.value = false
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium text-amber-800 dark:text-amber-200">Quiz</span>
      </div>
      <p class="text-gray-800 dark:text-gray-200 font-medium">{{ block.question }}</p>
    </div>

    <div class="p-4 space-y-3">
      <label
        v-for="option in block.options"
        :key="option.id"
        :class="[
          'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
          selectedOption === option.id && !isSubmitted
            ? 'border-water-500 bg-water-50 dark:bg-water-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          isSubmitted && option.isCorrect
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : '',
          isSubmitted && selectedOption === option.id && !option.isCorrect
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : ''
        ]"
      >
        <input
          type="radio"
          :name="`quiz-${block.id}`"
          :value="option.id"
          v-model="selectedOption"
          :disabled="isSubmitted"
          class="w-4 h-4 text-water-600"
        />
        <span :class="[
          'flex-1',
          isSubmitted && option.isCorrect ? 'text-green-700 dark:text-green-300 font-medium' : '',
          isSubmitted && selectedOption === option.id && !option.isCorrect ? 'text-red-700 dark:text-red-300' : ''
        ]">
          {{ option.text }}
        </span>
        <svg v-if="isSubmitted && option.isCorrect" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-if="isSubmitted && selectedOption === option.id && !option.isCorrect" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </label>
    </div>

    <!-- Explanation -->
    <div v-if="isSubmitted && block.explanation" class="px-4 pb-4">
      <div :class="[
        'p-3 rounded-lg',
        isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
      ]">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          <strong>Explanation:</strong> {{ block.explanation }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
      <button
        v-if="!isSubmitted"
        @click="submitAnswer"
        :disabled="!selectedOption"
        class="btn btn-primary"
      >
        Submit Answer
      </button>
      <button
        v-else
        @click="resetQuiz"
        class="btn btn-secondary"
      >
        Try Again
      </button>

      <div v-if="isSubmitted" :class="[
        'flex items-center gap-2',
        isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      ]">
        <svg v-if="isCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">{{ isCorrect ? 'Correct!' : 'Incorrect' }}</span>
      </div>
    </div>
  </div>
</template>
