<template>
  <div class="article-detail">
    <el-card v-if="article" class="article-card">
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="meta-item">
            <i class="fas fa-user"></i> {{ article.user.name }}
          </span>
          <span class="meta-item">
            <i class="fas fa-clock"></i> {{ formatDate(article.published_at) }}
          </span>
          <span class="meta-item">
            <i class="fas fa-eye"></i> {{ article.view_count }}
          </span>
          <span class="meta-item">
            <i class="fas fa-comments"></i> {{ article.comments_count }}
          </span>
        </div>
      </div>

      <div class="article-tags" v-if="article.tags && article.tags.length">
        <el-tag 
          v-for="(tag, index) in article.tags" 
          :key="index"
          class="article-tag"
          @click="openTag(tag.tagApi)"
        >
          {{ tag.tagApi }}
        </el-tag>
      </div>

      <div class="article-content" v-html="article.content.html"></div>

      <div class="article-footer">
        <el-button @click="goBack" type="primary" plain>返回</el-button>
      </div>
    </el-card>

    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../apis/api'
import moment from 'moment'

const route = useRoute()
const router = useRouter()
const article = ref(null)

const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const openTag = (tag) => {
  router.push(`/tag/${tag}`)
}

const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  const slug = route.params.slug
  api.getArticleDetail(slug).then(response => {
    article.value = response.data
  }).catch(error => {
    console.error('获取文章详情失败:', error)
    router.push('/')
  })
})
</script>

<style scoped lang="scss">
.article-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.article-card {
  padding: 20px;
}

.article-header {
  margin-bottom: 20px;
  text-align: center;
}

.article-title {
  margin: 0 0 15px;
  font-size: 28px;
  color: #303133;
}

.article-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  margin: 0 10px;

  i {
    margin-right: 5px;
  }
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
}

.article-tag {
  margin: 0 5px 5px 0;
  cursor: pointer;
}

.article-content {
  margin-bottom: 30px;
  line-height: 1.8;
  font-size: 16px;
  color: #303133;

  :deep(img) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  :deep(pre) {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }

  :deep(code) {
    background-color: #f5f7fa;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }

  :deep(blockquote) {
    border-left: 4px solid #409eff;
    padding-left: 15px;
    margin: 15px 0;
    color: #606266;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 20px 0 10px;
  }

  :deep(p) {
    margin: 10px 0;
  }

  :deep(ul), :deep(ol) {
    padding-left: 25px;
  }

  :deep(li) {
    margin: 5px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }

  :deep(th), :deep(td) {
    border: 1px solid #ebeef5;
    padding: 8px 12px;
    text-align: left;
  }

  :deep(th) {
    background-color: #f5f7fa;
    font-weight: bold;
  }
}

.article-footer {
  display: flex;
  justify-content: center;
}
</style>
