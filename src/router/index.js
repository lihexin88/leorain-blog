import { createRouter, createWebHistory } from 'vue-router'
import Main from '../views/Main.vue'

const routes = [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/home/Home.vue')
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('../views/articles/ArticleList.vue')
      },
      {
        path: 'tags',
        name: 'TagList',
        component: () => import('../views/tags/TagList.vue')
      },
      {
        path: 'article/:slug',
        name: 'ArticleDetail',
        component: () => import('../views/articles/ArticleDetail.vue')
      },
      {
        path: 'tag/:tag',
        name: 'TagDetail',
        component: () => import('../views/tags/TagDetail.vue')
      },
      {
        path: 'user/:username',
        name: 'UserProfile',
        component: () => import('../views/profile/UserProfile.vue')
      },
      {
        path: 'toolbox',
        name: 'Toolbox',
        component: () => import('../views/tools/Tools.vue')
      },
      {
        path: 'guestbook',
        name: 'Guestbook',
        component: () => import('../views/guestbook/Guestbooks.vue')
      },
      {
        path: 'links',
        name: 'Links',
        component: () => import('../views/links/Links.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
