<script setup lang="ts">
import { computed } from 'vue'
import { useCourses } from '../composables/useCourses'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'

const { courses, enrollments, getCourseCompletionPercentSync, getProgress } = useCourses()
const { isAuthenticated } = useAuth()

const enrolledCourses = computed(() => {
  const enrolledIds = Array.from(enrollments.value.keys())
  return courses.value.filter(c => enrolledIds.includes(c.id))
})

const inProgressCourses = computed(() =>
  enrolledCourses.value.filter(c => {
    const percent = getCourseCompletionPercentSync(c.id)
    return percent > 0 && percent < 100
  })
)

const completedCourses = computed(() =>
  enrolledCourses.value.filter(c => getCourseCompletionPercentSync(c.id) === 100)
)

const notStartedCourses = computed(() =>
  enrolledCourses.value.filter(c => getCourseCompletionPercentSync(c.id) === 0)
)

function getNextLesson(courseId: string) {
  const course = courses.value.find(c => c.id === courseId)
  const progress = getProgress(courseId)

  if (!course || !progress) return course?.lessons[0]

  for (const lesson of course.lessons) {
    const lessonProgress = progress.lessonProgress[lesson.id]
    if (!lessonProgress || !lessonProgress.completed) {
      return lesson
    }
  }

  return course.lessons[0]
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Learning</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Track your progress and continue learning</p>
      </div>

      <div v-if="!isAuthenticated" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">Sign in to view your learning</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Track your progress across all courses</p>
        <router-link to="/login" class="btn btn-primary mt-4">Sign In</router-link>
      </div>

      <div v-else-if="enrolledCourses.length === 0" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">No courses yet</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Start learning by enrolling in a course</p>
        <router-link to="/courses" class="btn btn-primary mt-4">Browse Courses</router-link>
      </div>

      <div v-else class="space-y-10">
        <!-- In Progress -->
        <section v-if="inProgressCourses.length > 0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Continue Learning</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div
              v-for="course in inProgressCourses"
              :key="course.id"
              class="card overflow-hidden"
            >
              <div class="flex">
                <div class="w-32 h-32 bg-gradient-to-br from-water-500 to-water-700 flex-shrink-0 flex items-center justify-center">
                  <img
                    v-if="course.thumbnail"
                    :src="course.thumbnail"
                    :alt="course.title"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-2xl text-white/50">&lt;/&gt;</span>
                </div>
                <div class="p-4 flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ course.title }}</h3>

                  <div class="mt-2">
                    <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{{ getCourseCompletionPercentSync(course.id) }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        class="bg-water-600 h-2 rounded-full transition-all"
                        :style="{ width: `${getCourseCompletionPercentSync(course.id)}%` }"
                      ></div>
                    </div>
                  </div>

                  <router-link
                    :to="`/courses/${course.id}/lessons/${getNextLesson(course.id)?.id}`"
                    class="btn btn-primary btn-sm mt-3"
                  >
                    Continue
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Not Started -->
        <section v-if="notStartedCourses.length > 0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Not Started</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <router-link
              v-for="course in notStartedCourses"
              :key="course.id"
              :to="`/courses/${course.id}`"
              class="card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div class="h-32 bg-gradient-to-br from-water-500 to-water-700 flex items-center justify-center">
                <img
                  v-if="course.thumbnail"
                  :src="course.thumbnail"
                  :alt="course.title"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-3xl text-white/50">&lt;/&gt;</span>
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ course.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ course.lessons.length }} lessons
                </p>
              </div>
            </router-link>
          </div>
        </section>

        <!-- Completed -->
        <section v-if="completedCourses.length > 0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completed</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <router-link
              v-for="course in completedCourses"
              :key="course.id"
              :to="`/courses/${course.id}`"
              class="card overflow-hidden hover:shadow-lg transition-shadow relative"
            >
              <div class="absolute top-3 right-3 z-10">
                <div class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </div>
              </div>
              <div class="h-32 bg-gradient-to-br from-water-500 to-water-700 flex items-center justify-center">
                <img
                  v-if="course.thumbnail"
                  :src="course.thumbnail"
                  :alt="course.title"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-3xl text-white/50">&lt;/&gt;</span>
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ course.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ course.lessons.length }} lessons
                </p>
              </div>
            </router-link>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>
