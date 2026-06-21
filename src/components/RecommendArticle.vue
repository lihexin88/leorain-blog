<template>
  <div class="recommend-wrapper">
    <el-card class="recommend-card" shadow="hover">
      <template #header>
        <div class="recommend-header">
          <div class="recommend-header-left">
            <el-icon class="header-icon"><MagicStick /></el-icon>
            <span class="header-title">推荐文章</span>
          </div>
          <el-tag size="small" type="info" effect="plain" round>余弦向量推荐</el-tag>
        </div>
      </template>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton-item">
          <el-skeleton animated>
            <template #template>
              <div class="skeleton-content">
                <el-skeleton-item variant="text" style="width: 60%; height: 20px" />
                <el-skeleton-item variant="text" style="width: 90%; margin-top: 8px" />
                <el-skeleton-item variant="text" style="width: 40%; margin-top: 8px" />
              </div>
            </template>
          </el-skeleton>
          <el-divider v-if="i < 3" />
        </div>
      </template>

      <!-- Empty state -->
      <el-empty
        v-else-if="!articles.length"
        description="暂无推荐"
        :image-size="80"
      />

      <!-- Article list -->
      <div v-else>
        <div
          v-for="(article, index) in articles"
          :key="article.id || index"
          class="article-block"
        >
          <div class="article-card" @click="open_article(article.slug)">
            <div class="article-main">
              <div class="article-body">
                <h4 class="article-title">
                  {{ maxString(article.title, 48) }}
                </h4>
                <p class="article-desc">
                  {{ maxString(article.meta_description || article.title, 120) }}
                </p>
              </div>

              <div class="article-meta-row">
                <div class="article-meta">
                  <el-link
                    :href="`/user/profile?uid=${article.user.name}`"
                    :underline="false"
                    type="primary"
                    class="meta-link"
                    @click.stop
                  >
                    <el-icon class="meta-icon"><UserFilled /></el-icon>
                    <span>{{ article.user.name }}</span>
                  </el-link>
                </div>
                <div class="article-meta">
                  <el-icon class="meta-icon"><ChatDotRound /></el-icon>
                  <span>{{ article.comments_count }}</span>
                </div>
                <div class="article-meta">
                  <el-icon class="meta-icon"><Clock /></el-icon>
                  <span>{{ article.published_at }}</span>
                </div>
              </div>
            </div>

            <div class="article-score">
              <el-tag
                :type="scoreType(article.score)"
                effect="light"
                size="small"
                round
              >
                {{ formatScore(article.score) }}
              </el-tag>
            </div>
          </div>

          <el-divider v-if="index < articles.length - 1" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { maxString } from '@/utils/helpers'
import { articleApi } from '@/apis'
import { MagicStick, UserFilled, ChatDotRound, Clock } from '@element-plus/icons-vue'

export default {
  components: {
    MagicStick,
    UserFilled,
    ChatDotRound,
    Clock
  },
  props: {
    query: {
      type: String,
      default: null
    },
    article_id: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      articles: [],
      loading: true
    }
  },
  methods: {
    maxString,
    getRecommendArticles () {
      this.loading = true
      articleApi
        .getRecommendArticles({
          query: this.query,
          article_id: this.article_id
        })
        .then((res) => {
          this.articles = res || []
        })
        .finally(() => {
          this.loading = false
        })
    },
    open_article (slug) {
      this.$router.push({ name: 'ArticleDetail', params: { slug } })
    },
    formatScore (score) {
      const num = (1 - parseFloat(score)) * 100
      return `≈ ${num.toFixed(2)}%`
    },
    scoreType (score) {
      const num = (1 - parseFloat(score)) * 100
      if (num > 30) return 'danger'
      if (num > 15) return 'warning'
      return 'success'
    }
  },
  mounted () {
    this.getRecommendArticles()
  }
}
</script>

<style scoped lang="scss">
.recommend-wrapper {
  width: 100%;
  max-width: 480px;
}

.recommend-card {
  --header-bg-start: #f8fafc;
  --header-bg-end: #f0f5ff;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  :deep(.el-card__header) {
    padding: 16px 20px 14px;
    background: linear-gradient(135deg, var(--header-bg-start) 0%, var(--header-bg-end) 100%);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

// ---- Header ----
.recommend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recommend-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

// ---- Skeleton ----
.skeleton-item {
  padding: 16px 20px;

  .skeleton-content {
    padding: 0;
  }
}

// ---- Article block ----
.article-block {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--el-color-primary-light-9);
  }
}

.article-card {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 16px;
}

.article-main {
  flex: 1;
  min-width: 0;
}

.article-body {
  margin-bottom: 12px;
}

.article-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  transition: color 0.2s ease;

  .article-block:hover & {
    color: var(--el-color-primary);
  }
}

.article-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// ---- Meta row ----
.article-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.article-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);

  .meta-icon {
    font-size: 13px;
  }

  .meta-link {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

// ---- Score badge ----
.article-score {
  flex-shrink: 0;
  padding-top: 2px;
}

// ---- Divider ----
:deep(.el-divider--horizontal) {
  margin: 0;
}
</style>
