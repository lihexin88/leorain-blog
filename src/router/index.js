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
        path: 'register',
        name: 'Register',
        component: () => import('../views/user/UserRegister.vue')
      },
      {
        path: 'login',
        name: 'Login',
        redirect: '/'
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
            component: () => import('../views/tools/ToolTimestamp.vue')
          },
          {
            path: 'code',
            name: 'CodeExecutor',
            component: () => import('../views/tools/UniversalExecutor.vue')
          },
          {
            path: 'radix',
            name: 'Radix',
            component: () => import('../views/tools/ToolRadix.vue')
          },
          {
            path: 'json',
            name: 'Json',
            component: () => import('../views/tools/JSONExecutor.vue')
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
        path: 'games',
        name: 'GameList',
        component: () => import('../views/games/GameList.vue')
      },
      {
        path: 'game/:slug',
        name: 'GamePlay',
        component: () => import('../views/games/GamePlay.vue')
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
      },
      // Topic routes
      {
        path: 'topics',
        name: 'TopicList',
        component: () => import('../views/topic/TopicList.vue')
      },
      {
        path: 'topic/:slug',
        name: 'TopicDetail',
        component: () => import('../views/topic/Topic.vue')
      },
      // 错误页面路由
      {
        path: '404',
        name: 'NotFound',
        component: () => import('../views/errors/NotFound.vue')
      },
      {
        path: '500',
        name: 'ServerError',
        component: () => import('../views/errors/ServerError.vue')
      },
      {
        path: '403',
        name: 'Forbidden',
        component: () => import('../views/errors/Forbidden.vue')
      },
      // 捕获所有未匹配的路由
      {
        path: '/:pathMatch(.*)*',
        redirect: '/404'
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
