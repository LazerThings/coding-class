<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourses } from '../composables/useCourses'
import AppLayout from '../components/layout/AppLayout.vue'
import ContentBlockRenderer from '../components/content/ContentBlockRenderer.vue'

const route = useRoute()
const router = useRouter()
const { getCourseById, markBlockCompleted, getProgress, isEnrolled, enrollInCourse } = useCourses()

const courseId = computed(() => route.params.courseId as string)
const lessonId = computed(() => route.params.lessonId as string)
const course = computed(() => getCourseById(courseId.value))
const lesson = computed(() => course.value?.lessons.find(l => l.id === lessonId.value))
const progress = computed(() => getProgress(courseId.value))

const showSidebar = ref(true)

// Auto-enroll when viewing a lesson
onMounted(() => {
  if (!isEnrolled(courseId.value)) {
    enrollInCourse(courseId.value)
  }
})

const currentLessonIndex = computed(() =>
  course.value?.lessons.findIndex(l => l.id === lessonId.value) ?? -1
)

const previousLesson = computed(() => {
  if (!course.value || currentLessonIndex.value <= 0) return null
  return course.value.lessons[currentLessonIndex.value - 1]
})

const nextLesson = computed(() => {
  if (!course.value || currentLessonIndex.value >= course.value.lessons.length - 1) return null
  return course.value.lessons[currentLessonIndex.value + 1]
})

function isBlockCompleted(blockId: string): boolean {
  if (!progress.value) return false
  const lessonProgress = progress.value.lessonProgress[lessonId.value]
  return lessonProgress?.completedBlocks.includes(blockId) ?? false
}

function isLessonCompleted(id: string): boolean {
  if (!progress.value) return false
  return progress.value.lessonProgress[id]?.completed ?? false
}

function onBlockCompleted(blockId: string) {
  markBlockCompleted(courseId.value, lessonId.value, blockId)
}

function navigateToLesson(id: string) {
  router.push(`/courses/${courseId.value}/lessons/${id}`)
}
</script>

<template>
  <AppLayout>
    <div v-if="course && lesson" class="flex h-[calc(100vh-4rem)]">
      <!-- Sidebar -->
      <aside
        :class="[
          'w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0 transition-all',
          showSidebar ? '' : '-ml-80'
        ]"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <router-link
            :to="`/courses/${course.id}`"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to course
          </router-link>
          <h2 class="font-semibold text-gray-900 dark:text-white mt-2 line-clamp-2">{{ course.title }}</h2>
        </div>

        <nav class="p-2">
          <button
            v-for="(l, index) in course.lessons"
            :key="l.id"
            @click="navigateToLesson(l.id)"
            :class="[
              'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors',
              l.id === lesson.id
                ? 'bg-water-50 dark:bg-water-900/20 text-water-600 dark:text-water-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            ]"
          >
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
              isLessonCompleted(l.id)
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                : l.id === lesson.id
                  ? 'bg-water-100 text-water-600 dark:bg-water-900 dark:text-water-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            ]">
              <svg v-if="isLessonCompleted(l.id)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="line-clamp-2 text-sm">{{ l.title }}</span>
          </button>
        </nav>
      </aside>

      <!-- Toggle Sidebar Button -->
      <button
        @click="showSidebar = !showSidebar"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg p-2 shadow-sm"
        :style="{ left: showSidebar ? '320px' : '0' }"
      >
        <svg :class="['w-4 h-4 transition-transform', showSidebar ? '' : 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto px-6 py-8">
          <!-- Lesson Header -->
          <div class="mb-8">
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Lesson {{ currentLessonIndex + 1 }} of {{ course.lessons.length }}</span>
              <span v-if="lesson.duration" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ lesson.duration }} min
              </span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ lesson.title }}</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">{{ lesson.description }}</p>
          </div>

          <!-- Content Blocks -->
          <div class="space-y-8">
            <div
              v-for="block in lesson.contentBlocks"
              :key="block.id"
              class="relative"
            >
              <!-- Completion indicator -->
              <div
                v-if="isBlockCompleted(block.id)"
                class="absolute -left-8 top-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <ContentBlockRenderer
                :block="block"
                @completed="onBlockCompleted"
              />
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              v-if="previousLesson"
              @click="navigateToLesson(previousLesson.id)"
              class="btn btn-secondary flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous: {{ previousLesson.title }}
            </button>
            <div v-else></div>

            <button
              v-if="nextLesson"
              @click="navigateToLesson(nextLesson.id)"
              class="btn btn-primary flex items-center gap-2"
            >
              Next: {{ nextLesson.title }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <router-link
              v-else
              :to="`/courses/${course.id}`"
              class="btn btn-success flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete Course
            </router-link>
          </div>
        </div>
      </main>
    </div>

    <!-- Not Found -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Lesson not found</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">The lesson you're looking for doesn't exist.</p>
      <router-link to="/courses" class="btn btn-primary mt-4">Browse Courses</router-link>
    </div>
  </AppLayout>
</template>
