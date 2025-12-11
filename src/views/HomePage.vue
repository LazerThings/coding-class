<script setup lang="ts">
import { computed } from 'vue'
import { useCourses } from '../composables/useCourses'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'

const { publishedCourses } = useCourses()
const { isAuthenticated } = useAuth()

const featuredCourses = computed(() => publishedCourses.value.slice(0, 3))
</script>

<template>
  <AppLayout>
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-water-600 to-water-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            Learn to Code with Interactive Lessons
          </h1>
          <p class="text-xl text-water-100 mb-8 max-w-2xl mx-auto">
            Master programming with hands-on coding exercises, quizzes, and real-world projects.
            Start your coding journey today!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link to="/courses" class="btn bg-white text-water-700 hover:bg-gray-100 px-8 py-3 text-lg">
              Browse Courses
            </router-link>
            <router-link
              v-if="!isAuthenticated"
              to="/login"
              class="btn bg-water-500 text-white hover:bg-water-400 px-8 py-3 text-lg"
            >
              Get Started
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Why Learn With Us?
      </h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="card p-6 text-center">
          <div class="w-14 h-14 bg-water-100 dark:bg-water-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-water-600 dark:text-water-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Interactive Code Editor</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Write and run JavaScript code directly in your browser with instant feedback.
          </p>
        </div>

        <div class="card p-6 text-center">
          <div class="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quizzes & Tests</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Reinforce your learning with interactive quizzes and coding challenges.
          </p>
        </div>
      </div>
    </div>

    <!-- Featured Courses -->
    <div class="bg-gray-100 dark:bg-gray-800/50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Featured Courses</h2>
          <router-link to="/courses" class="text-water-600 dark:text-water-400 hover:underline">
            View all courses →
          </router-link>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <router-link
            v-for="course in featuredCourses"
            :key="course.id"
            :to="`/courses/${course.id}`"
            class="card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="h-40 bg-gradient-to-br from-water-500 to-water-700 flex items-center justify-center">
              <img
                v-if="course.thumbnail"
                :src="course.thumbnail"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-4xl text-white/50">&lt;/&gt;</span>
            </div>
            <div class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ course.lessons.length }} lessons
                </span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">{{ course.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ course.description }}</p>
              <div class="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>By {{ course.instructorName }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="card bg-gradient-to-r from-water-600 to-water-700 p-8 md:p-12 text-center text-white">
        <h2 class="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p class="text-water-100 mb-6 max-w-xl mx-auto">
          Join thousands of students who are already learning to code with our interactive platform.
        </p>
        <router-link
          to="/courses"
          class="inline-block btn bg-white text-water-700 hover:bg-gray-100 px-8 py-3 text-lg"
        >
          Explore Courses
        </router-link>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-700 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2025 Heygibson + Inside A Child's Mind. Built with Vue.js and Tailwind CSS.</p>
      </div>
    </footer>
  </AppLayout>
</template>
