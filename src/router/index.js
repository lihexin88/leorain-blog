import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../views/Main.vue'

const routes = [
  {
    path: '/',
    component: MainPage,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/home/HomePage.vue')
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('../views/articles/ArticleList.vue'),
        children: [
          {
            path: 'articles/{slug}',
            name: 'ArticleDetail',
            component: () => import('../views/home/ArticleDetail.vue')
          }
        ]
      },
      {
        path: 'tags',
        name: 'TagList',
        component: () => import('../views/tags/TagList.vue')
      },
      {
        path: 'article/:slug',
        name: 'ArticleDetail',
        component: () => import('../views/home/ArticleDetail.vue')
      },
      {
        path: 'tag/:tag',
        name: 'TagDetail',
        component: () => import('../views/tags/TagDetail.vue')
      },
      {
        path: 'user/profile',
        name: 'UserProfile',
        component: () => import('../views/user/UserProfile.vue')
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/user/UserLogin.vue')
      },
      {
        path: 'tools',
        name: 'Tools',
        redirect: 'tools/timestamp',
        component: () => import('../views/tools/ToolsBox.vue'),
        children: [
          {
            path: 'timestamp',
            name: 'Timestamp',
            component: () => import('../views/tools/Timestamp.vue')
          },
          {
            path: 'radix',
            name: 'Radix',
            component: () => import('../views/tools/Radix.vue')
          },
          {
            path: 'json',
            name: 'Json',
            component: () => import('../views/tools/JSONExecutor.vue')
          },
          {
            path: 'php',
            name: 'Php',
            component: () => import('../views/tools/PHPExecutor.vue')
          },
          {
            path: 'java',
            name: 'Java',
            component: () => import('../views/tools/JAVAExecutor.vue')
          },
          {
            path: 'python',
            name: 'Python',
            component: () => import('../views/tools/PYTHONExecutor.vue')
          },
          {
            path: 'golang',
            name: 'Golang',
            component: () => import('../views/tools/GOLANGExecutor.vue')
          },
          {
            path: 'clang',
            name: 'Clang',
            component: () => import('../views/tools/CLANGExecutor.vue')
          },
          {
            path: 'cpp',
            name: 'Cpp',
            component: () => import('../views/tools/CPPExecutor.vue')
          },
          {
            path: 'draw',
            name: 'Draw',
            component: () => import('../views/tools/Draw.vue')
          },
          {
            path: 'clipboard',
            name: 'Clipboard',
            component: () => import('../views/tools/Clipboard.vue')
          },
          {
            path: 'schulte',
            name: 'Schulte',
            component: () => import('../views/tools/ToolSchulte.vue')
          },
          {
            path: 'cpu',
            name: 'Cpu',
            component: () => import('../views/tools/ToolCpu.vue')
          },
          {
            path: 'lottery',
            name: 'Lottery',
            component: () => import('../views/tools/ToolLottery.vue')
          },
          {
            path: 'fish',
            name: 'Fish',
            component: () => import('../views/tools/ToolFish.vue')
          },
          {
            path: 'media',
            name: 'ToolMedia',
            component: () => import('../views/tools/ToolMedia.vue')
          }
        ]
      },
      {
        path: 'guestbook',
        name: 'Guestbook',
        component: () => import('../views/guestbook/Guestbooks.vue')
      },
      {
        path: 'links',
        name: 'Links',
        component: () => import('../views/links/LinksPage.vue')
      },
      {
        path: 'assets',
        name: 'AssetList',
        component: () => import('../views/assets/AssetList.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
