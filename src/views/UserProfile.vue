<template>
  <div class="user-profile">
    <el-card class="profile-card" v-if="user">
      <div class="profile-header">
        <div class="avatar">
          <img :src="user.avatar || 'https://images.leorain.cn/logo.png'" :alt="user.name">
        </div>
        <div class="user-info">
          <h1 class="user-name">{{ user.name }}</h1>
          <p class="user-bio">{{ user.bio || '这个人很懒，什么都没有留下...' }}</p>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ stats.articles }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.comments }}</span>
              <span class="stat-label">评论</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.views }}</span>
              <span class="stat-label">浏览</span>
            </div>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="文章" name="articles">
          <div class="article-list">
            <el-card v-for="(article, index) in articles"
              class="article-item"
              :key="index"
            >
              <div class="article-item-content">
                <a v-if="article.page_image" class="article-media-link" @click="openArticle(article.slug)">
                  <img v-if="mediaType(article.page_image) === 'image'"
                    class="article-media"
                    :alt="article.slug"
                    :src="article.is_zoom ? article.page_image+'?x-oss-process=style/page-image' : article.page_image">
                  <video v-else-if="mediaType(article.page_image) === 'video'"
                    class="article-media"
                    muted
                    :src="article.page_image"></video>
                </a>
                <a v-else class="article-media-link" @click="openArticle(article.slug)">
                  <img class="article-media"
                    :alt="article.slug"
                    src="https://images.leorain.cn/icons/assets/pure_article.png">
                </a>

                <div class="article-body">
                  <h6 class="article-title">
                    <a @click="openArticle(article.slug)" :title="article.title">
                      {{ article.title }}
                    </a>
                  </h6>

                  <div class="article-description" @click="openArticle(article.slug)">
                    <span>{{ article.meta_description ?? article.subtitle }}</span>
                  </div>

                  <div class="article-extra">
                    <div class="article-tags">
                      <el-tag v-for="(tag, index) in article.tags"
                        class="article-tag"
                        :key="index"
                        @click="openTag(tag.tag)"
                        :title="tag.tag"
                        type="info">
                        {{ tag.tag }}
                      </el-tag>
                    </div>

                    <div class="article-meta">
                      <span class="meta-item" :title="moment(article.published_at).format('Y-M-D H:m:s')">
                        <i class="fas fa-clock"></i> {{ getFriendlyDate(article.published_at) }}
                      </span>
                      <span class="meta-item">
                        <i class="fas fa-eye"></i> {{ article.view_count }}
                      </span>
                      <span class="meta-item">
                        <i class="fas fa-comments"></i> {{ article.comments_count }}
                      </span>
                      <a class="meta-item more-link" @click="openArticle(article.slug)">
                        More <i class="fas fa-chevron-right"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="pagination-container">
            <el-pagination
              :page-size.sync="per_page"
              :page-sizes="[22, 40, 50]"
              :current-page.sync="page"
              @current-change="loadArticles"
              background
              :small="smallWindowSize"
              :layout="layout"
              :total="total"
            ></el-pagination>
          </div>
        </el-tab-pane>

        <el-tab-pane label="评论" name="comments">
          <div class="comment-list">
            <el-card v-for="(comment, index) in comments"
              class="comment-item"
              :key="index"
            >
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-article">评论于:
                    <a @click="openArticle(comment.article.slug)">{{ comment.article.title }}</a>
                  </span>
                  <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                </div>
                <div class="comment-body" v-html="comment.content"></div>
              </div>
            </el-card>
          </div>

          <div class="pagination-container">
            <el-pagination
              :page-size.sync="per_page"
              :page-sizes="[22, 40, 50]"
              :current-page.sync="commentPage"
              @current-change="loadComments"
              background
              :small="smallWindowSize"
              :layout="layout"
              :total="commentTotal"
            ></el-pagination>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="profile-footer">
        <el-button @click="goBack" type="primary" plain>返回</el-button>
      </div>
    </el-card>

    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { getFriendlyDate, mediaType, paginateLayouts, sync_url_paginate } from '../utils/helpers'
import moment from 'moment'

const route = useRoute()
const router = useRouter()

const username = ref(route.params.username)
const user = ref(null)
const activeTab = ref('articles')

const articles = ref([])
const total = ref(0)
const page = ref(1)
const per_page = ref(22)
const smallWindowSize = ref(false)
const layout = ref('prev, pager, next')

const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)

const stats = ref({
  articles: 0,
  comments: 0,
  views: 0
})

const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const loadUser = () => {
  // 模拟获取用户信息，实际项目中应该调用API
  user.value = {
    name: username.value,
    avatar: 'https://images.leorain.cn/logo.png',
    bio: '这个人很懒，什么都没有留下...'
  }

  // 模拟获取用户统计信息
  stats.value = {
    articles: 128,
    comments: 256,
    views: 1024
  }
}

const loadArticles = () => {
  api.getArticles({
    user: username.value,
    page: page.value,
    per_page: per_page.value
  }).then(response => {
    articles.value = response.data
    total.value = response.total

    window.scrollTo({ top: 0 })

    sync_url_paginate(page.value, per_page.value)
  }).catch(() => {
    // 如果API不支持按用户筛选，使用空数组
    articles.value = []
    total.value = 0
  })
}

const loadComments = () => {
  // 模拟获取评论数据，实际项目中应该调用API
  comments.value = [
    {
      id: 1,
      content: '这是一条评论内容',
      created_at: '2023-01-01T12:00:00Z',
      article: {
        slug: 'test-article',
        title: '测试文章'
      }
    }
  ]
  commentTotal.value = 1
}

const openArticle = (slug) => {
  router.push(`/article/${slug}`)
}

const openTag = (tag) => {
  router.push(`/tag/${tag}`)
}

const goBack = () => {
  router.go(-1)
}

watch(() => route.params.username, (newUsername) => {
  username.value = newUsername
  page.value = 1
  commentPage.value = 1
  loadUser()
  loadArticles()
  loadComments()
})

watch(() => per_page.value, () => {
  if (activeTab.value === 'articles') {
    loadArticles()
  } else {
    loadComments()
  }
})

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const pageParam = parseInt(params.get('page'))

  if (pageParam) {
    page.value = pageParam
  }

  const paginateLayouts = paginateLayouts()
  smallWindowSize.value = paginateLayouts.smallWindowSize
  layout.value = paginateLayouts.layout

  loadUser()
  loadArticles()
  loadComments()
})
</script>

