<template>
  <div class="container list article-list-container" id="container-left">
    <div class="row">
      <div class="article-list">
        <!-- 骨架屏占位 -->
        <template v-if="loading">
          <div v-for="i in skeletonCount" :key="'skeleton-' + i" class="article-item article-skeleton">
            <div class="article-cover">
              <div class="skeleton-media"></div>
            </div>
            <div class="media-body article-body">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-desc"></div>
              <div class="skeleton-line skeleton-desc skeleton-desc--short"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag"></div>
                <div class="skeleton-tag"></div>
              </div>
              <div class="skeleton-info">
                <div class="skeleton-dot"></div>
                <div class="skeleton-dot"></div>
                <div class="skeleton-dot"></div>
              </div>
            </div>
          </div>
        </template>
        <!-- 文章列表 -->
        <template v-else>
          <el-card
            v-for="(article, index) in articles"
            class="media article-item pointer"
            @click="handleArticleClick(article.slug, $event)"
            @touchstart.passive="handleArticleTouchStart(article.slug, $event)"
            @touchmove.passive="handleArticleTouchMove(article.slug, $event)"
            @touchend="handleArticleTouchEnd(article.slug, $event)"
            @touchcancel="handleArticleTouchCancel(article.slug)"
            :key="article.slug"
          >
            <!-- 封面媒体 -->
            <div class="article-cover">
              <a v-if="article.page_image" class="article-item-link" :title="article.slug">
                <img
                  v-if="mediaType(article.page_image) === 'image'"
                  class="article-media"
                  :alt="article.slug"
                  :src="article.is_zoom ? article.page_image + '?x-oss-process=style/page-image' : article.page_image"
                />
                <video
                  v-else-if="mediaType(article.page_image) === 'video'"
                  class="article-media"
                  muted
                  autoplay
                  playsinline="true"
                  webkit-playsinline="true"
                  :src="article.page_image"
                ></video>
                <img
                  v-else-if="article.page_image !== undefined"
                  class="article-media"
                  :alt="article.slug"
                  src="https://images.leorain.cn/icons/assets/pure_article.png"
                />
              </a>
              <a v-else class="article-item-link" @click="openArticle(article.slug)">
                <div class="none-image-wrapper">
                  <span class="none-image-label">随机</span>
                  <img
                    v-if="article.page_image !== undefined && nonePageImageUrl"
                    class="article-media none-image"
                    :alt="article.slug"
                    :src="nonePageImageUrl"
                    data-holder-rendered="true"
                  />
                </div>
              </a>
            </div>

            <!-- 文章内容 -->
            <div class="media-body article-body">
              <div
                class="media-heading article-heading"
                role="button"
                tabindex="0"
                @click="openArticle(article.slug)"
                @keydown.enter="openArticle(article.slug)"
              >
                <a :title="article.title">
                  <span class="article-title">{{ article.title }}</span>
                </a>
              </div>

              <div
                class="article-description"
                v-if="article.meta_description || article.subtitle"
                @click="openArticle(article.slug)"
                :title="article.slug"
              >
                <span>{{ article.meta_description ?? article.subtitle }}</span>
              </div>

              <div class="article-extra">
                <div class="article-tags-wrap">
                  <el-tag
                    v-for="(tag, tagIndex) in article.tags"
                    class="article-tag"
                    :key="tag.tag"
                    @click="open_tag(tag.tag)"
                    :title="tag.tag"
                    type="info"
                  >
                    {{ tag.tag }}
                  </el-tag>
                </div>

                <div class="info">
                  <i class="fas fa-user info-clickable" @click="go_user(article.user.uid)">
                    {{ article.user.name ?? 'null' }}
                  </i>
                  <i :title="moment(article.published_at).format('Y-M-D H:m:s')" :id="index" class="fas fa-clock">
                    {{ getFriendlyDate(moment(article.published_at).format('Y-M-D H:m:s')) }}
                  </i>
                  <i class="fas fa-eye">{{ article.view_count }}</i>
                  <i class="fas fa-comments">{{ article.comments_count }}</i>
                  <a @click="openArticle(article.slug)" class="float-right info-clickable" :title="article.slug">
                    More
                    <i class="fas fa-chevron-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </el-card>
        </template>
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:page-size="per_page"
          :page-sizes="[27, 30, 39]"
          v-model:current-page="page"
          @current-change="load"
          background
          :small="smallWindowSize"
          :layout="layout"
          :total="total"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { getFriendlyDate, mediaType, paginateLayouts, syncUrlPaginate } from '@/utils/helpers'
