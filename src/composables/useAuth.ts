import { ref, computed } from 'vue'
import type { User, UserRole } from '../types'

const currentUser = ref<User | null>(null)
const users = ref<User[]>([])
const isLoading = ref(false)

// API base URL
const API_BASE = '/api'

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  const isOwner = computed(() => currentUser.value?.role === 'owner')

  const isAdmin = computed(
    () => currentUser.value?.role === 'admin' || currentUser.value?.role === 'owner'
  )

  const isInstructor = computed(() => {
    if (!currentUser.value) return false
    // Owner and admin always have instructor capabilities
    if (currentUser.value.role === 'owner' || currentUser.value.role === 'admin') {
      return currentUser.value.instructorEnabled !== false // Default true for owner/admin
    }
    // Regular users need instructorEnabled and not be locked
    return currentUser.value.instructorEnabled && !currentUser.value.instructorLocked
  })

  const allUsers = computed(() => users.value)

  async function signup(username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      isLoading.value = true
      const data = await apiRequest<{ success: boolean; user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password, name })
      })
      currentUser.value = data.user
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      isLoading.value = false
    }
  }

  async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      isLoading.value = true
      const data = await apiRequest<{ success: boolean; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      currentUser.value = data.user
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      currentUser.value = null
    }
  }

  async function initAuth(): Promise<void> {
    try {
      isLoading.value = true
      const data = await apiRequest<{ user: User | null }>('/auth/me')
      currentUser.value = data.user
    } catch {
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Admin functions
  async function loadAllUsers(): Promise<void> {
    try {
      const data = await apiRequest<{ users: User[] }>('/users')
      users.value = data.users
    } catch {
      users.value = []
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiRequest<{ success: boolean; user: User }>(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      })

      // Update local state
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = data.user
      }

      // Update current user if they changed their own role
      if (currentUser.value?.id === userId) {
        currentUser.value = data.user
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async function transferOwnership(newOwnerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiRequest<{ success: boolean; user: User }>(`/users/${newOwnerId}/transfer-ownership`, {
        method: 'POST'
      })

      currentUser.value = data.user
      await loadAllUsers() // Refresh user list

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' })
      users.value = users.value.filter(u => u.id !== userId)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  function getUserById(userId: string): User | undefined {
    return users.value.find(u => u.id === userId)
  }

  // Toggle instructor features for current user
  async function toggleInstructorEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiRequest<{ success: boolean; user: User }>('/users/me/instructor', {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      })
      currentUser.value = data.user
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  // Admin function to lock/unlock user from becoming instructor
  async function setInstructorLock(userId: string, locked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiRequest<{ success: boolean; user: User }>(`/users/${userId}/instructor-lock`, {
        method: 'PATCH',
        body: JSON.stringify({ locked })
      })

      // Update local state
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = data.user
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  // Update user profile (name, etc.)
  async function updateProfile(updates: { name?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiRequest<{ success: boolean; user: User }>('/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      currentUser.value = data.user
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  return {
    currentUser,
    allUsers,
    isAuthenticated,
    isOwner,
    isAdmin,
    isInstructor,
    isLoading,
    signup,
    login,
    logout,
    initAuth,
    loadAllUsers,
    updateUserRole,
    transferOwnership,
    deleteUser,
    getUserById,
    toggleInstructorEnabled,
    setInstructorLock,
    updateProfile
  }
}
