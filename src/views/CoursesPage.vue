<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCourses } from '../composables/useCourses'
import AppLayout from '../components/layout/AppLayout.vue'

const { publishedCourses, getCourseCompletionPercentSync, isEnrolled } = useCourses()

const searchQuery = ref('')
const selectedTag = ref<string>('')

const allTags = computed(() => {
  const tags = new Set<string>()
  publishedCourses.value.forEach(course => {
    course.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const filteredCourses = computed(() => {
  return publishedCourses.value.filter(course => {
    const matchesSearch = !searchQuery.value ||
      course.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesTag = !selectedTag.value ||
      course.tags.includes(selectedTag.value)

    return matchesSearch && matchesTag
  })
})

function clearFilters() {
  searchQuery.value = ''
  selectedTag.value = ''
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Browse Courses</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Discover {{ publishedCourses.length }} courses to enhance your coding skills
        </p>
      </div>

      <!-- Filters -->
      <div class="card p-4 mb-8">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search courses..."
              class="input"
            />
          </div>
          <div class="flex gap-4">
            <select v-model="selectedTag" class="input w-auto">
              <option value="">All Tags</option>
              <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <button
              v-if="searchQuery || selectedTag"
              @click="clearFilters"
              class="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Course Grid -->
      <div v-if="filteredCourses.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="course in filteredCourses"
          :key="course.id"
          :to="`/courses/${course.id}`"
          class="card overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <div class="h-40 bg-gradient-to-br from-water-500 to-water-700 flex items-center justify-center relative">
            <img
              v-if="course.thumbnail"
              :src="course.thumbnail"
              :alt="course.title"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-4xl text-white/50">&lt;/&gt;</span>

            <!-- Progress overlay -->
            <div
              v-if="isEnrolled(course.id)"
              class="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2"
            >
              <div class="flex items-center justify-between text-white text-sm">
                <span>Progress</span>
                <span>{{ getCourseCompletionPercentSync(course.id) }}%</span>
              </div>
              <div class="w-full bg-white/30 rounded-full h-1.5 mt-1">
                <div
                  class="bg-green-400 h-1.5 rounded-full transition-all"
                  :style="{ width: `${getCourseCompletionPercentSync(course.id)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ course.lessons.length }} lessons
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-water-600 dark:group-hover:text-water-400 transition-colors">
              {{ course.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ course.description }}</p>

            <div class="mt-3 flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">By {{ course.instructorName }}</span>
              <div class="flex gap-1">
                <span
                  v-for="tag in course.tags.slice(0, 2)"
                  :key="tag"
                  class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Empty State -->
      <div v-else class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">No courses found</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
        <button @click="clearFilters" class="btn btn-primary mt-4">Clear Filters</button>
      </div>
    </div>
  </AppLayout>
</template>
