import express from 'express'
import session from 'express-session'
import { Store } from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import coursesRoutes from './routes/courses.js'
import enrollmentsRoutes from './routes/enrollments.js'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Custom SQLite session store
class SQLiteStore extends Store {
  get(sid: string, callback: (err: Error | null, session?: session.SessionData | null) => void) {
    try {
      const row = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > datetime("now")').get(sid) as { sess: string } | undefined
      callback(null, row ? JSON.parse(row.sess) : null)
    } catch (err) {
      callback(err as Error)
    }
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: Error) => void) {
    try {
      const expired = new Date(Date.now() + (sess.cookie?.maxAge || 86400000)).toISOString()
      db.prepare('INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)').run(sid, JSON.stringify(sess), expired)
      callback?.()
    } catch (err) {
      callback?.(err as Error)
    }
  }

  destroy(sid: string, callback?: (err?: Error) => void) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid)
      callback?.()
    } catch (err) {
      callback?.(err as Error)
    }
  }

  touch(sid: string, sess: session.SessionData, callback?: (err?: Error) => void) {
    try {
      const expired = new Date(Date.now() + (sess.cookie?.maxAge || 86400000)).toISOString()
      db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?').run(expired, sid)
      callback?.()
    } catch (err) {
      callback?.(err as Error)
    }
  }
}

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  store: new SQLiteStore()
}))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/enrollments', enrollmentsRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))

  // SPA fallback
  app.get('/*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Clean up expired sessions periodically
setInterval(() => {
  db.prepare('DELETE FROM sessions WHERE expired < datetime("now")').run()
}, 60 * 60 * 1000) // Every hour
