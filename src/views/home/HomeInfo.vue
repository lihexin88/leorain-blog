<template>
  <div class="home-info">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      <div class="user-info">
        <div class="avatar">
          <img src="https://images.leorain.cn/logo.png" alt="avatar">
        </div>
        <div class="user-details">
          <h3>Leorain</h3>
          <p>全栈开发工程师</p>
        </div>
      </div>
      <div class="user-stats">
        <div class="stat-item">
          <span class="stat-value">128</span>
          <span class="stat-label">文章</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">256</span>
          <span class="stat-label">分类</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">512</span>
          <span class="stat-label">标签</span>
        </div>
      </div>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>最近文章</span>
        </div>
      </template>
      <div class="recent-articles">
        <div v-for="(article, index) in recentArticles" :key="index" class="article-item">
          <a @click="openArticle(article.slug)" class="article-link">{{ article.title }}</a>
          <span class="article-date">{{ formatDate(article.published_at) }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>标签云</span>
        </div>
      </template>
      <div class="tag-cloud">
        <el-tag
          v-for="(tag, index) in tags"
          :key="index"
          :type="getTagType(index)"
          class="tag-item"
          @click="openTag(tag.tag)"
        >
          {{ tag.tag }}
        </el-tag>
      </div>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>友情链接</span>
        </div>
      </template>
      <div class="links">
        <a v-for="(link, index) in links" :key="index" :href="link.url" target="_blank" class="link-item">
          {{ link.name }}
        </a>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import moment from 'moment'

const router = useRouter()
const recentArticles = ref([])
const tags = ref([])
const links = ref([
  { name: 'Vue.js', url: 'https://vuejs.org/' },
  { name: 'Element Plus', url: 'https://element-plus.org/' },
  { name: 'Laravel', url: 'https://laravel.com/' }
])

const getTagType = (index) => {
  const types = ['', 'success', 'info', 'warning', 'danger']
  return types[index % types.length]
}

const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD')
}

const openArticle = (slug) => {
  router.push(`/api/article/${slug}`)
}

const openTag = (tag) => {
  router.push(`/api/tag/${tag}`)
}

onMounted(() => {
  // 获取最近文章
  api.getArticles({ per_page: 5 }).then(response => {
    recentArticles.value = response.data
  })

  // 获取标签
  api.getTags().then(response => {
    tags.value = response.data
  })
})
</script>

<style scoped lang="scss">
.home-info {
  width: 100%;
}

.info-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  .avatar {
    width: 80px;
    height: 80px;
    margin-right: 15px;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .user-details {
    h3 {
      margin: 0 0 5px;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
}

.user-stats {
  display: flex;
  justify-content: space-between;

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: bold;
      color: #303133;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-top: 5px;
    }
  }
}

.recent-articles {
  .article-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .article-link {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #303133;

      &:hover {
        color: #409eff;
      }
    }

    .article-date {
      font-size: 12px;
      color: #909399;
      margin-left: 10px;
    }
  }
}

.tag-cloud {
  .tag-item {
    margin: 0 8px 8px 0;
    cursor: pointer;
  }
}

.links {
  .link-item {
    display: block;
    padding: 8px 0;
    color: #606266;
    border-bottom: 1px solid #f0f0f0;

    &:hover {
      color: #409eff;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
