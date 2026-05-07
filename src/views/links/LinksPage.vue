<template>
  <div class="links-body">
    <div class="links-rules">
      <el-card>
        <parse content="**友链申请规则**
- 博客内容应遵循合法、健康、积极向上的原则，禁止包含政治敏感、暴力、色情等内容。
- 博客内容应保持一定的原创性和更新频率，避免长期不更新。
- 站点SEO友好，设计风格应简洁、整洁、易于阅读，页面响应时间不宜过长
- 请添加本站友链
  - 站点名称：leorain
  - 描述：一个对技术和生活充满热爱的文艺型技术青年
  - 头像：https://www.leorain.cn/images/logo.png
  - 网址：https://www.leorain.cn
  - 订阅：https://frontend.leorain.cn/rss
"></parse>
        <div class="rules-action">
          <el-button @click="$router.push('/guestbook')">点击留言</el-button>
        </div>
      </el-card>
    </div>

    <div class="links-layout" :class="{ 'links-layout--single': !hasRssList }">
      <section class="links-main">
        <div class="links-container">
          <div class="links-item-div" v-for="(link,index) in links" :key="index">
            <div style="position: relative" @click="openLink(link.link,link.id)">
              <el-card
                :body-style="{ paddingLeft: '5px' }"
                class="links-item"
                :style="{
                  backgroundImage: 'url(' + link.image + ')',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }"
              >
                <div class="links-item-container" :class="{ 'links-item-inactive': link.status === 2 }">
                  <div class="links-item-left">
                    <el-avatar :src="link.image"></el-avatar>
                  </div>
                  <div class="links-item-right">
                    <div>
                      <b>站点名称：</b>
                      {{ link.name }}
                    </div>
                    <div>
                      <b>链接：</b>
                      <el-link :title="link.link" type="primary">{{ maxString(link.link, 30) }}</el-link>
                    </div>
                    <div :title="link.description">
                      <b>描述：</b>
                      {{ maxString(link.description, 32) }}
                    </div>
                    <div>
                      <b>加入时间：</b>
                      {{ moment(link.created_at).format('YYYY-MM-DD') }}
                    </div>
                    <div>
                      <b>点击次数：</b>
                      {{ link.clicks }}
                    </div>
                    <div>
                      <b>上次抓取时间：</b>
                      <span v-if="link.last_visited">
                        {{ moment(link.last_visited).format('YYYY-MM-DD HH:mm:ss') }}
                      </span>
                      <span v-else>
                        未抓取
                      </span>
                    </div>
                    <div>
                      <b>响应时间：</b>
                      {{ link.response_time }}ms
                    </div>
                    <div v-if="link.status === 2" class="links-item-status-inactive">
                      <i class="fas fa-unlink"></i> 当前链接不活跃
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
            <div class="links-item-div-tips" @click="preview(link)">预览</div>
          </div>
        </div>
      </section>

      <aside v-if="hasRssList" class="rss-sidebar">
        <el-card class="rss-card">
          <template #header>
            <div class="rss-header">
              <span>RSS 订阅</span>
              <span class="rss-count">已加载 {{ rssList.length }}/{{ rssTotal }} 条</span>
            </div>
          </template>

          <div ref="rssScrollContainer" class="rss-list">
            <a
              v-for="rss in rssList"
              :key="rss.id"
              class="rss-item"
              :href="rss.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="rss-item__title">{{ rss.title || '未命名文章' }}</div>
              <div class="rss-item__meta">
                <span>{{ rss.link?.name || '未知来源' }}</span>
                <span v-if="rss.published_at">{{ moment(rss.published_at).format('YYYY-MM-DD HH:mm') }}</span>
              </div>
              <div v-if="rss.summary" class="rss-item__summary">
                {{ maxString(rss.summary, 120) }}
              </div>
            </a>
            <div ref="rssLoadTrigger" class="rss-load-trigger"></div>
            <div v-if="rssLoading" class="rss-status">加载中...</div>
            <div v-else-if="rssFinished" class="rss-status">没有更多了</div>
          </div>
        </el-card>
      </aside>
    </div>

    <el-dialog
      v-model="show_preview"
      class="preview-dialog"
      style="width: 70%;height: 60%"
      @cancel="show_preview = false"
    >
      <template v-slot:header>
        <div style="position: relative;display: flex;justify-content: center;width: 100%">
          <div title="新窗口打开" style="position: absolute;left: 10px;cursor: pointer"
               @click="openLink(preview_link.link,preview_link.id)">
            <el-link>新窗口打开<i class="fa fa-external-link-alt"></i></el-link>
          </div>
          <div style="position: absolute;top: 0">
            友链-
            <el-link :href="preview_link.link"><b>{{ preview_link.name }}</b></el-link>
            -预览
          </div>
          <div style="position: absolute;top: 0;right: 10px;cursor: pointer" @click="show_preview=false">
            <i class="fas fa-times-circle"></i>
          </div>
        </div>
      </template>
      <div style="width: 100%;height: 100%">
        <iframe style="width: 100%;height: 100%;border: none;border-radius: 5px" :src="preview_link.link"></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import parse from '@/components/MarkdownParse.vue'
import { linkApi, rssApi } from '@/apis'
import { maxString } from '@/utils/helpers'

