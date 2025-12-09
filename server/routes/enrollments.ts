import { Router, Request, Response, NextFunction } from 'express'
import db from '../db.js'

const router = Router()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

interface DbEnrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
}

interface DbLessonProgress {
  id: string
  enrollment_id: string
  lesson_id: string
  completed: number
  started_at: string | null
  completed_at: string | null
}

interface DbCompletedBlock {
  id: string
  lesson_progress_id: string
  block_id: string
  completed_at: string
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  next()
}

function getEnrollmentWithProgress(enrollmentId: string) {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId) as DbEnrollment | undefined
  if (!enrollment) return null

  const lessonProgressRows = db.prepare('SELECT * FROM lesson_progress WHERE enrollment_id = ?').all(enrollmentId) as DbLessonProgress[]

  const lessonProgress: Record<string, {
    lessonId: string
    completed: boolean
    completedBlocks: string[]
    startedAt?: Date
    completedAt?: Date
  }> = {}

  for (const lp of lessonProgressRows) {
    const completedBlocks = db.prepare('SELECT block_id FROM completed_blocks WHERE lesson_progress_id = ?').all(lp.id) as { block_id: string }[]

    lessonProgress[lp.lesson_id] = {
      lessonId: lp.lesson_id,
      completed: Boolean(lp.completed),
      completedBlocks: completedBlocks.map(b => b.block_id),
      startedAt: lp.started_at ? new Date(lp.started_at) : undefined,
      completedAt: lp.completed_at ? new Date(lp.completed_at) : undefined
    }
  }

  return {
    id: enrollment.id,
    userId: enrollment.user_id,
    courseId: enrollment.course_id,
    progress: {
      courseId: enrollment.course_id,
      lessonProgress,
      startedAt: new Date(enrollment.enrolled_at),
      completedAt: enrollment.completed_at ? new Date(enrollment.completed_at) : undefined
    },
    enrolledAt: new Date(enrollment.enrolled_at)
  }
}

// GET /api/enrollments - Get current user's enrollments
router.get('/', requireAuth, (req, res) => {
  const enrollments = db.prepare('SELECT * FROM enrollments WHERE user_id = ?').all(req.session.userId) as DbEnrollment[]

  const result = enrollments.map(e => getEnrollmentWithProgress(e.id))
  res.json({ enrollments: result })
})

// GET /api/enrollments/:courseId - Check enrollment for a course
router.get('/:courseId', requireAuth, (req, res) => {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.session.userId, req.params.courseId) as DbEnrollment | undefined

  if (!enrollment) {
    res.json({ enrolled: false, enrollment: null })
    return
  }

  res.json({ enrolled: true, enrollment: getEnrollmentWithProgress(enrollment.id) })
})

// POST /api/enrollments/:courseId - Enroll in course
router.post('/:courseId', requireAuth, (req, res) => {
  // Check if course exists
  const course = db.prepare('SELECT id FROM courses WHERE id = ? AND is_published = 1').get(req.params.courseId)
  if (!course) {
    res.status(404).json({ error: 'Course not found' })
    return
  }

  // Check if already enrolled
  const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.session.userId, req.params.courseId)
  if (existing) {
    res.status(400).json({ error: 'Already enrolled in this course' })
    return
  }

  const id = generateId()
  db.prepare('INSERT INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)').run(id, req.session.userId, req.params.courseId)

  const enrollment = getEnrollmentWithProgress(id)
  res.status(201).json({ enrollment })
})

// POST /api/enrollments/:courseId/progress - Mark block as completed
router.post('/:courseId/progress', requireAuth, (req, res) => {
  const { lessonId, blockId } = req.body

  if (!lessonId || !blockId) {
    res.status(400).json({ error: 'lessonId and blockId are required' })
    return
  }

  // Get or create enrollment
  let enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.session.userId, req.params.courseId) as DbEnrollment | undefined

  if (!enrollment) {
    // Auto-enroll
    const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.courseId)
    if (!course) {
      res.status(404).json({ error: 'Course not found' })
      return
    }

    const enrollmentId = generateId()
    db.prepare('INSERT INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)').run(enrollmentId, req.session.userId, req.params.courseId)
    enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId) as DbEnrollment
  }

  // Get or create lesson progress
  let lessonProgress = db.prepare('SELECT * FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?').get(enrollment.id, lessonId) as DbLessonProgress | undefined

  if (!lessonProgress) {
    const lpId = generateId()
    db.prepare('INSERT INTO lesson_progress (id, enrollment_id, lesson_id, started_at) VALUES (?, ?, ?, ?)').run(lpId, enrollment.id, lessonId, new Date().toISOString())
    lessonProgress = db.prepare('SELECT * FROM lesson_progress WHERE id = ?').get(lpId) as DbLessonProgress
  }

  // Add completed block if not already completed
  const existingBlock = db.prepare('SELECT id FROM completed_blocks WHERE lesson_progress_id = ? AND block_id = ?').get(lessonProgress.id, blockId)
  if (!existingBlock) {
    db.prepare('INSERT INTO completed_blocks (id, lesson_progress_id, block_id) VALUES (?, ?, ?)').run(generateId(), lessonProgress.id, blockId)
  }

  // Check if lesson is complete (all blocks done)
  const lesson = db.prepare('SELECT id FROM lessons WHERE id = ?').get(lessonId) as { id: string } | undefined
  if (lesson) {
    const totalBlocks = db.prepare('SELECT COUNT(*) as count FROM content_blocks WHERE lesson_id = ?').get(lessonId) as { count: number }
    const completedBlocks = db.prepare('SELECT COUNT(*) as count FROM completed_blocks WHERE lesson_progress_id = ?').get(lessonProgress.id) as { count: number }

    if (completedBlocks.count >= totalBlocks.count && totalBlocks.count > 0) {
      db.prepare('UPDATE lesson_progress SET completed = 1, completed_at = ? WHERE id = ?').run(new Date().toISOString(), lessonProgress.id)
    }
  }

  const result = getEnrollmentWithProgress(enrollment.id)
  res.json({ enrollment: result })
})

// GET /api/enrollments/:courseId/completion - Get completion percentage
router.get('/:courseId/completion', requireAuth, (req, res) => {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.session.userId, req.params.courseId) as DbEnrollment | undefined

  if (!enrollment) {
    res.json({ percent: 0 })
    return
  }

  // Get total blocks in course
  const totalBlocks = db.prepare(`
    SELECT COUNT(*) as count FROM content_blocks cb
    JOIN lessons l ON cb.lesson_id = l.id
    WHERE l.course_id = ?
  `).get(req.params.courseId) as { count: number }

  if (totalBlocks.count === 0) {
    res.json({ percent: 0 })
    return
  }

  // Get completed blocks for this enrollment
  const completedBlocks = db.prepare(`
    SELECT COUNT(*) as count FROM completed_blocks cb
    JOIN lesson_progress lp ON cb.lesson_progress_id = lp.id
    WHERE lp.enrollment_id = ?
  `).get(enrollment.id) as { count: number }

  const percent = Math.round((completedBlocks.count / totalBlocks.count) * 100)
  res.json({ percent })
})

export default router
