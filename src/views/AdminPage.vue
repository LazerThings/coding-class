<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import AppLayout from '../components/layout/AppLayout.vue'
import type { User, UserRole } from '../types'

const {
  currentUser,
  allUsers,
  isAdmin,
  isOwner,
  updateUserRole,
  transferOwnership,
  deleteUser,
  setInstructorLock,
  loadAllUsers
} = useAuth()

onMounted(() => {
  loadAllUsers()
})

const error = ref('')
const success = ref('')
const showTransferModal = ref(false)
const transferTargetId = ref('')

const sortedUsers = computed(() => {
  const roleOrder: Record<UserRole, number> = { owner: 0, admin: 1, student: 2 }
  return [...allUsers.value].sort((a, b) => {
    const roleCompare = roleOrder[a.role] - roleOrder[b.role]
    if (roleCompare !== 0) return roleCompare
    return a.name.localeCompare(b.name)
  })
})

const roleColors: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  student: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

async function handleRoleChange(user: User, newRole: UserRole) {
  error.value = ''
  success.value = ''

  const result = await updateUserRole(user.id, newRole)
  if (result.success) {
    success.value = `${user.name}'s role updated to ${newRole}`
    setTimeout(() => success.value = '', 3000)
  } else {
    error.value = result.error || 'Failed to update role'
  }
}

async function handleDelete(user: User) {
  if (!confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) {
    return
  }

  error.value = ''
  success.value = ''

  const result = await deleteUser(user.id)
  if (result.success) {
    success.value = `${user.name} has been deleted`
    setTimeout(() => success.value = '', 3000)
  } else {
    error.value = result.error || 'Failed to delete user'
  }
}

function openTransferModal(userId: string) {
  transferTargetId.value = userId
  showTransferModal.value = true
}

async function confirmTransfer() {
  error.value = ''
  success.value = ''

  const targetUser = allUsers.value.find(u => u.id === transferTargetId.value)
  const result = await transferOwnership(transferTargetId.value)

  showTransferModal.value = false
  transferTargetId.value = ''

  if (result.success) {
    success.value = `Ownership transferred to ${targetUser?.name}. You are now an admin.`
  } else {
    error.value = result.error || 'Failed to transfer ownership'
  }
}

function canModifyUser(user: User): boolean {
  // Can't modify yourself
  if (user.id === currentUser.value?.id) return false
  // Can't modify owner
  if (user.role === 'owner') return false
  // Only owner can modify admins
  if (user.role === 'admin' && !isOwner.value) return false
  return true
}

function getAvailableRoles(user: User): UserRole[] {
  const roles: UserRole[] = ['student']
  // Only owner can set admin role
  if (isOwner.value && user.role !== 'owner') {
    roles.push('admin')
  }
  return roles
}

async function handleInstructorLock(user: User, locked: boolean) {
  error.value = ''
  success.value = ''

  const result = await setInstructorLock(user.id, locked)
  if (result.success) {
    success.value = locked
      ? `${user.name} is now locked from becoming an instructor`
      : `${user.name} can now become an instructor`
    setTimeout(() => success.value = '', 3000)
  } else {
    error.value = result.error || 'Failed to update lock status'
  }
}

function canLockUser(user: User): boolean {
  // Can't lock owner or admins
  if (user.role === 'owner' || user.role === 'admin') return false
  // Can't lock yourself
  if (user.id === currentUser.value?.id) return false
  return true
}
</script>

<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage users and permissions</p>
      </div>

      <!-- Not Authorized -->
      <div v-if="!isAdmin" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">Admin access required</h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">You need admin privileges to access this page</p>
      </div>

      <template v-else>
        <!-- Messages -->
        <div v-if="error" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {{ error }}
        </div>
        <div v-if="success" class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
          {{ success }}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ allUsers.length }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Admins</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ allUsers.filter(u => u.role === 'admin' || u.role === 'owner').length }}
            </p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Instructors</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ allUsers.filter(u => u.instructorEnabled && !u.instructorLocked).length }}
            </p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Students</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ allUsers.filter(u => u.role === 'student').length }}
            </p>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">All Users</h2>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="user in sortedUsers" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-water-100 dark:bg-water-900 rounded-full flex items-center justify-center">
                        <span class="text-water-600 dark:text-water-300 font-medium">
                          {{ user.name.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ user.name }}
                          <span v-if="user.id === currentUser?.id" class="text-xs text-gray-500">(you)</span>
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">@{{ user.username }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['px-2 py-1 text-xs font-medium rounded-full', roleColors[user.role]]">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <!-- Owner/Admin always have instructor access -->
                    <span v-if="user.role === 'owner' || user.role === 'admin'" class="text-xs text-gray-400 italic">
                      Always enabled
                    </span>
                    <!-- Lock toggle for other users -->
                    <div v-else-if="canLockUser(user)" class="flex items-center gap-2">
                      <button
                        @click="handleInstructorLock(user, !user.instructorLocked)"
                        :class="[
                          'px-2 py-1 text-xs font-medium rounded-full transition-colors',
                          user.instructorLocked
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200'
                        ]"
                        :title="user.instructorLocked ? 'Click to unlock' : 'Click to lock'"
                      >
                        {{ user.instructorLocked ? 'Locked' : 'Allowed' }}
                      </button>
                      <span v-if="user.instructorEnabled && !user.instructorLocked" class="text-xs text-water-600 dark:text-water-400">
                        (Active)
                      </span>
                    </div>
                    <span v-else class="text-xs text-gray-400">—</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ new Date(user.createdAt).toLocaleDateString() }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-2">
                      <!-- Role selector -->
                      <select
                        v-if="canModifyUser(user)"
                        :value="user.role"
                        @change="handleRoleChange(user, ($event.target as HTMLSelectElement).value as UserRole)"
                        class="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option v-for="role in getAvailableRoles(user)" :key="role" :value="role">
                          {{ role }}
                        </option>
                      </select>

                      <!-- Transfer ownership button (owner only) -->
                      <button
                        v-if="isOwner && user.id !== currentUser?.id && user.role !== 'owner'"
                        @click="openTransferModal(user.id)"
                        class="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        title="Transfer ownership"
                      >
                        Transfer
                      </button>

                      <!-- Delete button -->
                      <button
                        v-if="canModifyUser(user)"
                        @click="handleDelete(user)"
                        class="text-red-600 hover:text-red-700"
                        title="Delete user"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <!-- Placeholder for owner's row -->
                      <span v-if="user.role === 'owner'" class="text-xs text-gray-400 italic">
                        Owner
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Transfer Ownership Modal -->
    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showTransferModal = false"></div>
      <div class="card relative z-10 w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Transfer Ownership</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to transfer ownership to
          <strong>{{ allUsers.find(u => u.id === transferTargetId)?.name }}</strong>?
          You will become an admin after the transfer.
        </p>
        <p class="text-red-600 dark:text-red-400 text-sm mb-4">
          This action cannot be undone by you. Only the new owner can transfer ownership back.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="showTransferModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="confirmTransfer" class="btn btn-danger">Transfer Ownership</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
