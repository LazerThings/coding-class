import { Router, Request, Response, NextFunction } from 'express'
import db from '../db.js'
import type { Course, Lesson, ContentBlock } from '../../src/types/index.js'

const router = Router()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

interface DbCourse {
  id: string
  title: string
  description: string
  thumbnail: string | null
  instructor_id: string
  instructor_name: string
  tags: string
  is_published: number
  created_at: string
  updated_at: string
}

interface DbLesson {
  id: string
  course_id: string
  title: string
  description: string
  order: number
  duration: number | null
  is_published: number
}

interface DbContentBlock {
  id: string
  lesson_id: string
  type: string
  order: number
  data: string
}

interface DbUser {
  id: string
  role: string
  instructor_enabled: number
  instructor_locked: number
}

function getCurrentUser(req: Request): DbUser | null {
  if (!req.session.userId) return null
  return db.prepare('SELECT id, role, instructor_enabled, instructor_locked FROM users WHERE id = ?').get(req.session.userId) as DbUser | undefined || null
}

function isInstructor(user: DbUser): boolean {
  if (user.role === 'owner' || user.role === 'admin') {
    return true
  }
  return Boolean(user.instructor_enabled) && !user.instructor_locked
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  next()
}

function requireInstructor(req: Request, res: Response, next: NextFunction) {
  const user = getCurrentUser(req)
  if (!user || !isInstructor(user)) {
    res.status(403).json({ error: 'Instructor access required' })
    return
  }
  next()
}

function dbCourseToCourse(row: DbCourse): Omit<Course, 'lessons'> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail || undefined,
    instructorId: row.instructor_id,
    instructorName: row.instructor_name,
    tags: JSON.parse(row.tags),
    isPublished: Boolean(row.is_published),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

function dbLessonToLesson(row: DbLesson): Omit<Lesson, 'contentBlocks'> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    order: row.order,
    duration: row.duration || undefined,
    isPublished: Boolean(row.is_published)
  }
}

function dbBlockToBlock(row: DbContentBlock): ContentBlock {
  const data = JSON.parse(row.data)
  return {
    id: row.id,
    type: row.type,
    order: row.order,
    ...data
  } as ContentBlock
}

function getCourseWithLessons(courseId: string): Course | null {
  const courseRow = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as DbCourse | undefined
  if (!courseRow) return null

  const course = dbCourseToCourse(courseRow) as Course
  const lessonRows = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY "order"').all(courseId) as DbLesson[]

  course.lessons = lessonRows.map(lessonRow => {
    const lesson = dbLessonToLesson(lessonRow) as Lesson
    const blockRows = db.prepare('SELECT * FROM content_blocks WHERE lesson_id = ? ORDER BY "order"').all(lessonRow.id) as DbContentBlock[]
    lesson.contentBlocks = blockRows.map(dbBlockToBlock)
    return lesson
  })

  return course
}

// GET /api/courses - List all published courses (or all if instructor)
router.get('/', (req, res) => {
  const user = getCurrentUser(req)
  let courses: Course[]

  if (user && isInstructor(user)) {
    // Instructors see all their courses + all published
    const rows = db.prepare(`
      SELECT DISTINCT c.* FROM courses c
      WHERE c.is_published = 1 OR c.instructor_id = ?
      ORDER BY c.created_at DESC
    `).all(user.id) as DbCourse[]
    courses = rows.map(row => getCourseWithLessons(row.id)!)
  } else {
    // Regular users see only published
    const rows = db.prepare('SELECT * FROM courses WHERE is_published = 1 ORDER BY created_at DESC').all() as DbCourse[]
    courses = rows.map(row => getCourseWithLessons(row.id)!)
  }

  res.json({ courses })
})

// GET /api/courses/my - Get courses by current instructor
router.get('/my', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const rows = db.prepare('SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC').all(user.id) as DbCourse[]
  const courses = rows.map(row => getCourseWithLessons(row.id)!)
  res.json({ courses })
})

// GET /api/courses/:id - Get single course
router.get('/:id', (req, res) => {
  const course = getCourseWithLessons(req.params.id)
  if (!course) {
    res.status(404).json({ error: 'Course not found' })
    return
  }

  // Check access
  const user = getCurrentUser(req)
  if (!course.isPublished) {
    if (!user || (course.instructorId !== user.id && user.role !== 'owner' && user.role !== 'admin')) {
      res.status(404).json({ error: 'Course not found' })
      return
    }
  }

  res.json({ course })
})