export default {
  tdk () {
    return {
      title: '友情链接',
      description: 'leorain 友链'
    }
  },
  components: { parse },
  computed: {
    moment () {
      return moment
    },
    hasRssList () {
      return this.rssList.length > 0
    }
  },
  data () {
    return {
      links: [],
      rssList: [],
      rssTotal: 0,
      rssPage: 1,
      rssLastPage: 1,
      rssPerPage: 10,
      rssLoading: false,
      rssFinished: false,
      rssObserver: null,
      show_preview: false,
      preview_link: {}
    }
  },
  mounted () {
    this.load()
  },
  beforeUnmount () {
    this.destroyRssObserver()
  },
  methods: {
    maxString,
    preview (link) {
      linkApi.visitLink(link.id).catch(() => {})
      this.show_preview = true
      this.preview_link = link
    },
    async load () {
      this.links = await linkApi.getLinks().catch(() => [])
      await this.loadMoreRss(true)
      this.$nextTick(() => {
        if (this.hasRssList) {
          this.initRssObserver()
        }
      })
    },
    async loadMoreRss (reset = false) {
      if (this.rssLoading) {
        return
      }

      if (reset) {
        this.rssList = []
        this.rssPage = 1
        this.rssLastPage = 1
        this.rssFinished = false
      } else if (this.rssFinished) {
        return
      }

      this.rssLoading = true
      try {
        const response = await rssApi.getRssList({
          page: this.rssPage,
          per_page: this.rssPerPage
        })
        console.log(response)
        const items = response?.data || []
        this.rssList = reset ? items : [...this.rssList, ...items]
        const meta = response.meta
        this.rssLastPage = meta.pagination.total_page || 1
        const currentPage = Number(meta.pagination.current_page || this.rssPage)
        const loadedCount = this.rssList.length
        const total = Number(meta.pagination.total || 0)
        this.rssTotal = total

        this.rssFinished = items.length === 0 || (total > 0 ? loadedCount >= total : currentPage >= this.rssLastPage)
        this.rssPage = currentPage + 1
      } catch (e) {
        this.rssFinished = true
      } finally {
        this.rssLoading = false
      }
    },
    initRssObserver () {
      this.destroyRssObserver()
      if (!this.$refs.rssLoadTrigger) {
        return
      }
      this.rssObserver = new IntersectionObserver((entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          this.loadMoreRss()
        }
      }, {
        root: this.$refs.rssScrollContainer || null,
        rootMargin: '120px 0px'
      })
      this.rssObserver.observe(this.$refs.rssLoadTrigger)
    },
    destroyRssObserver () {
      if (this.rssObserver) {
        this.rssObserver.disconnect()
        this.rssObserver = null
      }
    },
    openLink (url, id) {
      linkApi.visitLink(id).catch(() => {})
      window.open(url)
    }
  }
}
</script>
<style scoped lang="scss">
.links-body {
  background-image: url("https://images.leorain.cn/icons/assets/links-body-background.jpg");
  background-position: center;
  background-size: cover;
  padding-bottom: 24px;
  background-attachment: fixed;
}

.links-rules {
  display: flex;
  justify-content: center;
  padding: 20px 16px 0;
}

.rules-action {
  display: flex;
  justify-content: center;
}

.links-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
  padding: 16px;
}

.links-layout--single {
  grid-template-columns: minmax(0, 1fr);
}

.links-main {
  min-width: 0;
}

.links-container {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-bottom: 10px;
  @media screen and (max-width: 1400px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media screen and (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media screen and (max-width: 640px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

.rss-sidebar {
  position: sticky;
  top: 16px;
}

.rss-card {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  :deep(.el-card__body) {
    overflow: hidden;
  }
}

.rss-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.rss-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rss-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 6px;
}

.rss-item {
  display: block;
  text-decoration: none;
  color: inherit;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rss-item:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.rss-item__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 6px;
}

.rss-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.rss-item__summary {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.rss-load-trigger {
  width: 100%;
  height: 1px;
}

.rss-status {
  padding-top: 8px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.links-item-div {
  position: relative;
  width: 100%;
  font-size: .85em;
  background-color: white;
  border-radius: 5px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.links-item-div-tips {
  position: absolute;
  top: 15%;
  right: 5%;
  width: 30px;
  height: 20px;
  text-align: center;
  cursor: pointer;
  background-color: #dfd1d1;
  border-radius: 3px;
  color: grey;
  z-index: 10;
}

.links-item-div-tips:hover {
  background-color: #a69e9e;
  color: white;
}

.links-item {
  background: transparent;
  cursor: pointer;
  box-shadow: none !important;
  border: none !important;
}

:deep(.el-card__body) {
  background: linear-gradient(to right, var(--el-bg-color) 20%, rgba(255, 255, 255, 0.4) 100%);
}

.links-item-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
}

.links-item-inactive {
  opacity: 0.5;
  filter: grayscale(100%);
}

.links-item-status-inactive {
  margin-top: 4px;
  color: #909399;
  font-weight: 600;
}

.links-item-left {
  margin: 5px;
}

.links-item-right {
  margin: 5px;
}

:deep(.preview-dialog .el-dialog) {
  display: flex;
  flex-direction: column;
  height: 60vh;
}

:deep(.preview-dialog .el-dialog__body) {
  flex: 1 1 auto;
  padding: 20px;
  overflow: hidden;
  height: 100%;
}

::v-deep .modal-dialog {
  max-width: 70% !important;
  @media screen and (max-aspect-ratio: 1/1) {
    max-width: 95% !important;
  }
  height: 80% !important;
}

::v-deep .modal-content {
  height: 100% !important;
}

@media screen and (max-width: 1200px) {
  .links-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .rss-sidebar {
    position: static;
  }
}
</style>
