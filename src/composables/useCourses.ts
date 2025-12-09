import { ref, computed } from 'vue'
import type { Course, Lesson, ContentBlock, CourseProgress } from '../types'

const courses = ref<Course[]>([])
const enrollments = ref<Map<string, CourseProgress>>(new Map())

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Sample course data
function createSampleCourses(): Course[] {
  return [
    {
      id: '1',
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming, from variables to functions.',
      instructorId: '2',
      instructorName: 'Jane Instructor',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400',
      difficulty: 'beginner',
      tags: ['javascript', 'programming', 'web'],
      isPublished: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to JavaScript',
          description: 'Get started with JavaScript and understand its role in web development.',
          order: 1,
          isPublished: true,
          duration: 15,
          contentBlocks: [
            {
              id: 'b1',
              type: 'markdown',
              order: 1,
              content: `# Welcome to JavaScript!

JavaScript is one of the most popular programming languages in the world. It powers the interactive elements of websites and can run both in browsers and on servers.

## What you'll learn

- Variables and data types
- Functions and scope
- Control flow
- Working with arrays and objects`
            },
            {
              id: 'b2',
              type: 'code',
              order: 2,
              language: 'javascript',
              filename: 'hello.js',
              code: `// Your first JavaScript code
console.log("Hello, World!");

// Variables
let name = "Student";
console.log("Welcome, " + name + "!");`
            },
            {
              id: 'b3',
              type: 'interactive-code',
              order: 3,
              language: 'javascript',
              instructions: 'Create a variable called `greeting` and assign it the value "Hello, JavaScript!". Then log it to the console.',
              starterCode: `// Create your variable here\n\n// Log it to the console\n`,
              solution: `const greeting = "Hello, JavaScript!";\nconsole.log(greeting);`,
              testCases: [
                {
                  id: 't1',
                  description: 'Should output "Hello, JavaScript!"',
                  input: '',
                  expectedOutput: 'Hello, JavaScript!'
                }
              ]
            }
          ]
        },
        {
          id: 'l2',
          title: 'Variables and Data Types',
          description: 'Understanding how to store and work with different types of data.',
          order: 2,
          isPublished: true,
          duration: 20,
          contentBlocks: [
            {
              id: 'b4',
              type: 'markdown',
              order: 1,
              content: `# Variables and Data Types

In JavaScript, we use variables to store data. There are three ways to declare variables:

- \`let\` - for variables that can change
- \`const\` - for variables that shouldn't change
- \`var\` - the old way (avoid using)

## Data Types

JavaScript has several primitive data types:

1. **String** - text data: \`"Hello"\`
2. **Number** - numeric data: \`42\`, \`3.14\`
3. **Boolean** - true/false: \`true\`, \`false\`
4. **Undefined** - no value assigned
5. **Null** - intentionally empty`
            },
            {
              id: 'b5',
              type: 'code',
              order: 2,
              language: 'javascript',
              code: `// Strings
let firstName = "John";
let lastName = 'Doe';

// Numbers
let age = 25;
let price = 19.99;

// Booleans
let isStudent = true;
let hasGraduated = false;

// Checking types
console.log(typeof firstName); // "string"
console.log(typeof age);       // "number"
console.log(typeof isStudent); // "boolean"`
            },
            {
              id: 'b6',
              type: 'quiz',
              order: 3,
              question: 'Which keyword should you use to declare a variable that will never be reassigned?',
              options: [
                { id: 'o1', text: 'let', isCorrect: false },
                { id: 'o2', text: 'const', isCorrect: true },
                { id: 'o3', text: 'var', isCorrect: false },
                { id: 'o4', text: 'static', isCorrect: false }
              ],
              explanation: 'Use `const` when you want to declare a variable that should not be reassigned. This helps prevent bugs and makes your code more readable.'
            },
            {
              id: 'b7',
              type: 'interactive-code',
              order: 4,
              language: 'javascript',
              instructions: 'Create variables for a person: `name` (string), `age` (number), and `isEmployed` (boolean). Then log each variable.',
              starterCode: `// Create your variables here\n\n// Log them to the console\n`,
              solution: `const name = "Alice";\nconst age = 30;\nconst isEmployed = true;\n\nconsole.log(name);\nconsole.log(age);\nconsole.log(isEmployed);`
            }
          ]
        },
        {
          id: 'l3',
          title: 'Functions',
          description: 'Learn how to create reusable blocks of code with functions.',
          order: 3,
          isPublished: true,
          duration: 25,
          contentBlocks: [
            {
              id: 'b8',
              type: 'markdown',
              order: 1,
              content: `# Functions

Functions are reusable blocks of code that perform a specific task. They help you organize your code and avoid repetition.

## Function Declaration

\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}
\`\`\`

## Arrow Functions

\`\`\`javascript
const greet = (name) => "Hello, " + name + "!";
\`\`\``
            },
            {
              id: 'b9',
              type: 'interactive-code',
              order: 2,
              language: 'javascript',
              instructions: 'Create a function called `add` that takes two numbers and returns their sum. Then call it with 5 and 3, and log the result.',
              starterCode: `// Create your function here\n\n// Call it and log the result\n`,
              solution: `function add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(5, 3));`,
              testCases: [
                {
                  id: 't2',
                  description: 'Should output 8',
                  input: '',
                  expectedOutput: '8'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Advanced JavaScript Patterns',
      description: 'Master advanced JavaScript concepts including closures, promises, and design patterns.',
      instructorId: '2',
      instructorName: 'Jane Instructor',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
      difficulty: 'advanced',
      tags: ['javascript', 'advanced', 'patterns'],
      isPublished: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15'),
      lessons: [
        {
          id: 'l4',
          title: 'Closures',
          description: 'Understanding closures and their practical applications.',
          order: 1,
          isPublished: true,
          duration: 30,
          contentBlocks: [
            {
              id: 'b10',
              type: 'markdown',
              order: 1,
              content: `# Closures

A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned.

## Why Closures Matter

- Data privacy
- Function factories
- Maintaining state`
            },
            {
              id: 'b11',
              type: 'code',
              order: 2,
              language: 'javascript',
              code: `function createCounter() {
  let count = 0;

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount());  // 2`
            }
          ]
        }
      ]
    }
  ]
}

export function useCourses() {
  // Initialize with sample data if empty
  function initCourses() {
    const stored = localStorage.getItem('courses')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        courses.value = parsed.map((c: Course) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      } catch {
        courses.value = createSampleCourses()
        saveCourses()
      }
    } else {
      courses.value = createSampleCourses()
      saveCourses()
    }

    // Load enrollments
    const storedEnrollments = localStorage.getItem('enrollments')
    if (storedEnrollments) {
      try {
        const parsed = JSON.parse(storedEnrollments)
        enrollments.value = new Map(Object.entries(parsed))
      } catch {
        enrollments.value = new Map()
      }
    }
  }

  function saveCourses() {
    localStorage.setItem('courses', JSON.stringify(courses.value))
  }

  function saveEnrollments() {
    localStorage.setItem('enrollments', JSON.stringify(Object.fromEntries(enrollments.value)))
  }

  const publishedCourses = computed(() => courses.value.filter(c => c.isPublished))

  function getCourseById(id: string): Course | undefined {
    return courses.value.find(c => c.id === id)
  }

  function getCoursesByInstructor(instructorId: string): Course[] {
    return courses.value.filter(c => c.instructorId === instructorId)
  }

  function createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
    const newCourse: Course = {
      ...course,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    courses.value.push(newCourse)
    saveCourses()
    return newCourse
  }

  function updateCourse(id: string, updates: Partial<Course>): Course | undefined {
    const index = courses.value.findIndex(c => c.id === id)
    if (index !== -1) {
      courses.value[index] = {
        ...courses.value[index],
        ...updates,
        updatedAt: new Date()
      }
      saveCourses()
      return courses.value[index]
    }
    return undefined
  }

  function deleteCourse(id: string): boolean {
    const index = courses.value.findIndex(c => c.id === id)
    if (index !== -1) {
      courses.value.splice(index, 1)
      saveCourses()
      return true
    }
    return false
  }

  // Lesson management
  function addLesson(courseId: string, lesson: Omit<Lesson, 'id'>): Lesson | undefined {
    const course = getCourseById(courseId)
    if (course) {
      const newLesson: Lesson = {
        ...lesson,
        id: generateId()
      }
      course.lessons.push(newLesson)
      updateCourse(courseId, { lessons: course.lessons })
      return newLesson
    }
    return undefined
  }

  function updateLesson(courseId: string, lessonId: string, updates: Partial<Lesson>): Lesson | undefined {
    const course = getCourseById(courseId)
    if (course) {
      const lessonIndex = course.lessons.findIndex(l => l.id === lessonId)
      if (lessonIndex !== -1) {
        course.lessons[lessonIndex] = {
          ...course.lessons[lessonIndex],
          ...updates
        }
        updateCourse(courseId, { lessons: course.lessons })
        return course.lessons[lessonIndex]
      }
    }
    return undefined
  }

  function deleteLesson(courseId: string, lessonId: string): boolean {
    const course = getCourseById(courseId)
    if (course) {
      const lessonIndex = course.lessons.findIndex(l => l.id === lessonId)
      if (lessonIndex !== -1) {
        course.lessons.splice(lessonIndex, 1)
        // Reorder remaining lessons
        course.lessons.forEach((l, i) => {
          l.order = i + 1
        })
        updateCourse(courseId, { lessons: course.lessons })
        return true
      }
    }
    return false
  }

  // Content block management
  function addContentBlock(courseId: string, lessonId: string, block: Omit<ContentBlock, 'id'>): ContentBlock | undefined {
    const course = getCourseById(courseId)
    if (course) {
      const lesson = course.lessons.find(l => l.id === lessonId)
      if (lesson) {
        const newBlock = {
          ...block,
          id: generateId()
        } as ContentBlock
        lesson.contentBlocks.push(newBlock)
        updateCourse(courseId, { lessons: course.lessons })
        return newBlock
      }
    }
    return undefined
  }

  function updateContentBlock(
    courseId: string,
    lessonId: string,
    blockId: string,
    updates: Partial<ContentBlock>
  ): ContentBlock | undefined {
    const course = getCourseById(courseId)
    if (course) {
      const lesson = course.lessons.find(l => l.id === lessonId)
      if (lesson) {
        const blockIndex = lesson.contentBlocks.findIndex(b => b.id === blockId)
        if (blockIndex !== -1) {
          lesson.contentBlocks[blockIndex] = {
            ...lesson.contentBlocks[blockIndex],
            ...updates
          } as ContentBlock
          updateCourse(courseId, { lessons: course.lessons })
          return lesson.contentBlocks[blockIndex]
        }
      }
    }
    return undefined
  }

  function deleteContentBlock(courseId: string, lessonId: string, blockId: string): boolean {
    const course = getCourseById(courseId)
    if (course) {
      const lesson = course.lessons.find(l => l.id === lessonId)
      if (lesson) {
        const blockIndex = lesson.contentBlocks.findIndex(b => b.id === blockId)
        if (blockIndex !== -1) {
          lesson.contentBlocks.splice(blockIndex, 1)
          // Reorder remaining blocks
          lesson.contentBlocks.forEach((b, i) => {
            b.order = i + 1
          })
          updateCourse(courseId, { lessons: course.lessons })
          return true
        }
      }
    }
    return false
  }

  // Enrollment and progress
  function enrollInCourse(courseId: string): CourseProgress {
    const progress: CourseProgress = {
      courseId,
      lessonProgress: {},
      startedAt: new Date()
    }
    enrollments.value.set(courseId, progress)
    saveEnrollments()
    return progress
  }

  function isEnrolled(courseId: string): boolean {
    return enrollments.value.has(courseId)
  }

  function getProgress(courseId: string): CourseProgress | undefined {
    return enrollments.value.get(courseId)
  }

  function markBlockCompleted(courseId: string, lessonId: string, blockId: string) {
    let progress = enrollments.value.get(courseId)
    if (!progress) {
      progress = enrollInCourse(courseId)
    }

    if (!progress.lessonProgress[lessonId]) {
      progress.lessonProgress[lessonId] = {
        lessonId,
        completed: false,
        completedBlocks: [],
        startedAt: new Date()
      }
    }

    if (!progress.lessonProgress[lessonId].completedBlocks.includes(blockId)) {
      progress.lessonProgress[lessonId].completedBlocks.push(blockId)
    }

    // Check if lesson is completed
    const course = getCourseById(courseId)
    if (course) {
      const lesson = course.lessons.find(l => l.id === lessonId)
      if (lesson) {
        const allBlocksCompleted = lesson.contentBlocks.every(b =>
          progress!.lessonProgress[lessonId].completedBlocks.includes(b.id)
        )
        if (allBlocksCompleted) {
          progress.lessonProgress[lessonId].completed = true
          progress.lessonProgress[lessonId].completedAt = new Date()
        }
      }
    }

    enrollments.value.set(courseId, progress)
    saveEnrollments()
  }

  function getCourseCompletionPercent(courseId: string): number {
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
    getCourseCompletionPercent
  }
}
