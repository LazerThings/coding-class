<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'
import { useRouter } from 'vue-router'

const { currentUser, isAuthenticated, isInstructor, isAdmin, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/login')
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  instructor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  student: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}
</script>

<template>
  <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-water-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">&lt;/&gt;</span>
            </div>
            <span class="text-xl font-bold text-gray-900 dark:text-white">CodingClass</span>
          </router-link>

          <div class="hidden md:flex items-center ml-10 gap-6">
            <router-link
              to="/courses"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Browse Courses
            </router-link>
            <router-link
              v-if="isInstructor"
              to="/instructor"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Instructor Dashboard
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/my-learning"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              My Learning
            </router-link>
            <router-link
              v-if="isAdmin"
              to="/admin"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Admin
            </router-link>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="isAuthenticated">
            <div class="flex items-center gap-3">
              <router-link to="/settings" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ currentUser?.name }}</p>
                  <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', roleColors[currentUser?.role || 'student']]">
                    {{ currentUser?.role }}
                  </span>
                </div>
                <div class="w-10 h-10 bg-water-100 dark:bg-water-900 rounded-full flex items-center justify-center">
                  <span class="text-water-600 dark:text-water-300 font-medium">
                    {{ currentUser?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </router-link>
              <button @click="handleLogout" class="btn btn-secondary text-sm">
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-primary">Sign In</router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
