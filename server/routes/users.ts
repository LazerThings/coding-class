import { Router, Request, Response, NextFunction } from 'express'
import db from '../db.js'
import type { User, UserRole } from '../../src/types/index.js'

const router = Router()

interface DbUser {
  id: string
  username: string
  password_hash: string
  name: string
  role: string
  avatar: string | null
  instructor_enabled: number
  instructor_locked: number
  created_at: string
}

function dbUserToUser(row: DbUser): Omit<User, 'password'> {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as User['role'],
    avatar: row.avatar || undefined,
    instructorEnabled: Boolean(row.instructor_enabled),
    instructorLocked: Boolean(row.instructor_locked),
    createdAt: new Date(row.created_at)
  }
}

function getCurrentUser(req: Request): DbUser | null {
  if (!req.session.userId) return null
  return db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as DbUser | undefined || null
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  next()
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getCurrentUser(req)
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    res.status(403).json({ error: 'Not authorized' })
    return
  }
  next()
}

// GET /api/users - List all users (admin only)
router.get('/', requireAuth, requireAdmin, (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as DbUser[]
  res.json({ users: users.map(dbUserToUser) })
})

// GET /api/users/:id - Get user by ID
router.get('/:id', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser | undefined
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user: dbUserToUser(user) })
})

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, (req, res) => {
  const currentUser = getCurrentUser(req)!
  const { role } = req.body as { role: UserRole }

  if (!['student', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' })
    return
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser | undefined
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  // Cannot change owner's role
  if (targetUser.role === 'owner') {
    res.status(403).json({ error: 'Cannot change owner role. Use transfer ownership instead.' })
    return
  }

  // Only owner can promote to admin
  if (role === 'admin' && currentUser.role !== 'owner') {
    res.status(403).json({ error: 'Only owner can promote users to admin' })
    return
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser
  res.json({ success: true, user: dbUserToUser(updatedUser) })
})

// POST /api/users/:id/transfer-ownership - Transfer ownership (owner only)
router.post('/:id/transfer-ownership', requireAuth, (req, res) => {
  const currentUser = getCurrentUser(req)!

  if (currentUser.role !== 'owner') {
    res.status(403).json({ error: 'Only owner can transfer ownership' })
    return
  }

  const newOwnerId = req.params.id
  if (newOwnerId === currentUser.id) {
    res.status(400).json({ error: 'You are already the owner' })
    return
  }

  const newOwner = db.prepare('SELECT * FROM users WHERE id = ?').get(newOwnerId) as DbUser | undefined
  if (!newOwner) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  // Transaction: demote current owner to admin, promote new owner
  const transaction = db.transaction(() => {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', currentUser.id)
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('owner', newOwnerId)
  })
  transaction()

  const updatedCurrentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id) as DbUser
  res.json({ success: true, user: dbUserToUser(updatedCurrentUser) })
})

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const currentUser = getCurrentUser(req)!
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser | undefined

  if (!targetUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (targetUser.role === 'owner') {
    res.status(403).json({ error: 'Cannot delete owner account' })
    return
  }

  if (targetUser.id === currentUser.id) {
    res.status(403).json({ error: 'Cannot delete your own account' })
    return
  }

  if (targetUser.role === 'admin' && currentUser.role !== 'owner') {
    res.status(403).json({ error: 'Only owner can delete admin accounts' })
    return
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// PATCH /api/users/me/instructor - Toggle instructor features
router.patch('/me/instructor', requireAuth, (req, res) => {
  const currentUser = getCurrentUser(req)!
  const { enabled } = req.body as { enabled: boolean }

  if (enabled && currentUser.instructor_locked) {
    res.status(403).json({ error: 'You cannot become an instructor right now.' })
    return
  }

  db.prepare('UPDATE users SET instructor_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, currentUser.id)
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id) as DbUser
  res.json({ success: true, user: dbUserToUser(updatedUser) })
})

// PATCH /api/users/:id/instructor-lock - Lock/unlock instructor access (admin only)
router.patch('/:id/instructor-lock', requireAuth, requireAdmin, (req, res) => {
  const { locked } = req.body as { locked: boolean }
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser | undefined

  if (!targetUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (targetUser.role === 'owner' || targetUser.role === 'admin') {
    res.status(403).json({ error: 'Cannot lock owner or admin accounts' })
    return
  }

  // If locking, also disable instructor features
  if (locked) {
    db.prepare('UPDATE users SET instructor_locked = 1, instructor_enabled = 0 WHERE id = ?').run(req.params.id)
  } else {
    db.prepare('UPDATE users SET instructor_locked = 0 WHERE id = ?').run(req.params.id)
  }

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as DbUser
  res.json({ success: true, user: dbUserToUser(updatedUser) })
})

// PATCH /api/users/me/profile - Update own profile
router.patch('/me/profile', requireAuth, (req, res) => {
  const currentUser = getCurrentUser(req)!
  const { name } = req.body as { name?: string }

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, currentUser.id)
  }

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id) as DbUser
  res.json({ success: true, user: dbUserToUser(updatedUser) })
})

export default router
