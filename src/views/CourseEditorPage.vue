<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourses } from '../composables/useCourses'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'
import type { Lesson, ContentBlock, ContentBlockType } from '../types'

const route = useRoute()
const router = useRouter()
const {
  getCourseById,
  updateCourse,
  addLesson,
  updateLesson,
  deleteLesson,
  addContentBlock,
  updateContentBlock,
  deleteContentBlock
} = useCourses()
const { isInstructor } = useAuth()

const courseId = computed(() => route.params.id as string)
const course = computed(() => getCourseById(courseId.value))

const selectedLessonId = ref<string | null>(null)
const selectedLesson = computed(() =>
  course.value?.lessons.find(l => l.id === selectedLessonId.value)
)

const showLessonModal = ref(false)
const showBlockModal = ref(false)
const editingLesson = ref<Partial<Lesson> | null>(null)
const editingBlock = ref<Partial<ContentBlock> | null>(null)

// Auto-select first lesson
watch(course, (c) => {
  if (c && c.lessons.length > 0 && !selectedLessonId.value) {
    selectedLessonId.value = c.lessons[0].id
  }
}, { immediate: true })

// Course settings
const courseSettings = ref({
  title: '',
  description: '',
  difficulty: 'beginner' as const,
  tags: '',
  thumbnail: ''
})

watch(course, (c) => {
  if (c) {
    courseSettings.value = {
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      tags: c.tags.join(', '),
      thumbnail: c.thumbnail || ''
    }
  }
}, { immediate: true })

function saveCourseSettings() {
  if (!course.value) return
  updateCourse(course.value.id, {
    title: courseSettings.value.title,
    description: courseSettings.value.description,
    difficulty: courseSettings.value.difficulty,
    tags: courseSettings.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    thumbnail: courseSettings.value.thumbnail || undefined
  })
}

// Lesson management
function openLessonModal(lesson?: Lesson) {
  if (lesson) {
    editingLesson.value = { ...lesson }
  } else {
    editingLesson.value = {
      title: '',
      description: '',
      order: (course.value?.lessons.length ?? 0) + 1,
      isPublished: true,
      contentBlocks: []
    }
  }
  showLessonModal.value = true
}

function saveLesson() {
  if (!editingLesson.value || !course.value) return

  if (editingLesson.value.id) {
    updateLesson(course.value.id, editingLesson.value.id, editingLesson.value)
  } else {
    const newLesson = addLesson(course.value.id, editingLesson.value as Omit<Lesson, 'id'>)
    if (newLesson) {
      selectedLessonId.value = newLesson.id
    }
  }

  showLessonModal.value = false
  editingLesson.value = null
}

function handleDeleteLesson(lessonId: string) {
  if (!course.value) return
  if (confirm('Are you sure you want to delete this lesson?')) {
    deleteLesson(course.value.id, lessonId)
    if (selectedLessonId.value === lessonId) {
      selectedLessonId.value = course.value.lessons[0]?.id ?? null
    }
  }
}