import moment from 'moment'
import anime from 'animejs'
import { articleApi, siteAssetsApi } from '@/apis'

export default {
  computed: {
    moment () {
      return moment
    },
    skeletonCount () {
      if (typeof window === 'undefined') return 9
      return window.matchMedia('(max-aspect-ratio: 1/1)').matches ? 4 : 9
    }
  },
  props: {},
  data () {
    return {
      page: 1,
      activeIndex: -1,
      total: null,
      per_page: 27,
      smallWindowSize: false,
      layout: null,
      articles: [],
      loading: true,
      currentRotations: [],
      articleTouchState: null,
      lastArticleTouchAt: 0,
      nonePageImageUrl: null
    }
  },
  methods: {
    paginateLayouts,
    getFriendlyDate,
    mediaType,
    syncUrlPaginate,
    isInteractiveArticleTarget (event) {
      const target = event && event.target
      if (!(target instanceof Element)) return false
      return Boolean(target.closest('.article-tag, .info-clickable'))
    },
    handleArticleTouchStart (slug, event) {
      const touch = event && event.touches && event.touches[0]
      if (!touch) return
      this.articleTouchState = {
        slug,
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false
      }
    },
    handleArticleTouchMove (slug, event) {
      if (!this.articleTouchState || this.articleTouchState.slug !== slug) return
      const touch = event && event.touches && event.touches[0]
      if (!touch) return
      const deltaX = Math.abs(touch.clientX - this.articleTouchState.startX)
      const deltaY = Math.abs(touch.clientY - this.articleTouchState.startY)
      if (deltaX > 10 || deltaY > 10) {
        this.articleTouchState.moved = true
      }
    },
    handleArticleTouchEnd (slug, event) {
      if (!this.articleTouchState || this.articleTouchState.slug !== slug) return
      const touchState = this.articleTouchState
      this.articleTouchState = null
      this.lastArticleTouchAt = Date.now()
      if (touchState.moved || this.isInteractiveArticleTarget(event)) return
      this.openArticle(slug)
    },
    handleArticleTouchCancel (slug) {
      if (this.articleTouchState && this.articleTouchState.slug === slug) {
        this.articleTouchState = null
        this.lastArticleTouchAt = Date.now()
      }
    },
    handleArticleClick (slug, event) {
      if (this.isInteractiveArticleTarget(event)) return
      if (Date.now() - this.lastArticleTouchAt < 700) return
      this.openArticle(slug)
    },
    go_user (uid) {
      this.$router.push({
        name: 'UserProfile',
        query: { uid }
      })
    },
    openArticle (slug) {
      this.$router.push({
        name: 'ArticleDetail',
        params: { slug }
      })
    },
    open_tag (tag) {
      window.location.href = '/tag/' + tag
    },
    getNonePageImage () {
      siteAssetsApi.takeImage().then(res => {
        this.nonePageImageUrl = res.url
      })
    },
    load () {
      this.loading = true
      articleApi
        .getArticles({
          page: this.page,
          per_page: this.per_page
        })
        .then(response => {
          this.articles = response.data
          this.currentRotations = response.data.map(() => ({ x: 0, y: 0 }))
          this.total = response.total
          this.loading = false
          if (this.page === 1) {
            this.syncUrlPaginate({
              page: null,
              per_page: null
            })
          } else {
            this.syncUrlPaginate({
              page: this.page,
              per_page: this.per_page
            })
          }
          window.scrollTo({ top: 0 })
          this.$nextTick(() => {
            const isMobileDevice = window.matchMedia('(max-width: 768px)').matches
            if (isMobileDevice) return
            anime.remove('.article-item, .article-item-link, .article-body, .article-tag, .info i, .info a')
            anime({
              targets: '.article-item',
              scale: [0.94, 1],
              opacity: [0, 1],
              translateY: [46, 0],
              rotateX: [10, 0],
              rotateZ: [2, 0],
              delay: anime.stagger(90),
              duration: 900,
              easing: 'easeOutCubic'
            })
            anime({
              targets: '.article-item-link, .article-body',
              opacity: [0, 1],
              translateY: [18, 0],
              delay: anime.stagger(70, { start: 180 }),
              duration: 650,
              easing: 'easeOutQuad'
            })
            anime({
              targets: '.article-tag, .info i, .info a',
              opacity: [0, 1],
              translateY: [10, 0],
              delay: anime.stagger(40, { start: 320 }),
              duration: 420,
              easing: 'easeOutQuad'
            })
          })
        })
    }
  },
  watch: {
    per_page () {
      this.load()
    }
  },
  mounted () {
    const params = new URLSearchParams(window.location.search)
    const articlePaginateLayouts = this.paginateLayouts()
    const page = parseInt(params.get('page'))
    if (page) {
      this.page = page
    } else {
      this.page = 1
    }
    this.smallWindowSize = articlePaginateLayouts.smallWindowSize
    this.layout = articlePaginateLayouts.layout
    this.getNonePageImage()
    this.load()
  }
}
</script>

