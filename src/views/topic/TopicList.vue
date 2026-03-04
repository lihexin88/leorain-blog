<template>
  <div class="topic-list-container">
    <el-card v-for="(topic, index) in topicList" :key="index" class="topic-list-item">
      <div @click="goTopicDetail(topic.slug, topic.type)">
        <div class="topic-list-item-title">{{ topic.title }}</div>
        <div class="topic-list-item-description">{{ topic.description }}</div>
        <div class="topic-list-item-date">
          <i class="fa fa-clock"></i>
          {{ moment(topic.created_at).format("YYYY-MM-DD") }}
        </div>
      </div>
    </el-card>
    <div class="pagination-container">
      <el-pagination
          v-model:page-size="perPage"
          :page-sizes="[10, 20, 30, 50]"
          v-model:current-page="page"
          @current-change="load"
          @size-change="load"
          background
          :small="smallWindowSize"
          :layout="layout"
          :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { paginateLayouts, syncUrlPaginate } from '@/utils/helpers'
import { topicApi } from '@/apis'

export default {
  name: 'TopicList',
  data () {
    return {
      topicList: [],
      total: 0,
      page: 1,
      perPage: 10,
      smallWindowSize: false,
      layout: 'prev, pager, next, sizes, total'
    }
  },
  methods: {
    moment, // 使模板中可直接调用 moment()
    goTopicDetail (slug, type) {
      switch (type) {
        case 1:
          this.$router.push({
            name: 'TopicDetail',
            params: {
              slug
            }
          })
          break
        case 2:
          this.$router.push({
            name: 'Schulte'
          })
          break
      }
    },
    async load () {
      try {
        const response = await topicApi.getTopics({
          page: this.page,
          per_page: this.perPage
        })
        this.topicList = response.data
        this.total = response.meta.pagination.total
        this.page = response.meta.pagination.current_page
        this.perPage = response.meta.pagination.per_page
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (this.page === 1) {
          syncUrlPaginate({ page: null, perPage: null })
        } else {
          syncUrlPaginate({ page: this.page, perPage: this.perPage })
        }
      } catch (error) {
        console.error('Failed to load topics:', error)
      }
    }
  },
  mounted () {
    const params = new URLSearchParams(window.location.search)
    const pageParam = parseInt(params.get('page'))
    if (pageParam) {
      this.page = pageParam
    } else {
      this.page = 1
    }

    const layouts = paginateLayouts()
    this.smallWindowSize = layouts.smallWindowSize
    this.layout = layouts.layout

    this.load()
  }
}
</script>

<style scoped lang="scss">
.topic-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.topic-list-item {
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.topic-list-item-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.topic-list-item-description {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-list-item-date {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;

  .fa-clock {
    margin-right: 5px;
  }
}

.pagination-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  margin-top: 10px;
}

// 响应式设计
@media screen and (max-width: 768px) {
  .topic-list-container {
    padding: 15px;
  }

  .topic-list-item {
    margin-bottom: 15px;
    border-radius: 8px;

    &:hover {
      transform: translateY(-3px);
    }

    :deep(.el-card__body) {
      padding: 15px;
    }
  }

  .topic-list-item-title {
    font-size: 16px;
  }

  .topic-list-item-description {
    font-size: 14px;
  }
}
</style>
