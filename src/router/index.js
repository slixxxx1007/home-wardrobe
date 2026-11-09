import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'wardrobe',
    component: () => import('@/pages/wardrobe-page.vue')
  },
  {
    path: '/cloth/:id',
    name: 'cloth-detail',
    component: () => import('@/pages/cloth-detail-page.vue')
  },
  {
    path: '/category',
    name: 'category',
    component: () => import('@/pages/category-page.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
