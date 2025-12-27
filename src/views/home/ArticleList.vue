<template>
  <div class="article-list-container">
    <div class="article-list">
      <el-card v-for="(article, index) in articleStore.articles"
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
                <span class="meta-item" @click="openUser(article.user.name)">
                  <i class="fas fa-user"></i> {{ article.user.name ?? 'null' }}
                </span>
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
        :page-size.sync="articleStore.per_page"
        :page-sizes="[22, 40, 50]"
        :current-page.sync="articleStore.page"
        @current-change="loadArticles"
        background
        :small="smallWindowSize"
        :layout="layout"
        :total="articleStore.total"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/store'
import api from '../../services/api'
import { getFriendlyDate, mediaType, paginateLayouts, sync_url_paginate, sync_url_params } from '@/utils/helpers'
import moment from 'moment'

const router = useRouter()
const articleStore = useArticleStore()

const smallWindowSize = ref(false)
const layout = ref('prev, pager, next')

const loadArticles = () => {
  api.getArticles({
    page: articleStore.page,
    per_page: articleStore.per_page
  }).then(response => {
    articleStore.setArticles(response.data)
    articleStore.setTotal(response.total)

    window.scrollTo({ top: 0 })

    if (articleStore.page === 1) {
      sync_url_params({
        page: null,
        per_page: null
      })
    } else {
      sync_url_paginate(articleStore.page, articleStore.per_page)
    }
  })
}

const openArticle = (slug) => {
  router.push(`/article/${slug}`)
}

const openTag = (tag) => {
  router.push(`/tag/${tag}`)
}

const openUser = (name) => {
  router.push(`/user/${name}`)
}

watch(() => articleStore.per_page, () => {
  loadArticles()
})

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const page = parseInt(params.get('page'))

  if (page) {
    articleStore.setPage(page)
  } else {
    articleStore.setPage(1)
  }

  smallWindowSize.value = paginateLayouts.smallWindowSize
  layout.value = paginateLayouts.layout

  loadArticles()
})
</script>

<style scoped lang="scss">
.article-list-container {
  width: 100%;
}

.article-list {
  display: flex;
  flex-wrap: wrap;
}

.article-item {
  width: 48%;
  margin-right: 2%;
  margin-bottom: 20px;

  @media screen and (max-width: 992px) {
    width: 100%;
    margin-right: 0;
  }
}

.article-item-content {
  display: flex;
  padding: 15px;
}

.article-media-link {
  display: flex;
  justify-content: center;
  width: 200px;
  margin-right: 15px;

  @media screen and (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
}

.article-media {
  width: 100%;
  max-width: 200px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;

  @media screen and (max-width: 768px) {
    max-width: 100%;
    max-height: 200px;
  }
}

.article-body {
  flex: 1;
}

.article-title {
  margin: 0 0 10px;
  font-size: 18px;

  a {
    color: #303133;
    font-weight: 600;

    &:hover {
      color: #409eff;
    }
  }
}

.article-description {
  margin-bottom: 15px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;

  &:hover {
    color: #303133;
  }
}

.article-tags {
  margin-bottom: 10px;
}

.article-tag {
  margin-right: 8px;
  margin-bottom: 5px;
  cursor: pointer;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  margin-right: 15px;
  margin-bottom: 5px;

  i {
    margin-right: 4px;
  }

  &.more-link {
    margin-left: auto;
    color: #409eff;
    cursor: pointer;

    &:hover {
      color: #66b1ff;
    }
  }
}

.pagination-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
