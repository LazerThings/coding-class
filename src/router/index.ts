import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginPage.vue')
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('../views/CoursesPage.vue')
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/CourseDetailPage.vue')
    },
    {
      path: '/courses/:courseId/lessons/:lessonId',
      name: 'lesson',
      component: () => import('../views/LessonPage.vue')
    },
    {
      path: '/my-learning',
      name: 'my-learning',
      component: () => import('../views/MyLearningPage.vue')
    },
    {
      path: '/instructor',
      name: 'instructor',
      component: () => import('../views/InstructorDashboard.vue')
    },
    {
      path: '/instructor/courses/:id',
      name: 'course-editor',
      component: () => import('../views/CourseEditorPage.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminPage.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsPage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

export default router
