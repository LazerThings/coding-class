<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'

const router = useRouter()
const { currentUser, isAuthenticated, toggleInstructorEnabled, updateProfile, logout } = useAuth()

const name = ref(currentUser.value?.name || '')
const saveMessage = ref('')

const isLocked = computed(() => currentUser.value?.instructorLocked ?? false)
const instructorEnabled = computed(() => currentUser.value?.instructorEnabled ?? false)

function handleInstructorToggle(event: Event) {
  const target = event.target as HTMLInputElement
  const result = toggleInstructorEnabled(target.checked)
  if (!result.success) {
    // Revert the checkbox
    target.checked = !target.checked
  }
}

function saveName() {
  if (name.value.trim()) {
    updateProfile({ name: name.value.trim() })
    saveMessage.value = 'Name saved!'
    setTimeout(() => {
      saveMessage.value = ''
    }, 2000)
  }
}

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div v-if="!isAuthenticated" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">Sign in to access settings</h3>
        <router-link to="/login" class="btn btn-primary mt-4">Sign In</router-link>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>

          <div class="space-y-4">
            <div>
              <label class="label">Username</label>
              <input
                type="text"
                :value="currentUser?.username"
                disabled
                class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label class="label">Display Name</label>
              <div class="flex gap-2">
                <input
                  v-model="name"
                  type="text"
                  class="input flex-1"
                  placeholder="Your display name"
                />
                <button @click="saveName" class="btn btn-primary">Save</button>
              </div>
              <p v-if="saveMessage" class="text-sm text-green-600 dark:text-green-400 mt-1">{{ saveMessage }}</p>
            </div>

            <div>
              <label class="label">Role</label>
              <div class="flex items-center gap-2">
                <span :class="[
                  'px-3 py-1 text-sm font-medium rounded-full',
                  currentUser?.role === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  currentUser?.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  currentUser?.role === 'instructor' ? 'bg-water-100 text-water-800 dark:bg-water-900 dark:text-water-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                ]">
                  {{ currentUser?.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructor Features Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructor Features</h2>

          <div class="flex items-start gap-3">
            <div class="relative" :title="isLocked ? 'You cannot become an instructor right now.' : ''">
              <input
                type="checkbox"
                id="instructor-toggle"
                :checked="instructorEnabled"
                :disabled="isLocked"
                @change="handleInstructorToggle"
                class="w-5 h-5 text-water-600 rounded border-gray-300 focus:ring-water-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div class="flex-1">
              <label
                for="instructor-toggle"
                :class="[
                  'font-medium',
                  isLocked ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-900 dark:text-white cursor-pointer'
                ]"
              >
                Enable Instructor Features
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                When enabled, you can create and manage your own courses. Turn this off to hide instructor menus if you only want to take courses.
              </p>
              <p v-if="isLocked" class="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                You cannot become an instructor right now.
              </p>
            </div>
          </div>
        </div>

        <!-- Account Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>

          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Member since {{ currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown' }}
              </p>
            </div>

            <button @click="handleLogout" class="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
