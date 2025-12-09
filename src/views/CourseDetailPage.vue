<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourses } from '../composables/useCourses'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const { getCourseById, enrollInCourse, isEnrolled, getProgress, getCourseCompletionPercent } = useCourses()
const { isAuthenticated } = useAuth()

const courseId = computed(() => route.params.id as string)
const course = computed(() => getCourseById(courseId.value))
const enrolled = computed(() => isEnrolled(courseId.value))
const progress = computed(() => getProgress(courseId.value))
const completionPercent = computed(() => getCourseCompletionPercent(courseId.value))

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

function handleEnroll() {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  enrollInCourse(courseId.value)
}

function startCourse() {
  if (course.value && course.value.lessons.length > 0) {
    router.push(`/courses/${courseId.value}/lessons/${course.value.lessons[0].id}`)
  }
}

function continueCourse() {
  if (!course.value || !progress.value) return

  // Find the first incomplete lesson
  for (const lesson of course.value.lessons) {
    const lessonProgress = progress.value.lessonProgress[lesson.id]
    if (!lessonProgress || !lessonProgress.completed) {
      router.push(`/courses/${courseId.value}/lessons/${lesson.id}`)
      return
    }
  }

  // All lessons completed, go to first lesson
  if (course.value.lessons.length > 0) {
    router.push(`/courses/${courseId.value}/lessons/${course.value.lessons[0].id}`)
  }
}

function isLessonCompleted(lessonId: string): boolean {
  if (!progress.value) return false
  return progress.value.lessonProgress[lessonId]?.completed ?? false
}

function getLessonProgress(lessonId: string): number {
  if (!progress.value || !course.value) return 0
  const lesson = course.value.lessons.find(l => l.id === lessonId)
  if (!lesson) return 0

  const lessonProgress = progress.value.lessonProgress[lessonId]
  if (!lessonProgress) return 0

  const totalBlocks = lesson.contentBlocks.length
  if (totalBlocks === 0) return 0

  return Math.round((lessonProgress.completedBlocks.length / totalBlocks) * 100)
}
</script>

<template>
  <AppLayout>
    <div v-if="course">
      <!-- Hero Section -->
      <div class="bg-gradient-to-br from-water-600 to-water-800 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Course Info -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-4">
                <span :class="['px-3 py-1 text-sm font-medium rounded-full', difficultyColors[course.difficulty]]">
                  {{ course.difficulty }}
                </span>
                <span v-for="tag in course.tags" :key="tag" class="px-3 py-1 text-sm bg-white/20 rounded-full">
                  {{ tag }}
                </span>
              </div>

              <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ course.title }}</h1>
              <p class="text-lg text-water-100 mb-6">{{ course.description }}</p>

              <div class="flex items-center gap-6 text-water-100">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{{ course.lessons.length }} lessons</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{{ course.instructorName }}</span>
                </div>
              </div>

              <!-- Progress Bar (if enrolled) -->
              <div v-if="enrolled" class="mt-6">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span>Course Progress</span>
                  <span>{{ completionPercent }}%</span>
                </div>
                <div class="w-full bg-white/30 rounded-full h-2">
                  <div
                    class="bg-white h-2 rounded-full transition-all"
                    :style="{ width: `${completionPercent}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Course Card -->
            <div class="lg:w-80">
              <div class="card bg-white dark:bg-gray-800 p-6">
                <div class="aspect-video bg-gradient-to-br from-water-500 to-water-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="course.thumbnail"
                    :src="course.thumbnail"
                    :alt="course.title"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-4xl text-white/50">&lt;/&gt;</span>
                </div>

                <div v-if="!enrolled" class="space-y-3">
                  <button @click="handleEnroll" class="btn btn-primary w-full py-3">
                    {{ isAuthenticated ? 'Enroll Now - Free' : 'Login to Enroll' }}
                  </button>
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Get instant access to all lessons
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <button @click="continueCourse" class="btn btn-primary w-full py-3">
                    {{ completionPercent > 0 ? 'Continue Learning' : 'Start Course' }}
                  </button>
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {{ completionPercent === 100 ? 'Course completed!' : 'Pick up where you left off' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Content</h2>

        <div class="space-y-4">
          <div
            v-for="(lesson, index) in course.lessons"
            :key="lesson.id"
            class="card overflow-hidden"
          >
            <router-link
              v-if="enrolled"
              :to="`/courses/${course.id}/lessons/${lesson.id}`"
              class="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="p-4 flex items-center gap-4">
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium',
                  isLessonCompleted(lesson.id)
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                ]">
                  <svg v-if="isLessonCompleted(lesson.id)" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </div>

                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ lesson.title }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ lesson.description }}</p>
                </div>

                <div class="flex items-center gap-4">
                  <div v-if="getLessonProgress(lesson.id) > 0 && !isLessonCompleted(lesson.id)" class="w-24">
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        class="bg-water-600 h-1.5 rounded-full"
                        :style="{ width: `${getLessonProgress(lesson.id)}%` }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ lesson.contentBlocks.length }} blocks
                  </span>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </router-link>

            <div v-else class="p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-gray-900 dark:text-white">{{ lesson.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ lesson.description }}</p>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Enroll to access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Course not found</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">The course you're looking for doesn't exist.</p>
      <router-link to="/courses" class="btn btn-primary mt-4">Browse Courses</router-link>
    </div>
  </AppLayout>
</template>
