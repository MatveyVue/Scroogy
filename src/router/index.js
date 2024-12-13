import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/leader',
      name: 'leader',
      component: () => import('../views/LeaderView.vue'),
    },
    {
      path: '/task',
      name: 'task',
      component: () => import('../views/TaskView.vue'),
    },
  ],
})

export default router
