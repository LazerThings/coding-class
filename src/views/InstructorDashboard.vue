<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourses } from '../composables/useCourses'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'
import type { Course } from '../types'

const router = useRouter()
const { courses, createCourse, deleteCourse, updateCourse } = useCourses()
const { currentUser, isInstructor } = useAuth()

const showCreateModal = ref(false)
const courseToDelete = ref<Course | null>(null)

const myCourses = computed(() =>
  courses.value.filter(c => c.instructorId === currentUser.value?.id || currentUser.value?.role === 'admin')
)

const newCourse = ref({
  title: '',
  description: '',
  difficulty: 'beginner' as const,
  tags: ''
})

function handleCreateCourse() {
  if (!newCourse.value.title || !currentUser.value) return

  const course = createCourse({
    title: newCourse.value.title,
    description: newCourse.value.description,
    difficulty: newCourse.value.difficulty,
    tags: newCourse.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    instructorId: currentUser.value.id,
    instructorName: currentUser.value.name,
    lessons: [],
    isPublished: false
  })

  showCreateModal.value = false
  newCourse.value = { title: '', description: '', difficulty: 'beginner', tags: '' }

  router.push(`/instructor/courses/${course.id}`)
}

function confirmDelete(course: Course) {
  courseToDelete.value = course
}

function handleDelete() {
  if (courseToDelete.value) {
    deleteCourse(courseToDelete.value.id)
    courseToDelete.value = null
  }
}

function togglePublish(course: Course) {
  updateCourse(course.id, { isPublished: !course.isPublished })
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Create and manage your courses</p>
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Course
        </button>
      </div>

      <!-- Not Authorized -->
      <div v-if="!isInstructor" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">Instructor access required</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Switch to an instructor account to create courses</p>
      </div>

      <!-- Courses List -->
      <div v-else-if="myCourses.length > 0" class="space-y-4">
        <div
          v-for="course in myCourses"
          :key="course.id"
          class="card overflow-hidden"
        >
          <div class="flex items-start gap-4 p-4">
            <div class="w-24 h-24 bg-gradient-to-br from-water-500 to-water-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                v-if="course.thumbnail"
                :src="course.thumbnail"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-2xl text-white/50">&lt;/&gt;</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="['px-2 py-0.5 text-xs font-medium rounded', difficultyColors[course.difficulty]]">
                  {{ course.difficulty }}
                </span>
                <span :class="[
                  'px-2 py-0.5 text-xs font-medium rounded',
                  course.isPublished
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                ]">
                  {{ course.isPublished ? 'Published' : 'Draft' }}
                </span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ course.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ course.description }}</p>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{{ course.lessons.length }} lessons</span>
                <span v-if="course.tags.length > 0">
                  Tags: {{ course.tags.join(', ') }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="togglePublish(course)"
                :class="[
                  'btn text-sm',
                  course.isPublished ? 'btn-secondary' : 'btn-success'
                ]"
              >
                {{ course.isPublished ? 'Unpublish' : 'Publish' }}
              </button>
              <router-link
                :to="`/instructor/courses/${course.id}`"
                class="btn btn-primary text-sm"
              >
                Edit
              </router-link>
              <button
                @click="confirmDelete(course)"
                class="btn btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">No courses yet</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Create your first course to get started</p>
        <button @click="showCreateModal = true" class="btn btn-primary mt-4">Create Course</button>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showCreateModal = false"></div>
      <div class="card relative z-10 w-full max-w-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Course</h2>

        <form @submit.prevent="handleCreateCourse" class="space-y-4">
          <div>
            <label class="label">Course Title</label>
            <input
              v-model="newCourse.title"
              type="text"
              class="input"
              placeholder="e.g., JavaScript Fundamentals"
              required
            />
          </div>

          <div>
            <label class="label">Description</label>
            <textarea
              v-model="newCourse.description"
              class="input"
              rows="3"
              placeholder="What will students learn in this course?"
            ></textarea>
          </div>

          <div>
            <label class="label">Difficulty Level</label>
            <select v-model="newCourse.difficulty" class="input">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label class="label">Tags (comma separated)</label>
            <input
              v-model="newCourse.tags"
              type="text"
              class="input"
              placeholder="e.g., javascript, web, programming"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="courseToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="courseToDelete = null"></div>
      <div class="card relative z-10 w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Course</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete "{{ courseToDelete.title }}"? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="courseToDelete = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDelete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
