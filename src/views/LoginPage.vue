<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'

const router = useRouter()
const { login, signup, allUsers } = useAuth()

const isSignup = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const error = ref('')
const isSubmitting = ref(false)

const isFirstUser = computed(() => allUsers.value.length === 0)

function handleLogin() {
  error.value = ''

  if (!username.value) {
    error.value = 'Please enter your username'
    return
  }

  if (!password.value) {
    error.value = 'Please enter your password'
    return
  }

  isSubmitting.value = true
  const result = login(username.value, password.value)
  isSubmitting.value = false

  if (result.success) {
    router.push('/courses')
  } else {
    error.value = result.error || 'Login failed'
  }
}

function handleSignup() {
  error.value = ''

  if (!username.value) {
    error.value = 'Please enter a username'
    return
  }

  if (username.value.length < 3) {
    error.value = 'Username must be at least 3 characters'
    return
  }

  if (!name.value) {
    error.value = 'Please enter your name'
    return
  }

  if (!password.value) {
    error.value = 'Please enter a password'
    return
  }

  if (password.value.length < 4) {
    error.value = 'Password must be at least 4 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  isSubmitting.value = true
  const result = signup(username.value, password.value, name.value)
  isSubmitting.value = false

  if (result.success) {
    router.push('/courses')
  } else {
    error.value = result.error || 'Signup failed'
  }
}

function toggleMode() {
  isSignup.value = !isSignup.value
  error.value = ''
}
</script>

<template>
  <AppLayout>
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div class="card max-w-md w-full p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-water-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span class="text-white font-bold text-2xl">&lt;/&gt;</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isSignup ? 'Create Account' : 'Welcome Back' }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            <template v-if="isSignup">
              <span v-if="isFirstUser" class="text-water-600 dark:text-water-400 font-medium">
                You'll be the owner of this platform!
              </span>
              <span v-else>Sign up to start learning</span>
            </template>
            <template v-else>Sign in to continue learning</template>
          </p>
        </div>

        <!-- Signup Form -->
        <form v-if="isSignup" @submit.prevent="handleSignup" class="space-y-4">
          <div>
            <label class="label" for="name">Full Name</label>
            <input
              id="name"
              type="text"
              v-model="name"
              class="input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="label" for="username">Username</label>
            <input
              id="username"
              type="text"
              v-model="username"
              class="input"
              placeholder="johndoe"
              autocomplete="username"
            />
          </div>

          <div>
            <label class="label" for="password">Password</label>
            <input
              id="password"
              type="password"
              v-model="password"
              class="input"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="label" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              class="input"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary w-full py-3"
          >
            {{ isSubmitting ? 'Creating account...' : (isFirstUser ? 'Create Owner Account' : 'Create Account') }}
          </button>
        </form>

        <!-- Login Form -->
        <form v-else @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label" for="username">Username</label>
            <input
              id="username"
              type="text"
              v-model="username"
              class="input"
              placeholder="johndoe"
              autocomplete="username"
            />
          </div>

          <div>
            <label class="label" for="password">Password</label>
            <input
              id="password"
              type="password"
              v-model="password"
              class="input"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary w-full py-3"
          >
            {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Toggle between login/signup -->
        <div class="mt-6 text-center">
          <p class="text-gray-600 dark:text-gray-400">
            {{ isSignup ? 'Already have an account?' : "Don't have an account?" }}
            <button
              @click="toggleMode"
              class="text-water-600 dark:text-water-400 font-medium hover:underline ml-1"
            >
              {{ isSignup ? 'Sign In' : 'Sign Up' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
