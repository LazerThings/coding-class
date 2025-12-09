<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InteractiveCodeBlock } from '../../types'

const props = defineProps<{
  block: InteractiveCodeBlock
}>()

const emit = defineEmits<{
  completed: []
}>()

const code = ref(props.block.starterCode)
const output = ref<string[]>([])
const isRunning = ref(false)
const showSolution = ref(false)
const hasError = ref(false)
const testResults = ref<{ passed: boolean; description: string }[]>([])

const allTestsPassed = computed(() =>
  testResults.value.length > 0 && testResults.value.every(t => t.passed)
)

function runCode() {
  isRunning.value = true
  output.value = []
  hasError.value = false
  testResults.value = []

  // Capture console.log output
  const logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args) => {
    logs.push(args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' '))
  }
  console.error = (...args) => {
    logs.push(`Error: ${args.join(' ')}`)
  }
  console.warn = (...args) => {
    logs.push(`Warning: ${args.join(' ')}`)
  }

  try {
    // Create a sandboxed function to run the code
    const fn = new Function(code.value)
    fn()

    output.value = logs

    // Run test cases if they exist
    if (props.block.testCases && props.block.testCases.length > 0) {
      testResults.value = props.block.testCases.map(test => {
        const outputStr = logs.join('\n').trim()
        const passed = outputStr.includes(test.expectedOutput.trim())
        return {
          passed,
          description: test.description
        }
      })

      if (allTestsPassed.value) {
        emit('completed')
      }
    } else if (logs.length > 0) {
      // If no tests, mark as completed when code runs without errors
      emit('completed')
    }
  } catch (error) {
    hasError.value = true
    output.value = [`Error: ${(error as Error).message}`]
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
    isRunning.value = false
  }
}

function resetCode() {
  code.value = props.block.starterCode
  output.value = []
  testResults.value = []
  hasError.value = false
}

function showSolutionCode() {
  showSolution.value = !showSolution.value
}

function applySolution() {
  if (props.block.solution) {
    code.value = props.block.solution
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Instructions -->
    <div class="p-4 bg-water-50 dark:bg-water-900/20 border-b border-gray-200 dark:border-gray-700">
      <h4 class="font-medium text-water-900 dark:text-water-200 mb-1">Challenge</h4>
      <p class="text-gray-700 dark:text-gray-300">{{ block.instructions }}</p>
    </div>

    <!-- Code Editor -->
    <div class="relative">
      <div class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ block.language }}</span>
        <div class="flex items-center gap-2">
          <button
            @click="resetCode"
            class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Reset
          </button>
          <button
            v-if="block.solution"
            @click="showSolutionCode"
            class="text-sm text-water-600 hover:text-water-700 dark:text-water-400"
          >
            {{ showSolution ? 'Hide Solution' : 'Show Solution' }}
          </button>
        </div>
      </div>
      <textarea
        v-model="code"
        class="w-full h-48 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
        spellcheck="false"
        placeholder="Write your code here..."
      ></textarea>
    </div>

    <!-- Solution (collapsible) -->
    <div v-if="showSolution && block.solution" class="border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-2 bg-green-50 dark:bg-green-900/20">
        <span class="text-sm font-medium text-green-700 dark:text-green-300">Solution</span>
        <button
          @click="applySolution"
          class="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
        >
          Apply Solution
        </button>
      </div>
      <pre class="bg-gray-900 p-4 overflow-x-auto"><code class="text-sm font-mono text-gray-100">{{ block.solution }}</code></pre>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="runCode"
        :disabled="isRunning"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg v-if="!isRunning" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isRunning ? 'Running...' : 'Run Code' }}
      </button>

      <div v-if="allTestsPassed" class="flex items-center gap-2 text-green-600 dark:text-green-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">All tests passed!</span>
      </div>
    </div>

    <!-- Output -->
    <div v-if="output.length > 0" class="border-t border-gray-200 dark:border-gray-700">
      <div class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Output</span>
      </div>
      <div
        :class="[
          'p-4 font-mono text-sm whitespace-pre-wrap',
          hasError ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200'
        ]"
      >
        <div v-for="(line, index) in output" :key="index">{{ line }}</div>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="testResults.length > 0" class="border-t border-gray-200 dark:border-gray-700 p-4">
      <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Test Results</h5>
      <div class="space-y-2">
        <div
          v-for="(result, index) in testResults"
          :key="index"
          :class="[
            'flex items-center gap-2 text-sm p-2 rounded',
            result.passed
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          ]"
        >
          <svg v-if="result.passed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ result.description }}
        </div>
      </div>
    </div>
  </div>
</template>
