import { Router } from 'express'
import bcrypt from 'bcrypt'
import db from '../db.js'
import type { User } from '../../src/types/index.js'

const router = Router()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId: string
  }
}

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

function dbUserToUser(row: DbUser): Omit<User, 'password'> & { password?: undefined } {
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

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, name } = req.body

    if (!username || !password || !name) {
      res.status(400).json({ error: 'Username, password, and name are required' })
      return
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username)
    if (existing) {
      res.status(400).json({ error: 'Username already taken' })
      return
    }

    // Check if this is the first user (becomes owner)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    const isFirstUser = userCount.count === 0
    const role = isFirstUser ? 'owner' : 'student'

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    const id = generateId()
    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role, instructor_enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username, passwordHash, name, role, isFirstUser ? 1 : 0)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser

    // Set session
    req.session.userId = id

    res.json({ success: true, user: dbUserToUser(user) })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username) as DbUser | undefined

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    // Set session
    req.session.userId = user.id

    res.json({ success: true, user: dbUserToUser(user) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' })
      return
    }
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    res.json({ user: null })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as DbUser | undefined

  if (!user) {
    req.session.destroy(() => {})
    res.json({ user: null })
    return
  }

  res.json({ user: dbUserToUser(user) })
})

export default router
