// User types
export type UserRole = 'owner' | 'admin' | 'student'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  avatar?: string
  instructorEnabled: boolean // User preference to enable instructor features
  instructorLocked: boolean // Admin lock preventing user from becoming instructor
  createdAt: Date
}

// Content block types
export type ContentBlockType =
  | 'text'
  | 'code'
  | 'interactive-code'
  | 'video'
  | 'image'
  | 'quiz'
  | 'markdown'

export interface BaseContentBlock {
  id: string
  type: ContentBlockType
  order: number
}

export interface TextBlock extends BaseContentBlock {
  type: 'text'
  content: string
}

export interface MarkdownBlock extends BaseContentBlock {
  type: 'markdown'
  content: string
}

export interface CodeBlock extends BaseContentBlock {
  type: 'code'
  language: string
  code: string
  filename?: string
}

export interface InteractiveCodeBlock extends BaseContentBlock {
  type: 'interactive-code'
  language: 'javascript' | 'typescript'
  starterCode: string
  solution?: string
  testCases?: TestCase[]
  instructions: string
}

export interface TestCase {
  id: string
  description: string
  input: string
  expectedOutput: string
}

export interface VideoBlock extends BaseContentBlock {
  type: 'video'
  url: string
  title?: string
}

export interface ImageBlock extends BaseContentBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
}

export interface QuizBlock extends BaseContentBlock {
  type: 'quiz'
  question: string
  options: QuizOption[]
  explanation?: string
}

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export type ContentBlock =
  | TextBlock
  | MarkdownBlock
  | CodeBlock
  | InteractiveCodeBlock
  | VideoBlock
  | ImageBlock
  | QuizBlock

// Lesson types
export interface Lesson {
  id: string
  title: string
  description: string
  order: number
  contentBlocks: ContentBlock[]
  duration?: number // in minutes
  isPublished: boolean
}

// Course types
export interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructorId: string
  instructorName: string
  lessons: Lesson[]
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

// Progress tracking
export interface LessonProgress {
  lessonId: string
  completed: boolean
  completedBlocks: string[]
  startedAt?: Date
  completedAt?: Date
}

export interface CourseProgress {
  courseId: string
  lessonProgress: Record<string, LessonProgress>
  startedAt: Date
  completedAt?: Date
}

// Enrollment
export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: CourseProgress
  enrolledAt: Date
}