// POST /api/courses - Create course
router.post('/', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const userInfo = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string }

  const { title, description, thumbnail, tags, isPublished } = req.body

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' })
    return
  }

  const id = generateId()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO courses (id, title, description, thumbnail, instructor_id, instructor_name, tags, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    description,
    thumbnail || null,
    user.id,
    userInfo.name,
    JSON.stringify(tags || []),
    isPublished ? 1 : 0,
    now,
    now
  )

  const course = getCourseWithLessons(id)!
  res.status(201).json({ course })
})

// PATCH /api/courses/:id - Update course
router.patch('/:id', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as DbCourse | undefined

  if (!course) {
    res.status(404).json({ error: 'Course not found' })
    return
  }

  // Only course owner or admin can edit
  if (course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to edit this course' })
    return
  }

  const { title, description, thumbnail, tags, isPublished } = req.body
  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (title !== undefined) { updates.push('title = ?'); values.push(title) }
  if (description !== undefined) { updates.push('description = ?'); values.push(description) }
  if (thumbnail !== undefined) { updates.push('thumbnail = ?'); values.push(thumbnail || null) }
  if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)) }
  if (isPublished !== undefined) { updates.push('is_published = ?'); values.push(isPublished ? 1 : 0) }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(req.params.id)
    db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  const updatedCourse = getCourseWithLessons(req.params.id)!
  res.json({ course: updatedCourse })
})

// DELETE /api/courses/:id - Delete course
router.delete('/:id', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as DbCourse | undefined

  if (!course) {
    res.status(404).json({ error: 'Course not found' })
    return
  }

  if (course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to delete this course' })
    return
  }

  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/courses/:id/lessons - Add lesson
router.post('/:id/lessons', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as DbCourse | undefined

  if (!course) {
    res.status(404).json({ error: 'Course not found' })
    return
  }

  if (course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const { title, description, order, duration, isPublished } = req.body

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' })
    return
  }

  // Get max order if not provided
  let lessonOrder = order
  if (lessonOrder === undefined) {
    const maxOrder = db.prepare('SELECT MAX("order") as max FROM lessons WHERE course_id = ?').get(req.params.id) as { max: number | null }
    lessonOrder = (maxOrder.max || 0) + 1
  }

  const id = generateId()
  db.prepare(`
    INSERT INTO lessons (id, course_id, title, description, "order", duration, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, title, description, lessonOrder, duration || null, isPublished ? 1 : 0)

  // Update course updated_at
  db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id) as DbLesson
  res.status(201).json({ lesson: { ...dbLessonToLesson(lesson), contentBlocks: [] } })
})

// PATCH /api/courses/:courseId/lessons/:lessonId - Update lesson
router.patch('/:courseId/lessons/:lessonId', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId) as DbCourse | undefined

  if (!course || course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(req.params.lessonId, req.params.courseId) as DbLesson | undefined
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' })
    return
  }

  const { title, description, order, duration, isPublished } = req.body
  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (title !== undefined) { updates.push('title = ?'); values.push(title) }
  if (description !== undefined) { updates.push('description = ?'); values.push(description) }
  if (order !== undefined) { updates.push('"order" = ?'); values.push(order) }
  if (duration !== undefined) { updates.push('duration = ?'); values.push(duration || null) }
  if (isPublished !== undefined) { updates.push('is_published = ?'); values.push(isPublished ? 1 : 0) }

  if (updates.length > 0) {
    values.push(req.params.lessonId)
    db.prepare(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.courseId)
  }

  const updatedLesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId) as DbLesson
  const blockRows = db.prepare('SELECT * FROM content_blocks WHERE lesson_id = ? ORDER BY "order"').all(req.params.lessonId) as DbContentBlock[]

  res.json({
    lesson: {
      ...dbLessonToLesson(updatedLesson),
      contentBlocks: blockRows.map(dbBlockToBlock)
    }
  })
})

// DELETE /api/courses/:courseId/lessons/:lessonId - Delete lesson
router.delete('/:courseId/lessons/:lessonId', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId) as DbCourse | undefined

  if (!course || course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(req.params.lessonId, req.params.courseId)
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' })
    return
  }

  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.lessonId)

  // Reorder remaining lessons
  const remainingLessons = db.prepare('SELECT id FROM lessons WHERE course_id = ? ORDER BY "order"').all(req.params.courseId) as { id: string }[]
  remainingLessons.forEach((l, i) => {
    db.prepare('UPDATE lessons SET "order" = ? WHERE id = ?').run(i + 1, l.id)
  })

  db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.courseId)

  res.json({ success: true })
})

// POST /api/courses/:courseId/lessons/:lessonId/blocks - Add content block
router.post('/:courseId/lessons/:lessonId/blocks', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId) as DbCourse | undefined

  if (!course || course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(req.params.lessonId, req.params.courseId)
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' })
    return
  }

  const { type, order, ...data } = req.body

  if (!type) {
    res.status(400).json({ error: 'Block type is required' })
    return
  }

  // Get max order if not provided
  let blockOrder = order
  if (blockOrder === undefined) {
    const maxOrder = db.prepare('SELECT MAX("order") as max FROM content_blocks WHERE lesson_id = ?').get(req.params.lessonId) as { max: number | null }
    blockOrder = (maxOrder.max || 0) + 1
  }

  const id = generateId()
  db.prepare(`
    INSERT INTO content_blocks (id, lesson_id, type, "order", data)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.lessonId, type, blockOrder, JSON.stringify(data))

  db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.courseId)

  const block = db.prepare('SELECT * FROM content_blocks WHERE id = ?').get(id) as DbContentBlock
  res.status(201).json({ block: dbBlockToBlock(block) })
})