<style scoped lang="scss">
.article-list-container {
  padding-top: 10px;
  width: 100%;
  max-width: 100%;

  @media screen and (max-aspect-ratio: 1/0.7) {
    padding-left: 3px !important;
    padding-right: 3px !important;
  }
}

.article-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding-left: 8%;
  padding-right: 2%;
  padding-top: 20px;

  &:last-child {
    justify-content: start;
  }

  @media screen and (max-aspect-ratio: 1/1) {
    padding: 5px !important;
    grid-template-columns: 1fr;
  }
}

.article-item {
  :deep(.el-card__body) {
    overflow: hidden;
    border-radius: 15px;
    background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
    color: var(--card-text-color, #111827);
    transition:
      background-color 0.35s ease,
      color 0.35s ease;
  }

  padding: 5px !important;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transform-style: preserve-3d;
  border: 1px solid var(--article-border, rgba(255, 255, 255, 0.55));
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
  background-clip: padding-box;
  color: var(--card-text-color, #111827);
  margin: 0;
  border-radius: 18px;
  box-shadow: var(
    --article-box-shadow,
    0 10px 30px rgba(99, 102, 241, 0.12),
    0 16px 34px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.55)
  );
  transition:
    background-color 0.35s ease,
    color 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease;
  will-change: transform, box-shadow;
  z-index: 1;
  animation: slideInUp 0.6s ease-out backwards;

  @for $i from 1 through 50 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    background: inherit;
    border-radius: 16px;
    z-index: -1;
  }

  &::after {
    content: '';
    position: absolute;
    top: -70%;
    left: -70%;
    width: 240%;
    height: 240%;
    background: conic-gradient(
      transparent 0deg,
      rgba(244, 114, 182, 0.8) 60deg,
      rgba(96, 165, 250, 0.8) 120deg,
      rgba(99, 102, 241, 0.8) 180deg,
      rgba(236, 72, 153, 0.8) 240deg,
      rgba(96, 165, 250, 0.8) 300deg,
      transparent 360deg
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -2;
    border-radius: inherit;
  }

  &:hover {
    border-color: transparent;

    &::after {
      opacity: 1;
      animation: rotateBorder 2s linear infinite;
    }

    @include pc {
      .article-media {
        transform: scale(1.15);
        filter: saturate(1.08);
        transition-delay: 250ms;
      }
      .article-title,
      .article-description,
      .article-extra {
        transform: translateX(10px);
      }
    }
  }
  @include mobile {
    width: 100%;
    padding: 5px !important;
    height: auto !important;
    display: flex;

    :deep(.el-card__body) {
      flex-direction: column;
    }

    .article-cover {
      width: 100%;
      min-height: 100px;
      max-height: 140px;
      border-radius: 14px 14px 0 0;

      .article-media {
        height: 100%;
      }
    }

    .article-body {
      padding: 8px 10px;
      border-radius: 0 0 14px 14px;
    }

    .article-title {
      font-size: 1em;
    }

    .article-description {
      height: 32px;
      font-size: 0.75em;
    }
  }
}

.article-card-glow,
.article-card-grid,
.article-card-shine {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.article-card-glow {
  inset: -15%;
  background:
    radial-gradient(circle at 18% 18%, rgba(96, 165, 250, 0.28), transparent 30%),
    radial-gradient(circle at 84% 0%, rgba(244, 114, 182, 0.24), transparent 26%);
  filter: blur(18px);
  opacity: 0.5;
}

.article-card-grid {
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.11) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.11) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.34), transparent 70%);
  opacity: 0.22;
}