// Block management
const blockTypes: { type: ContentBlockType; label: string; icon: string }[] = [
  { type: 'markdown', label: 'Text/Markdown', icon: 'M4 6h16M4 12h16M4 18h7' },
  { type: 'code', label: 'Code Example', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { type: 'interactive-code', label: 'Interactive Code', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { type: 'quiz', label: 'Quiz', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { type: 'video', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { type: 'image', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
]

function openBlockModal(type: ContentBlockType, block?: ContentBlock) {
  const order = selectedLesson.value?.contentBlocks.length ?? 0

  if (block) {
    editingBlock.value = { ...block }
  } else {
    const baseBlock = {
      type,
      order: order + 1
    }

    switch (type) {
      case 'markdown':
      case 'text':
        editingBlock.value = { ...baseBlock, content: '' }
        break
      case 'code':
        editingBlock.value = { ...baseBlock, language: 'javascript', code: '', filename: '' }
        break
      case 'interactive-code':
        editingBlock.value = {
          ...baseBlock,
          language: 'javascript',
          starterCode: '',
          solution: '',
          instructions: '',
          testCases: []
        }
        break
      case 'quiz':
        editingBlock.value = {
          ...baseBlock,
          question: '',
          options: [
            { id: '1', text: '', isCorrect: false },
            { id: '2', text: '', isCorrect: false },
            { id: '3', text: '', isCorrect: false },
            { id: '4', text: '', isCorrect: false }
          ],
          explanation: ''
        }
        break
      case 'video':
        editingBlock.value = { ...baseBlock, url: '', title: '' }
        break
      case 'image':
        editingBlock.value = { ...baseBlock, url: '', alt: '', caption: '' }
        break
    }
  }

  showBlockModal.value = true
}

function saveBlock() {
  if (!editingBlock.value || !course.value || !selectedLessonId.value) return

  if (editingBlock.value.id) {
    updateContentBlock(
      course.value.id,
      selectedLessonId.value,
      editingBlock.value.id,
      editingBlock.value
    )
  } else {
    addContentBlock(
      course.value.id,
      selectedLessonId.value,
      editingBlock.value as Omit<ContentBlock, 'id'>
    )
  }

  showBlockModal.value = false
  editingBlock.value = null
}

function handleDeleteBlock(blockId: string) {
  if (!course.value || !selectedLessonId.value) return
  if (confirm('Are you sure you want to delete this content block?')) {
    deleteContentBlock(course.value.id, selectedLessonId.value, blockId)
  }
}

function getBlockTypeLabel(type: ContentBlockType): string {
  return blockTypes.find(b => b.type === type)?.label ?? type
}
</script>

<template>
  <AppLayout>
    <div v-if="course && isInstructor" class="flex h-[calc(100vh-4rem)]">
      <!-- Sidebar - Lessons -->
      <aside class="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <router-link
            to="/instructor"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </router-link>
          <h2 class="font-semibold text-gray-900 dark:text-white">Lessons</h2>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          <button
            v-for="lesson in course.lessons"
            :key="lesson.id"
            @click="selectedLessonId = lesson.id"
            :class="[
              'w-full text-left p-3 rounded-lg mb-1 transition-colors',
              selectedLessonId === lesson.id
                ? 'bg-water-50 dark:bg-water-900/20 text-water-600 dark:text-water-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium line-clamp-1">{{ lesson.title }}</span>
              <span class="text-xs text-gray-500">{{ lesson.contentBlocks.length }}</span>
            </div>
          </button>
        </div>

        <div class="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="openLessonModal()"
            class="w-full btn btn-primary text-sm flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Lesson
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto p-6">
          <!-- Course Settings Tab -->
          <div v-if="!selectedLessonId" class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Course Settings</h1>

            <div class="card p-6 space-y-4">
              <div>
                <label class="label">Course Title</label>
                <input v-model="courseSettings.title" type="text" class="input" />
              </div>

              <div>
                <label class="label">Description</label>
                <textarea v-model="courseSettings.description" class="input" rows="3"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Difficulty</label>
                  <select v-model="courseSettings.difficulty" class="input">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label class="label">Tags (comma separated)</label>
                  <input v-model="courseSettings.tags" type="text" class="input" />
                </div>
              </div>

              <div>
                <label class="label">Thumbnail URL</label>
                <input v-model="courseSettings.thumbnail" type="text" class="input" placeholder="https://..." />
              </div>

              <button @click="saveCourseSettings" class="btn btn-primary">Save Settings</button>
            </div>
          </div>

          <!-- Lesson Editor -->
          <div v-else-if="selectedLesson" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedLesson.title }}</h1>
                <p class="text-gray-600 dark:text-gray-400">{{ selectedLesson.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="openLessonModal(selectedLesson)" class="btn btn-secondary text-sm">
                  Edit Lesson
                </button>
                <button @click="handleDeleteLesson(selectedLesson.id)" class="btn btn-danger text-sm">
                  Delete
                </button>
              </div>
            </div>

            <!-- Content Blocks -->
            <div class="space-y-4">
              <div
                v-for="block in selectedLesson.contentBlocks"
                :key="block.id"
                class="card p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <span class="text-xs font-medium text-water-600 dark:text-water-400 uppercase">
                      {{ getBlockTypeLabel(block.type) }}
                    </span>
                    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <template v-if="block.type === 'markdown' || block.type === 'text'">
                        <p class="line-clamp-2">{{ (block as any).content }}</p>
                      </template>
                      <template v-else-if="block.type === 'code'">
                        <p>{{ (block as any).language }} - {{ (block as any).filename || 'code snippet' }}</p>
                      </template>
                      <template v-else-if="block.type === 'interactive-code'">
                        <p>{{ (block as any).instructions }}</p>
                      </template>
                      <template v-else-if="block.type === 'quiz'">
                        <p>{{ (block as any).question }}</p>
                      </template>
                      <template v-else-if="block.type === 'video'">
                        <p>{{ (block as any).title || (block as any).url }}</p>
                      </template>
                      <template v-else-if="block.type === 'image'">
                        <p>{{ (block as any).alt }}</p>
                      </template>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="openBlockModal(block.type, block)"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="handleDeleteBlock(block.id)"
                      class="text-gray-400 hover:text-red-600"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Block Buttons -->
            <div class="card p-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Content Block</h3>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="blockType in blockTypes"
                  :key="blockType.type"
                  @click="openBlockModal(blockType.type)"
                  class="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="blockType.icon" />
                  </svg>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ blockType.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Lesson Modal -->
    <div v-if="showLessonModal && editingLesson" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showLessonModal = false"></div>
      <div class="card relative z-10 w-full max-w-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {{ editingLesson.id ? 'Edit Lesson' : 'Add Lesson' }}
        </h2>

        <form @submit.prevent="saveLesson" class="space-y-4">
          <div>
            <label class="label">Title</label>
            <input v-model="editingLesson.title" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Description</label>
            <textarea v-model="editingLesson.description" class="input" rows="2"></textarea>
          </div>
          <div>
            <label class="label">Duration (minutes)</label>
            <input v-model.number="editingLesson.duration" type="number" class="input" />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showLessonModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Block Modal -->
    <div v-if="showBlockModal && editingBlock" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showBlockModal = false"></div>
      <div class="card relative z-10 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {{ editingBlock.id ? 'Edit' : 'Add' }} {{ getBlockTypeLabel(editingBlock.type as ContentBlockType) }}
        </h2>

        <form @submit.prevent="saveBlock" class="space-y-4">
          <!-- Markdown/Text Block -->
          <template v-if="editingBlock.type === 'markdown' || editingBlock.type === 'text'">
            <div>
              <label class="label">Content (Markdown supported)</label>
              <textarea
                v-model="(editingBlock as any).content"
                class="input font-mono"
                rows="10"
                placeholder="# Heading&#10;&#10;Your content here..."
              ></textarea>
            </div>
          </template>

          <!-- Code Block -->
          <template v-else-if="editingBlock.type === 'code'">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Language</label>
                <select v-model="(editingBlock as any).language" class="input">
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label class="label">Filename (optional)</label>
                <input v-model="(editingBlock as any).filename" type="text" class="input" placeholder="example.js" />
              </div>
            </div>
            <div>
              <label class="label">Code</label>
              <textarea
                v-model="(editingBlock as any).code"
                class="input font-mono"
                rows="10"
              ></textarea>
            </div>
          </template>

          <!-- Interactive Code Block -->
          <template v-else-if="editingBlock.type === 'interactive-code'">
            <div>
              <label class="label">Instructions</label>
              <textarea
                v-model="(editingBlock as any).instructions"
                class="input"
                rows="2"
                placeholder="What should the student do?"
              ></textarea>
            </div>
            <div>
              <label class="label">Starter Code</label>
              <textarea
                v-model="(editingBlock as any).starterCode"
                class="input font-mono"
                rows="6"
                placeholder="// Starting code for student"
              ></textarea>
            </div>
            <div>
              <label class="label">Solution (optional)</label>
              <textarea
                v-model="(editingBlock as any).solution"
                class="input font-mono"
                rows="6"
              ></textarea>
            </div>
          </template>

          <!-- Quiz Block -->
          <template v-else-if="editingBlock.type === 'quiz'">
            <div>
              <label class="label">Question</label>
              <input v-model="(editingBlock as any).question" type="text" class="input" />
            </div>
            <div>
              <label class="label">Options</label>
              <div class="space-y-2">
                <div
                  v-for="(option, index) in (editingBlock as any).options"
                  :key="option.id"
                  class="flex items-center gap-2"
                >
                  <input
                    type="radio"
                    :name="`correct-${editingBlock.id || 'new'}`"
                    :checked="option.isCorrect"
                    @change="(editingBlock as any).options.forEach((o: any, i: number) => o.isCorrect = i === index)"
                    class="w-4 h-4"
                  />
                  <input
                    v-model="option.text"
                    type="text"
                    class="input flex-1"
                    :placeholder="`Option ${index + 1}`"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">Select the radio button for the correct answer</p>
            </div>
            <div>
              <label class="label">Explanation (optional)</label>
              <textarea v-model="(editingBlock as any).explanation" class="input" rows="2"></textarea>
            </div>
          </template>

          <!-- Video Block -->
          <template v-else-if="editingBlock.type === 'video'">
            <div>
              <label class="label">Video URL (YouTube or direct video URL)</label>
              <input v-model="(editingBlock as any).url" type="url" class="input" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <label class="label">Title (optional)</label>
              <input v-model="(editingBlock as any).title" type="text" class="input" />
            </div>
          </template>

          <!-- Image Block -->
          <template v-else-if="editingBlock.type === 'image'">
            <div>
              <label class="label">Image URL</label>
              <input v-model="(editingBlock as any).url" type="url" class="input" placeholder="https://..." />
            </div>
            <div>
              <label class="label">Alt Text</label>
              <input v-model="(editingBlock as any).alt" type="text" class="input" placeholder="Description of the image" />
            </div>
            <div>
              <label class="label">Caption (optional)</label>
              <input v-model="(editingBlock as any).caption" type="text" class="input" />
            </div>
          </template>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showBlockModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Not Authorized -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">You need instructor access to edit courses.</p>
      <router-link to="/instructor" class="btn btn-primary mt-4">Go to Dashboard</router-link>
    </div>
  </AppLayout>
</template>
