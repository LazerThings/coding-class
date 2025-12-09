import { ref, computed } from 'vue'
import type { Course, Lesson, ContentBlock, CourseProgress } from '../types'

const courses = ref<Course[]>([])
const enrollments = ref<Map<string, CourseProgress>>(new Map())

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

export function useCourses() {
  async function initCourses(): Promise<void> {
    try {
      const data = await apiRequest<{ courses: Course[] }>('/courses')
      courses.value = data.courses.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }))
    } catch {
      courses.value = []
    }

    // Load enrollments
    try {
      const data = await apiRequest<{ enrollments: Array<{ courseId: string; progress: CourseProgress }> }>('/enrollments')
      enrollments.value = new Map()
      for (const e of data.enrollments) {
        enrollments.value.set(e.courseId, e.progress)
      }
    } catch {
      enrollments.value = new Map()
    }
  }

  const publishedCourses = computed(() => courses.value.filter(c => c.isPublished))

  function getCourseById(id: string): Course | undefined {
    return courses.value.find(c => c.id === id)
  }

  function getCoursesByInstructor(instructorId: string): Course[] {
    return courses.value.filter(c => c.instructorId === instructorId)
  }

  async function createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>): Promise<Course> {
    const data = await apiRequest<{ course: Course }>('/courses', {
      method: 'POST',
      body: JSON.stringify(course)
    })

    const newCourse = {
      ...data.course,
      createdAt: new Date(data.course.createdAt),
      updatedAt: new Date(data.course.updatedAt)
    }
    courses.value.push(newCourse)
    return newCourse
  }

  async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    try {
      const data = await apiRequest<{ course: Course }>(`/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })

      const updatedCourse = {
        ...data.course,
        createdAt: new Date(data.course.createdAt),
        updatedAt: new Date(data.course.updatedAt)
      }

      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = updatedCourse
      }
      return updatedCourse
    } catch {
      return undefined
    }
  }

  async function deleteCourse(id: string): Promise<boolean> {
    try {
      await apiRequest(`/courses/${id}`, { method: 'DELETE' })
      courses.value = courses.value.filter(c => c.id !== id)
      return true
    } catch {
      return false
    }
  }

  // Lesson management
  async function addLesson(courseId: string, lesson: Omit<Lesson, 'id' | 'contentBlocks'>): Promise<Lesson | undefined> {
    try {
      const data = await apiRequest<{ lesson: Lesson }>(`/courses/${courseId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(lesson)
      })

      const course = getCourseById(courseId)
      if (course) {
        course.lessons.push(data.lesson)
      }
      return data.lesson
    } catch {
      return undefined
    }
  }

  async function updateLesson(courseId: string, lessonId: string, updates: Partial<Lesson>): Promise<Lesson | undefined> {
    try {
      const data = await apiRequest<{ lesson: Lesson }>(`/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })

      const course = getCourseById(courseId)
      if (course) {
        const lessonIndex = course.lessons.findIndex(l => l.id === lessonId)
        if (lessonIndex !== -1) {
          course.lessons[lessonIndex] = data.lesson
        }
      }
      return data.lesson
    } catch {
      return undefined
    }
  }

  async function deleteLesson(courseId: string, lessonId: string): Promise<boolean> {
    try {
      await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' })

      const course = getCourseById(courseId)
      if (course) {
        course.lessons = course.lessons.filter(l => l.id !== lessonId)
        // Reorder remaining lessons
        course.lessons.forEach((l, i) => {
          l.order = i + 1
        })
      }
      return true
    } catch {
      return false
    }
  }

  // Content block management
  async function addContentBlock(courseId: string, lessonId: string, block: Omit<ContentBlock, 'id'>): Promise<ContentBlock | undefined> {
    try {
      const data = await apiRequest<{ block: ContentBlock }>(`/courses/${courseId}/lessons/${lessonId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(block)
      })

      const course = getCourseById(courseId)
      if (course) {
        const lesson = course.lessons.find(l => l.id === lessonId)
        if (lesson) {
          lesson.contentBlocks.push(data.block)
        }
      }
      return data.block
    } catch {
      return undefined
    }
  }

  async function updateContentBlock(
    courseId: string,
    lessonId: string,
    blockId: string,
    updates: Partial<ContentBlock>
  ): Promise<ContentBlock | undefined> {
    try {
      const data = await apiRequest<{ block: ContentBlock }>(`/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })

      const course = getCourseById(courseId)
      if (course) {
        const lesson = course.lessons.find(l => l.id === lessonId)
        if (lesson) {
          const blockIndex = lesson.contentBlocks.findIndex(b => b.id === blockId)
          if (blockIndex !== -1) {
            lesson.contentBlocks[blockIndex] = data.block
          }
        }
      }
      return data.block
    } catch {
      return undefined
    }
  }

  async function deleteContentBlock(courseId: string, lessonId: string, blockId: string): Promise<boolean> {
    try {
      await apiRequest(`/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}`, { method: 'DELETE' })

      const course = getCourseById(courseId)
      if (course) {
        const lesson = course.lessons.find(l => l.id === lessonId)
        if (lesson) {
          lesson.contentBlocks = lesson.contentBlocks.filter(b => b.id !== blockId)
          // Reorder remaining blocks
          lesson.contentBlocks.forEach((b, i) => {
            b.order = i + 1
          })
        }
      }
      return true
    } catch {
      return false
    }
  }

  // Enrollment and progress
  async function enrollInCourse(courseId: string): Promise<CourseProgress> {
    const data = await apiRequest<{ enrollment: { progress: CourseProgress } }>(`/enrollments/${courseId}`, {
      method: 'POST'
    })

    enrollments.value.set(courseId, data.enrollment.progress)
    return data.enrollment.progress
  }

  function isEnrolled(courseId: string): boolean {
    return enrollments.value.has(courseId)
  }

  function getProgress(courseId: string): CourseProgress | undefined {
    return enrollments.value.get(courseId)
  }

  async function markBlockCompleted(courseId: string, lessonId: string, blockId: string): Promise<void> {
    const data = await apiRequest<{ enrollment: { progress: CourseProgress } }>(`/enrollments/${courseId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ lessonId, blockId })
    })

    enrollments.value.set(courseId, data.enrollment.progress)
  }

  async function getCourseCompletionPercent(courseId: string): Promise<number> {
    try {
      const data = await apiRequest<{ percent: number }>(`/enrollments/${courseId}/completion`)
      return data.percent
    } catch {
      return 0
    }
  }

  // Sync version for computed properties (uses cached data)
  function getCourseCompletionPercentSync(courseId: string): number {
    const progress = enrollments.value.get(courseId)
    const course = getCourseById(courseId)

    if (!progress || !course || course.lessons.length === 0) return 0

    const totalBlocks = course.lessons.reduce((sum, l) => sum + l.contentBlocks.length, 0)
    if (totalBlocks === 0) return 0

    const completedBlocks = Object.values(progress.lessonProgress).reduce(
      (sum, lp) => sum + lp.completedBlocks.length,
      0
    )

    return Math.round((completedBlocks / totalBlocks) * 100)
  }

  return {
    courses,
    publishedCourses,
    enrollments,
    initCourses,
    getCourseById,
    getCoursesByInstructor,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson,
    addContentBlock,
    updateContentBlock,
    deleteContentBlock,
    enrollInCourse,
    isEnrolled,
    getProgress,
    markBlockCompleted,
    getCourseCompletionPercent,
    getCourseCompletionPercentSync
  }
}
