<template>
  <div class="links-page">
    <!-- 页面顶部横幅 -->
    <section class="page-banner">
      <div class="page-banner__bg"></div>
      <div class="page-banner__content">
        <h1 class="page-banner__title">
          <i class="fas fa-link"></i>
          友情链接
        </h1>
        <p class="page-banner__desc">与优秀站点互链，分享价值，共同成长</p>
      </div>
    </section>

    <!-- 友链申请规则 + 本站信息 -->
    <section class="section rules-section">
      <div class="rules-layout">
        <div class="rules-left">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-handshake"></i>
              友链申请规则
            </h2>
          </div>
          <el-card shadow="hover" class="rules-card">
            <div class="rule-item">
              <span class="rule-icon">📜</span>
              <div class="rule-text">
                <span class="rule-label">内容合规</span>
                <span class="rule-desc"
                  >博客内容应遵循合法、健康、积极向上的原则，禁止包含政治敏感、暴力、色情等内容</span
                >
              </div>
            </div>
            <div class="rule-item">
              <span class="rule-icon">✍️</span>
              <div class="rule-text">
                <span class="rule-label">持续更新</span>
                <span class="rule-desc">博客内容应保持一定的原创性和更新频率，避免长期不更新</span>
              </div>
            </div>
            <div class="rule-item">
              <span class="rule-icon">🌐</span>
              <div class="rule-text">
                <span class="rule-label">站点质量</span>
                <span class="rule-desc">站点 SEO 友好，设计风格简洁整洁，页面响应时间不宜过长</span>
              </div>
            </div>
            <div class="rule-item">
              <span class="rule-icon">🔗</span>
              <div class="rule-text">
                <span class="rule-label">先链后申</span>
                <span class="rule-desc">请先添加本站友链，再提交申请</span>
              </div>
            </div>
          </el-card>
        </div>
        <div class="rules-right">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-handshake"></i>
              关于本站
            </h2>
          </div>
          <el-card shadow="hover" class="site-info-card">
            <template #header>
              <div class="site-info-header">
                <el-avatar :size="48" src="https://www.leorain.cn/images/logo.png" class="site-info-avatar"></el-avatar>
                <div class="site-info-intro">
                  <div class="site-info-name">leorain</div>
                  <div class="site-info-slogan"></div>
                </div>
              </div>
            </template>
            <div class="site-info-grid">
              <div class="site-info-item">
                <i class="fas fa-user"></i>
                <div class="site-info-item__content">
                  <span class="site-info-label">简介</span>
                  <span
                    class="site-info-copyable"
                    @click="copyToClipboard('一个对技术和生活充满热爱的文艺型技术青年')"
                    title="点击复制"
                  >一个对技术和生活充满热爱的文艺型技术青年</span>
                </div>
              </div>
              <div class="site-info-item">
                <i class="fas fa-globe"></i>
                <div class="site-info-item__content">
                  <span class="site-info-label">网址</span>
                  <span
                    class="site-info-copyable"
                    @click="copyToClipboard('https://www.leorain.cn')"
                    title="点击复制"
                  >https://www.leorain.cn</span>
                </div>
              </div>
              <div class="site-info-item">
                <i class="fas fa-rss"></i>
                <div class="site-info-item__content">
                  <span class="site-info-label">订阅</span>
                  <span
                    class="site-info-copyable"
                    @click="copyToClipboard('https://www.leorain.cn/rss')"
                    title="点击复制"
                  >https://www.leorain.cn/rss</span>
                </div>
              </div>
              <div class="site-info-item">
                <i class="fas fa-image"></i>
                <div class="site-info-item__content">
                  <span class="site-info-label">头像</span>
                  <span
                    class="site-info-copyable"
                    @click="copyToClipboard('https://www.leorain.cn/images/logo.png')"
                    title="点击复制"
                  >https://www.leorain.cn/images/logo.png</span>
                </div>
              </div>
            </div>
            <div class="site-info-action">
              <el-button type="primary" round size="small" @click="$router.push('/guestbook')">
                <i class="fas fa-comment-dots"></i>
                前往留言申请
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </section>

    <!-- 友链列表 + RSS 侧边栏 -->
    <div class="content-layout" :class="{ 'content-layout--single': !hasRssList }">
      <!-- 友链列表 -->
      <section class="section links-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-users"></i>
            友链列表
            <span class="section-count" v-if="links.length">{{ links.length }}</span>
          </h2>
          <div class="section-subtitle">申请友链请先添加本站，然后前往留言板提交申请</div>
        </div>
        <div class="links-grid">
          <div
            v-for="link in links"
            :key="link.id"
            class="link-card"
            :class="{ 'link-card--inactive': link.status === 2 }"
            @click="openLink(link.link, link.id)"
          >
            <div class="link-card__bg" :style="{ backgroundImage: `url(${link.image})` }"></div>
            <div class="link-card__overlay"></div>
            <div class="link-card__content">
              <div class="link-card__header">
                <el-avatar :src="link.image" :size="48" class="link-card__avatar"></el-avatar>
                <div class="link-card__meta">
                  <div class="link-card__name">
                    {{ link.name }}
                    <el-tag v-if="link.status === 2" type="info" size="small" effect="dark">不活跃</el-tag>
                  </div>
                  <div class="link-card__url" :title="link.link">{{ maxString(link.link, 40) }}</div>
                </div>
                <span class="link-card__preview-btn" @click.stop="preview(link)" title="预览站点">
                  <i class="fas fa-external-link-alt"></i>
                </span>
              </div>
              <div class="link-card__desc" :title="link.description">
                {{ link.description || '暂无描述' }}
              </div>
              <div class="link-card__footer">
                <span class="link-card__stat">
                  <i class="far fa-calendar-alt"></i>
                  {{ moment(link.created_at).format('YYYY-MM-DD') }}
                </span>
                <span class="link-card__stat" v-if="link.clicks">
                  <i class="far fa-eye"></i>
                  {{ link.clicks }}
                </span>
                <span
                  class="link-card__stat"
                  :class="{
                    'link-card__stat--slow': link.response_time > 1000,
                    'link-card__stat--fast': link.response_time && link.response_time <= 300
                  }"
                  v-if="link.response_time"
                >
                  <i class="fas fa-bolt"></i>
                  {{ link.response_time }}ms
                </span>
                <span class="link-card__stat link-card__stat--visited" v-if="link.last_visited">
                  <i class="fas fa-sync-alt"></i>
                  {{ moment(link.last_visited).format('MM-DD HH:mm') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!links.length" description="暂无友链" />
      </section>

      <!-- RSS 订阅列表 -->
      <el-card v-if="hasRssList" shadow="hover" class="rss-card">
        <template #header>
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-rss"></i>
              RSS 订阅
              <span class="section-count">{{ rssTotal }}</span>
            </h2>
            <div class="section-subtitle">友链站点最新文章动态</div>
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
            <div class="rss-item__source">
              <el-avatar :size="22" class="rss-item__source-avatar">
                {{ (rss.link?.name || '?')[0] }}
              </el-avatar>
              <span class="rss-item__source-name">{{ rss.link?.name || '未知来源' }}</span>
              <span v-if="rss.published_at" class="rss-item__time">
                {{ moment(rss.published_at).format('MM-DD HH:mm') }}
              </span>
            </div>
            <div class="rss-item__title">{{ rss.title || '未命名文章' }}</div>
            <div v-if="rss.summary" class="rss-item__summary">
              {{ maxString(rss.summary, 100) }}
            </div>
          </a>
          <div ref="rssLoadTrigger" class="rss-load-trigger"></div>
          <div v-if="rssLoading" class="rss-status"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>
          <div v-else-if="rssFinished" class="rss-status">— 没有更多了 —</div>
        </div>
      </el-card>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="show_preview"
      class="preview-dialog"
      :width="isMobile ? '95%' : '70%'"
      destroy-on-close
      @close="show_preview = false"
    >
      <template #header>
        <div class="preview-dialog-header">
          <el-link @click="openLink(preview_link.link, preview_link.id)" :underline="false">
            <i class="fas fa-external-link-alt"></i> 新窗口打开
          </el-link>
          <span class="preview-dialog-title">
            友链预览 - <b>{{ preview_link.name }}</b>
          </span>
          <span></span>
        </div>
      </template>
      <div class="preview-dialog-body">
        <iframe :src="preview_link.link" class="preview-iframe"></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import { linkApi, rssApi } from '@/apis'
import { maxString } from '@/utils/helpers'

export default {
  tdk () {
    return {
      title: '友情链接',
      description: 'leorain 友链'
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
      preview_link: {},
      isMobile: false
    }
  },
  computed: {
    moment () {
      return moment
    },
    hasRssList () {
      return this.rssList.length > 0
    }
  },
  mounted () {
    this.load()
    this.checkMobile()
    window.addEventListener('resize', this.checkMobile)
  },
  beforeUnmount () {
    this.destroyRssObserver()
    window.removeEventListener('resize', this.checkMobile)
  },
  methods: {
    maxString,
    checkMobile () {
      this.isMobile = window.matchMedia('(max-width: 768px)').matches
    },
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
      if (this.rssLoading) return

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
      if (!this.$refs.rssLoadTrigger) return
      this.rssObserver = new IntersectionObserver(
        entries => {
          const [entry] = entries
          if (entry?.isIntersecting) {
            this.loadMoreRss()
          }
        },
        {
          root: this.$refs.rssScrollContainer || null,
          rootMargin: '120px 0px'
        }
      )
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
    },
    async copyToClipboard (text) {
      try {
        await navigator.clipboard.writeText(text)
        this.$message.success('已复制到剪贴板')
      } catch {
        this.$message.error('复制失败，请手动复制')
      }
    }
  }
}
</script>

<style scoped lang="scss">
/* ===== Page Layout ===== */
.links-page {
  width: 100%;
  padding-bottom: 40px;
}

/* ===== Page Banner ===== */
.page-banner {
  position: relative;
  overflow: hidden;
  padding: 36px 24px 28px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, var(--theme-accent-color, #7c3aed) 0%, #a78bfa 50%, #c4b5fd 100%);
}

.page-banner__bg {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 40%);
}

.page-banner__content {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  color: #fff;
}

.page-banner__title {
  font-size: 1.6em;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: 0.02em;

  i {
    margin-right: 8px;
  }
}

.page-banner__desc {
  font-size: 0.95em;
  opacity: 0.88;
  margin: 0;
}

/* ===== Section Shared ===== */
.section {
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15em;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;

  i {
    color: var(--theme-accent-color, #7c3aed);
  }
}

.section-subtitle {
  font-size: 0.82em;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.section-count {
  font-size: 0.5em;
  font-weight: 600;
  color: #fff;
  background: var(--theme-accent-color, #7c3aed);
  border-radius: 10px;
  padding: 1px 8px;
  line-height: 1.6;
  vertical-align: middle;
}

/* ===== Rules Section ===== */
.rules-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  padding: 0 16px;
}

.rules-left {
  min-width: 0;
}

.rules-right {
  min-width: 0;
}

.rules-card {
  :deep(.el-card__body) {
    padding: 20px 22px;
  }
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.rule-icon {
  flex-shrink: 0;
  font-size: 1.3em;
  margin-top: 2px;
  width: 28px;
  text-align: center;
}

.rule-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.rule-label {
  font-weight: 700;
  font-size: 0.92em;
  color: var(--el-text-color-primary);
}

.rule-desc {
  font-size: 0.85em;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ===== Site Info Card ===== */
.site-info-card {
  :deep(.el-card__body) {
    padding: 20px;
  }

  :deep(.el-card__header) {
    padding: 20px 20px 0;
    border-bottom: none;
  }
}

.site-info-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.site-info-avatar {
  flex-shrink: 0;
  border: 2px solid var(--theme-accent-color, #7c3aed);
}

.site-info-intro {
  min-width: 0;
}

.site-info-name {
  font-weight: 800;
  font-size: 1.1em;
  color: var(--el-text-color-primary);
}

.site-info-slogan {
  font-size: 0.82em;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

.site-info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88em;

  > i {
    color: var(--theme-accent-color, #7c3aed);
    width: 16px;
    padding-top: 5px;
    text-align: center;
    flex-shrink: 0;
    font-size: 0.9em;
  }
}

.site-info-item__content {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.site-info-label {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-weight: 600;

  &::after {
    content: '：';
  }
}

.site-info-copyable {
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: color 0.2s ease, background-color 0.2s ease;
  word-break: break-all;
  border-bottom: 1px dashed var(--el-border-color);
  padding: 1px 4px;
  border-radius: 3px;
  margin: -1px -4px;

  &::after {
    content: '\f0c5';
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    font-size: 0.72em;
    margin-left: 5px;
    opacity: 0;
    transform: translateY(-2px);
    transition: opacity 0.2s ease, color 0.2s ease;
    display: inline-block;
    color: var(--el-text-color-placeholder);
  }

  &:hover {
    color: var(--theme-accent-color, #7c3aed);
    border-bottom-color: var(--theme-accent-color, #7c3aed);
    background-color: var(--el-fill-color-lighter);

    &::after {
      opacity: 0.7;
      color: var(--theme-accent-color, #7c3aed);
    }
  }
}

.site-info-action {
  margin-top: 16px;
  text-align: center;
}

/* ===== Content Layout (Links + RSS) ===== */
.content-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
  padding: 0 16px;
}

.content-layout--single {
  grid-template-columns: minmax(0, 1fr);
}

.content-layout .links-section {
  margin-bottom: 0;
}

/* ===== Links Grid ===== */
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.link-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);

    .link-card__bg {
      opacity: 0.12;
      transform: scale(1.06);
    }

    .link-card__preview-btn {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.link-card--inactive {
  opacity: 0.55;
  filter: grayscale(40%);

  .link-card__overlay {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 100%);
  }
}

.link-card__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.06;
  transition:
    transform 0.5s ease,
    opacity 0.3s ease;
  z-index: 0;
}

.link-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 100%);
  z-index: 1;
  pointer-events: none;
}

.link-card__content {
  position: relative;
  z-index: 2;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-card__avatar {
  flex-shrink: 0;
  border: 2px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.link-card__meta {
  flex: 1;
  min-width: 0;
}

.link-card__name {
  font-weight: 700;
  font-size: 1.02em;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  .el-tag {
    flex-shrink: 0;
  }
}

.link-card__url {
  font-size: 0.78em;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.link-card__desc {
  font-size: 0.87em;
  color: var(--el-text-color-regular);
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-card__footer {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.76em;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.link-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.link-card__stat--slow {
  color: var(--el-color-warning);
}

.link-card__stat--fast {
  color: var(--el-color-success);
}

.link-card__preview-btn {
  margin-left: auto;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-fill-color);
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
  color: var(--el-text-color-secondary);
  font-size: 0.8em;
  flex-shrink: 0;

  &:hover {
    background: var(--theme-accent-color, #7c3aed);
    color: #fff;
  }
}

/* ===== RSS Sidebar ===== */
.rss-card {
  position: sticky;
  top: 72px;
  overflow: hidden;
  max-height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    padding: 16px 18px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.rss-card .section-header {
  margin-bottom: 0;
}

.rss-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 14px 14px;
}

.rss-item {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 10px 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background-color 0.2s ease;
  border-radius: 6px;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--el-fill-color-lighter);

    .rss-item__title {
      color: var(--theme-accent-color, #7c3aed);
    }
  }
}

.rss-item__source {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.rss-item__source-avatar {
  flex-shrink: 0;
  background: var(--theme-accent-color, #7c3aed);
  color: #fff;
  font-size: 0.6em;
  font-weight: 700;
}

.rss-item__source-name {
  font-size: 0.72em;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.rss-item__time {
  font-size: 0.68em;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

.rss-item__title {
  font-size: 0.88em;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  margin-bottom: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}

.rss-item__summary {
  font-size: 0.78em;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rss-load-trigger {
  width: 100%;
  height: 1px;
}

.rss-status {
  padding: 12px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 0.78em;
}

/* ===== Preview Dialog ===== */
.preview-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.preview-dialog-title {
  font-size: 0.95em;
  color: var(--el-text-color-regular);
}

.preview-dialog-body {
  width: 100%;
  height: 60vh;
  overflow: hidden;
  border-radius: 8px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}

.preview-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

/* ===== Responsive ===== */
@media screen and (max-width: 1100px) {
  .rules-layout {
    grid-template-columns: 1fr;
  }

  .content-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .rss-card {
    position: static;
    max-height: none;
  }

  .rss-list {
    max-height: 500px;
  }
}

@media screen and (max-width: 768px) {
  .page-banner {
    padding: 28px 16px 20px;
  }

  .page-banner__title {
    font-size: 1.3em;
  }

  .rules-layout,
  .content-layout {
    padding: 0 10px;
  }

  .rules-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .site-info-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    :deep(.el-card__header) {
      padding: 16px 16px 0;
    }
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.05em;
  }
}

@media screen and (max-width: 480px) {
  .rule-item {
    gap: 8px;
  }

  .rule-icon {
    font-size: 1.1em;
  }

  .link-card__content {
    padding: 14px 16px;
  }
}
</style>
