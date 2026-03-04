<template>
  <div>
    <el-card v-for="(topic, index) in topicList" :key="index" class="topic-list-item">
      <div @click="goTopicDetail(topic.slug, topic.type)">
        <div>{{ topic.title }}</div>
        <div class="topic-list-item-description">{{ topic.description }}</div>
        <div><i class="fa fa-clock"></i>{{ moment(topic.created_at).format("YYYY-MM-DD") }}</div>
      </div>
    </el-card>
    <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 10px; color: #0C0C0C">
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
.topic-list-item {
  cursor: pointer;
  margin-top: 10px;
}

.topic-list-item:hover {
  transform: scale(1.05);
}

.topic-list-item-description {
  font-size: .9em;
  color: grey;
}
</style>