.article-card-shine {
  top: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.35);
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.article-item-link {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  border-radius: 14px;
}

.article-cover {
  flex-shrink: 0;
  width: 180px;
  height: 260px;
  overflow: hidden;
  border-radius: 14px;
  position: relative;
  z-index: 1;

  .article-item-link {
    width: 100%;
    height: 100%;
  }
}

.article-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  overflow: hidden;
  border-radius: 14px;
  background-color: var(--article-item-bg-transparent, rgba(255, 255, 255, 0.08));
  transition:
    transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    filter 0.4s ease;
  will-change: transform, filter;
  transform-origin: center;
  display: block;
}

.article-body {
  font-size: 1em;
  position: relative;
  z-index: 2;
  transform-style: preserve-3d;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 10px 12px;
  border-radius: 0 14px 14px 0;
  color: #fff;
  transition:
    background-color 0.35s ease,
    color 0.35s ease,
    text-shadow 0.35s ease;
  min-width: 0;
}

.article-heading {
  margin-top: auto;
  cursor: pointer;
}

.article-title {
  position: relative;
  z-index: 1;
  font-size: 1.3em;
  color: var(--card-text-color, #111827);
  display: inline-block;
  transform: translateZ(26px);
  text-shadow: 0 8px 22px rgba(99, 102, 241, 0.08);
  transition:
    color 0.3s ease,
    transform 0.3s ease-in-out;
}

.article-description {
  margin-top: 0.6em;
  font-size: 0.8em;
  height: 40px;
  line-height: 1.4285em;
  color: var(--muted-text-color, #5b6476);
  overflow-y: hidden;
  display: flex;
  align-items: flex-end;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition:
    color 0.3s ease,
    text-shadow 0.3s ease,
    transform 0.3s ease-in-out;
  transform: translateZ(18px);

  &:hover {
    color: var(--theme-accent-color, #364152);
    text-shadow: 0 6px 16px rgba(99, 102, 241, 0.08);
  }
}

.article-extra {
  margin-bottom: 5px;
  position: relative;
  z-index: 1;
  transform: translateZ(18px);
  transition: transform 0.3s ease-in-out;
}

.article-tags-wrap {
  display: flex;
  flex-wrap: wrap;
}

.article-tag {
  margin-right: 5px;
  margin-bottom: 5px;
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22) 0%, rgba(96, 165, 250, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.42);
  color: var(--card-text-color, #4b5563);
  font-weight: 500;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    color 0.3s ease;
  position: relative;
  overflow: hidden;
  transform: translateZ(30px) scale(1) translateY(0);
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
    transition: left 0.55s ease;
  }

  &:hover {
    transform: translateZ(36px) scale(1.08) translateY(-2px);
    background: linear-gradient(135deg, rgba(244, 114, 182, 0.36) 0%, rgba(96, 165, 250, 0.34) 100%);
    border-color: transparent;
    box-shadow:
      0 8px 18px rgba(99, 102, 241, 0.16),
      0 4px 10px rgba(236, 72, 153, 0.12);
    color: var(--theme-accent-color, #7c3aed) !important;
  }
}

:deep(.el-card__body) {
  padding: 0;
  width: 100%;
  height: 100%;
  min-height: 260px;
  background: transparent;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.info {
  color: var(--muted-text-color, grey);
  font-size: 0.8em;
  transition: color 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;

  .float-right {
    margin-left: auto;
  }

  i {
    transition:
      transform 0.3s ease,
      background 0.3s ease,
      color 0.3s ease,
      box-shadow 0.3s ease;
    padding: 3px 6px;
    border-radius: 999px;
    transform: translateZ(22px) scale(1);

    &:hover {
      background: linear-gradient(135deg, rgba(244, 114, 182, 0.22) 0%, rgba(96, 165, 250, 0.24) 100%);
      transform: translateZ(30px) scale(1.08);
      box-shadow: 0 8px 18px rgba(99, 102, 241, 0.14);
      color: var(--theme-accent-color, #7c3aed) !important;
    }
  }

  a {
    transition:
      transform 0.3s ease,
      background 0.3s ease,
      color 0.3s ease,
      box-shadow 0.3s ease;
    padding: 4px 10px;
    border-radius: 999px;
    transform: translateZ(24px) translateX(0) scale(1);

    &:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(236, 72, 153, 0.18) 100%);
      transform: translateZ(32px) translateX(6px) scale(1.03);
      box-shadow: 0 10px 18px rgba(99, 102, 241, 0.14);
      color: var(--theme-accent-color, #db2777) !important;
    }
  }
}

.info-clickable {
  cursor: pointer;
}

.pagination-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

/* 骨架屏占位样式 */
.article-skeleton {
  pointer-events: none;
  animation: skeleton-pulse 1.5s ease-in-out infinite;

  .article-cover {
    flex-shrink: 0;
    width: 140px;
    min-height: 140px;
    background: var(--skeleton-bg, rgba(148, 163, 184, 0.12));
    border-radius: 14px;
    overflow: hidden;

    .skeleton-media {
      width: 100%;
      height: 100%;
      background: var(--skeleton-bg, rgba(148, 163, 184, 0.12));
      border-radius: 14px;
    }
  }

  .skeleton-line {
    border-radius: 6px;
    background: var(--skeleton-line-bg, rgba(148, 163, 184, 0.18));
  }

  .skeleton-title {
    width: 70%;
    height: 20px;
    margin-bottom: 10px;
  }

  .skeleton-desc {
    width: 100%;
    height: 14px;
    margin-bottom: 8px;

    &--short {
      width: 55%;
    }
  }

  .skeleton-tags {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  .skeleton-tag {
    width: 48px;
    height: 22px;
    border-radius: 999px;
    background: var(--skeleton-line-bg, rgba(148, 163, 184, 0.18));
  }

  .skeleton-info {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    align-items: center;
  }

  .skeleton-dot {
    width: 32px;
    height: 14px;
    border-radius: 999px;
    background: var(--skeleton-line-bg, rgba(148, 163, 184, 0.14));
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .article-item,
  .article-item:hover,
  .article-media,
  .article-item:hover .article-media,
  .article-tag,
  .article-tag:hover,
  .info i,
  .info a {
    transform: none !important;
    transition: none !important;
  }

  .article-item::before {
    opacity: 0 !important;
  }

  .article-skeleton {
    animation: none;
  }
}

@keyframes rotateBorder {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.none-image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;

  .none-image-label {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
    padding: 2px 8px;
    font-size: 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    pointer-events: none;
  }
}
</style>
