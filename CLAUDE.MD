# CodingClass - AI Context File

## What This Project Is
A Vue 3 coding education platform where users create courses with interactive JavaScript exercises, and students take them. Any user can enable instructor features to create courses. Think Codecademy-style but self-hosted.

## Tech Stack
- Vue 3 + TypeScript + Vite 7 (frontend)
- Express 5 + better-sqlite3 (backend)
- Tailwind CSS via @tailwindcss/vite plugin
- Vue Router 4 + Pinia
- bcrypt for password hashing
- pnpm as package manager

## Key Architecture Decisions

### Backend (Express + SQLite)
- Express server in `server/` folder
- SQLite database stored in `data/codingclass.db`
- Session-based auth with cookies (express-session)
- Passwords hashed with bcrypt (10 rounds)
- API routes under `/api/*`

### State Management
Using Vue composables (`useAuth`, `useCourses`) that fetch from the API. No localStorage for data - everything persists to SQLite.

### User Roles (hierarchical)
1. **owner** - First signup, cannot be demoted, can transfer ownership, full control
2. **admin** - Can manage users (except owner), full access
3. **student** - Can enroll and take courses

### Instructor Features (Self-Service)
- Any user can enable instructor features via Settings page checkbox ("Enable Instructor Features")
- `User.instructorEnabled` - user preference to show/hide instructor UI (dashboard, course creation)
- `User.instructorLocked` - admin-set lock preventing user from becoming instructor
- `isInstructor` computed = `instructorEnabled && !instructorLocked` (owner/admin bypass both)
- Admins can lock/unlock users from instructor access via Admin Panel
- When locked, user sees grayed out checkbox with message: "You cannot become an instructor right now."
- Role and instructor features are separate: a student with instructor features can create courses but can't access admin panel

### Content Blocks
Lessons contain ordered content blocks. Types:
- `markdown` / `text` - Rich text (custom parser, not a library)
- `code` - Static code display with copy button
- `interactive-code` - JS execution via `new Function()`, captures console.log
- `quiz` - Multiple choice with explanation
- `video` - YouTube detection + direct video
- `image` - With alt/caption

### Color System
Primary color is "water" (teal-ish green). Defined in style.css as CSS custom properties that Tailwind picks up. Use `water-600` for primary buttons, `water-500` for hover states, etc.

## File Locations

| What | Where |
|------|-------|
| Types/interfaces | `src/types/index.ts` |
| Auth logic (frontend) | `src/composables/useAuth.ts` |
| Course CRUD (frontend) | `src/composables/useCourses.ts` |
| Content renderers | `src/components/content/*.vue` |
| Page components | `src/views/*.vue` |
| Settings page | `src/views/SettingsPage.vue` |
| Admin panel | `src/views/AdminPage.vue` |
| Routes | `src/router/index.ts` |
| Tailwind setup | `src/style.css` |
| **Backend entry** | `server/index.ts` |
| **Database setup** | `server/db.ts` |
| **Auth API routes** | `server/routes/auth.ts` |
| **Users API routes** | `server/routes/users.ts` |
| **Courses API routes** | `server/routes/courses.ts` |
| **Enrollments API routes** | `server/routes/enrollments.ts` |

## Database Schema
- `users` - User accounts with hashed passwords
- `courses` - Course metadata
- `lessons` - Lessons belong to courses
- `content_blocks` - Content blocks belong to lessons (JSON data field for flexibility)
- `enrollments` - User enrollment in courses
- `lesson_progress` - Per-lesson progress tracking
- `completed_blocks` - Individual block completion tracking
- `sessions` - Express session storage

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account (first user becomes owner)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users (admin)
- `GET /api/users` - List all users
- `PATCH /api/users/:id/role` - Change user role
- `POST /api/users/:id/transfer-ownership` - Transfer owner role
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/me/instructor` - Toggle instructor features
- `PATCH /api/users/:id/instructor-lock` - Lock/unlock instructor access
- `PATCH /api/users/me/profile` - Update profile

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/my` - List instructor's courses
- `GET /api/courses/:id` - Get course with lessons
- `POST /api/courses` - Create course
- `PATCH /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/lessons` - Add lesson
- `PATCH /api/courses/:courseId/lessons/:lessonId` - Update lesson
- `DELETE /api/courses/:courseId/lessons/:lessonId` - Delete lesson
- `POST /api/courses/:courseId/lessons/:lessonId/blocks` - Add content block
- `PATCH /api/courses/:courseId/lessons/:lessonId/blocks/:blockId` - Update block
- `DELETE /api/courses/:courseId/lessons/:lessonId/blocks/:blockId` - Delete block

### Enrollments
- `GET /api/enrollments` - Get user's enrollments
- `GET /api/enrollments/:courseId` - Check enrollment status
- `POST /api/enrollments/:courseId` - Enroll in course
- `POST /api/enrollments/:courseId/progress` - Mark block completed
- `GET /api/enrollments/:courseId/completion` - Get completion percentage

## Gotchas / Things to Know
1. First user to sign up becomes owner automatically
2. Interactive code uses `new Function()` - runs in browser, no sandbox
3. Markdown parser is custom/basic - headers, bold, italic, code, lists only
4. Course editor auto-selects first lesson on load
5. Progress tracked per content block, lesson marked complete when all blocks done
6. `isInstructor` computed checks `instructorEnabled && !instructorLocked` (owner/admin bypass)
7. Click user avatar/name in navbar to go to Settings page
8. In dev mode, Vite proxies `/api/*` to Express on port 3000
9. Database file created automatically in `data/` folder

## Common Tasks

**Add new content block type:**
1. Add interface to `src/types/index.ts`
2. Add to `ContentBlockType` union
3. Create `src/components/content/[Name]Block.vue`
4. Add case in `ContentBlockRenderer.vue`
5. Add editor UI in `CourseEditorPage.vue` (both blockTypes array and form template)

**Add new user role:**
1. Update `User` interface in types
2. Update role checks in `useAuth.ts`
3. Update UI guards in components (v-if="isAdmin" etc)
4. Update `server/routes/users.ts` for backend checks

**Add new API endpoint:**
1. Add route in appropriate `server/routes/*.ts` file
2. Update composable in `src/composables/` to call the API

## Commands
```bash
pnpm dev          # Start both frontend (Vite) and backend (Express) dev servers
pnpm dev:client   # Start only Vite dev server
pnpm dev:server   # Start only Express dev server
pnpm build        # Production build (frontend only)
pnpm start        # Run production server (serves built frontend + API)
pnpm preview      # Preview production build
```
