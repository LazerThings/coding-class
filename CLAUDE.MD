# CodingClass - AI Context File

## What This Project Is
A Vue 3 coding education platform where instructors create courses with interactive JavaScript exercises, and students take them. Think Codecademy-style but self-hosted.

## Tech Stack
- Vue 3 + TypeScript + Vite 7
- Tailwind CSS via @tailwindcss/vite plugin
- Vue Router 4 + Pinia
- pnpm as package manager

## Key Architecture Decisions

### State Management
Using Vue composables (`useAuth`, `useCourses`) with `ref()` at module level for singleton state. Data persists to localStorage. No backend - everything client-side.

### User Roles (hierarchical)
1. **owner** - First signup, cannot be demoted, can transfer ownership, full control
2. **admin** - Can manage users (except owner), full course access
3. **instructor** - Can create/edit own courses
4. **student** - Can enroll and take courses

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
| Auth logic | `src/composables/useAuth.ts` |
| Course CRUD + progress | `src/composables/useCourses.ts` |
| Content renderers | `src/components/content/*.vue` |
| Page components | `src/views/*.vue` |
| Routes | `src/router/index.ts` |
| Tailwind setup | `src/style.css` |

## localStorage Keys
- `users` - Array of all user accounts (passwords stored as-is, no hashing - it's client-side demo)
- `currentUser` - Logged in user object
- `courses` - All courses with nested lessons/blocks
- `enrollments` - Progress tracking per user

## Gotchas / Things to Know
1. First user to sign up becomes owner automatically
2. Interactive code uses `new Function()` - runs in browser, no sandbox
3. Markdown parser is custom/basic - headers, bold, italic, code, lists only
4. Course editor auto-selects first lesson on load
5. Progress tracked per content block, lesson marked complete when all blocks done

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

## Commands
```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm preview  # Preview prod build
```