// PATCH /api/courses/:courseId/lessons/:lessonId/blocks/:blockId - Update content block
router.patch('/:courseId/lessons/:lessonId/blocks/:blockId', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId) as DbCourse | undefined

  if (!course || course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const block = db.prepare(`
    SELECT cb.* FROM content_blocks cb
    JOIN lessons l ON cb.lesson_id = l.id
    WHERE cb.id = ? AND l.id = ? AND l.course_id = ?
  `).get(req.params.blockId, req.params.lessonId, req.params.courseId) as DbContentBlock | undefined

  if (!block) {
    res.status(404).json({ error: 'Block not found' })
    return
  }

  const { type, order, ...data } = req.body

  // Merge existing data with new data
  const existingData = JSON.parse(block.data)
  const newData = { ...existingData, ...data }

  const updates: string[] = []
  const values: (string | number)[] = []

  if (type !== undefined) { updates.push('type = ?'); values.push(type) }
  if (order !== undefined) { updates.push('"order" = ?'); values.push(order) }
  updates.push('data = ?'); values.push(JSON.stringify(newData))
  values.push(req.params.blockId)

  db.prepare(`UPDATE content_blocks SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.courseId)

  const updatedBlock = db.prepare('SELECT * FROM content_blocks WHERE id = ?').get(req.params.blockId) as DbContentBlock
  res.json({ block: dbBlockToBlock(updatedBlock) })
})

// DELETE /api/courses/:courseId/lessons/:lessonId/blocks/:blockId - Delete content block
router.delete('/:courseId/lessons/:lessonId/blocks/:blockId', requireAuth, requireInstructor, (req, res) => {
  const user = getCurrentUser(req)!
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId) as DbCourse | undefined

  if (!course || course.instructor_id !== user.id && user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const block = db.prepare(`
    SELECT cb.* FROM content_blocks cb
    JOIN lessons l ON cb.lesson_id = l.id
    WHERE cb.id = ? AND l.id = ? AND l.course_id = ?
  `).get(req.params.blockId, req.params.lessonId, req.params.courseId)

  if (!block) {
    res.status(404).json({ error: 'Block not found' })
    return
  }

  db.prepare('DELETE FROM content_blocks WHERE id = ?').run(req.params.blockId)

  // Reorder remaining blocks
  const remainingBlocks = db.prepare('SELECT id FROM content_blocks WHERE lesson_id = ? ORDER BY "order"').all(req.params.lessonId) as { id: string }[]
  remainingBlocks.forEach((b, i) => {
    db.prepare('UPDATE content_blocks SET "order" = ? WHERE id = ?').run(i + 1, b.id)
  })

  db.prepare('UPDATE courses SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.courseId)

  res.json({ success: true })
})

export default router
