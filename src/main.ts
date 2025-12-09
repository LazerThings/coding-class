import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuth } from './composables/useAuth'
import { useCourses } from './composables/useCourses'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth and courses
const { initAuth } = useAuth()
const { initCourses } = useCourses()

initAuth()
initCourses()

app.mount('#app')
