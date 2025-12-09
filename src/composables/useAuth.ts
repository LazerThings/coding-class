import { ref, computed } from 'vue'
import type { User, UserRole } from '../types'

const currentUser = ref<User | null>(null)
const users = ref<User[]>([])
const isLoading = ref(false)

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function loadUsers() {
  const stored = localStorage.getItem('users')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      users.value = parsed.map((u: User) => ({
        ...u,
        createdAt: new Date(u.createdAt),
        // Migration: add new fields if missing
        instructorEnabled: u.instructorEnabled ?? (u.role === 'owner' || u.role === 'admin' || u.role === 'instructor'),
        instructorLocked: u.instructorLocked ?? false
      }))
    } catch {
      users.value = []
    }
  }
}

function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users.value))
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

  function signup(username: string, password: string, name: string): { success: boolean; error?: string } {
    loadUsers()

    // Check if username already exists
    if (users.value.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already taken' }
    }

    // First user becomes owner
    const isFirstUser = users.value.length === 0
    const role: UserRole = isFirstUser ? 'owner' : 'student'

    const newUser: User = {
      id: generateId(),
      username,
      password,
      name,
      role,
      instructorEnabled: isFirstUser, // Owner has instructor enabled by default
      instructorLocked: false,
      createdAt: new Date()
    }

    users.value.push(newUser)
    saveUsers()

    // Auto login
    currentUser.value = newUser
    localStorage.setItem('currentUser', JSON.stringify(newUser))

    return { success: true }
  }

  function login(username: string, password: string): { success: boolean; error?: string } {
    loadUsers()

    const user = users.value.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )

    if (!user) {
      return { success: false, error: 'Invalid username or password' }
    }

    currentUser.value = user
    localStorage.setItem('currentUser', JSON.stringify(user))
    return { success: true }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  function initAuth() {
    loadUsers()

    const stored = localStorage.getItem('currentUser')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Verify user still exists and update from users list
        const user = users.value.find(u => u.id === parsed.id)
        if (user) {
          currentUser.value = user
          localStorage.setItem('currentUser', JSON.stringify(user))
        } else {
          localStorage.removeItem('currentUser')
        }
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
  }

  // Admin functions
  function updateUserRole(userId: string, newRole: UserRole): { success: boolean; error?: string } {
    if (!isAdmin.value) {
      return { success: false, error: 'Not authorized' }
    }

    const targetUser = users.value.find(u => u.id === userId)
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Cannot change owner's role (only transfer ownership)
    if (targetUser.role === 'owner') {
      return { success: false, error: 'Cannot change owner role. Use transfer ownership instead.' }
    }

    // Only owner can promote to admin
    if (newRole === 'admin' && !isOwner.value) {
      return { success: false, error: 'Only owner can promote users to admin' }
    }

    // Cannot make someone owner through this function
    if (newRole === 'owner') {
      return { success: false, error: 'Use transfer ownership to change owner' }
    }

    targetUser.role = newRole
    saveUsers()

    // Update current user if they changed their own role
    if (currentUser.value?.id === userId) {
      currentUser.value = { ...targetUser }
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }

    return { success: true }
  }

  function transferOwnership(newOwnerId: string): { success: boolean; error?: string } {
    if (!isOwner.value) {
      return { success: false, error: 'Only owner can transfer ownership' }
    }

    const newOwner = users.value.find(u => u.id === newOwnerId)
    if (!newOwner) {
      return { success: false, error: 'User not found' }
    }

    if (newOwner.id === currentUser.value?.id) {
      return { success: false, error: 'You are already the owner' }
    }

    // Demote current owner to admin
    const currentOwner = users.value.find(u => u.role === 'owner')
    if (currentOwner) {
      currentOwner.role = 'admin'
    }

    // Promote new owner
    newOwner.role = 'owner'
    saveUsers()

    // Update current user
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, role: 'admin' }
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }

    return { success: true }
  }

  function deleteUser(userId: string): { success: boolean; error?: string } {
    if (!isAdmin.value) {
      return { success: false, error: 'Not authorized' }
    }

    const targetUser = users.value.find(u => u.id === userId)
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Cannot delete owner
    if (targetUser.role === 'owner') {
      return { success: false, error: 'Cannot delete owner account' }
    }

    // Cannot delete yourself
    if (targetUser.id === currentUser.value?.id) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    // Only owner can delete admins
    if (targetUser.role === 'admin' && !isOwner.value) {
      return { success: false, error: 'Only owner can delete admin accounts' }
    }

    users.value = users.value.filter(u => u.id !== userId)
    saveUsers()

    return { success: true }
  }

  function getUserById(userId: string): User | undefined {
    return users.value.find(u => u.id === userId)
  }

  // Toggle instructor features for current user
  function toggleInstructorEnabled(enabled: boolean): { success: boolean; error?: string } {
    if (!currentUser.value) {
      return { success: false, error: 'Not logged in' }
    }

    // Check if user is locked
    if (enabled && currentUser.value.instructorLocked) {
      return { success: false, error: 'You cannot become an instructor right now.' }
    }

    const user = users.value.find(u => u.id === currentUser.value!.id)
    if (user) {
      user.instructorEnabled = enabled
      saveUsers()
      currentUser.value = { ...user }
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }

    return { success: true }
  }

  // Admin function to lock/unlock user from becoming instructor
  function setInstructorLock(userId: string, locked: boolean): { success: boolean; error?: string } {
    if (!isAdmin.value) {
      return { success: false, error: 'Not authorized' }
    }

    const targetUser = users.value.find(u => u.id === userId)
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Cannot lock owner or admins
    if (targetUser.role === 'owner' || targetUser.role === 'admin') {
      return { success: false, error: 'Cannot lock owner or admin accounts' }
    }

    targetUser.instructorLocked = locked
    // If locking, also disable instructor features
    if (locked) {
      targetUser.instructorEnabled = false
    }
    saveUsers()

    return { success: true }
  }

  // Update user profile (name, etc.)
  function updateProfile(updates: { name?: string }): { success: boolean; error?: string } {
    if (!currentUser.value) {
      return { success: false, error: 'Not logged in' }
    }

    const user = users.value.find(u => u.id === currentUser.value!.id)
    if (user) {
      if (updates.name) user.name = updates.name
      saveUsers()
      currentUser.value = { ...user }
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    }

    return { success: true }
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
    updateUserRole,
    transferOwnership,
    deleteUser,
    getUserById,
    toggleInstructorEnabled,
    setInstructorLock,
    updateProfile
  }
}
