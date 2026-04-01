<template>
  <div class="container list article-list-container" id="container-left">
    <div class="row">
      <div class="article-list">
        <el-card v-for="(article, index) in articles"
                 class="media article-item"
                 :style="getCardStyle(index)"
                 :key="index"
                 @mousemove="handleCardMove($event, index)"
                 @mouseleave="resetCardTransform(index)"
        >
          <div class="article-card-glow"></div>
          <div class="article-card-grid"></div>
          <div class="article-card-shine"></div>
          <div>
            <a v-if="article.page_image" class="article-item-link"
               :title="article.slug"
               @click="openArticle(article.slug)"
            >
              <!--             图片 -->
              <img v-if="mediaType(article.page_image) === 'image'" class="article-media" :alt="article.slug"
                   :src="article.is_zoom ? article.page_image + '?x-oss-process=style/page-image' : article.page_image"
                   data-holder-rendered="true">
              <!--            视频-->
              <video v-else-if="mediaType(article.page_image) === 'video'" class="article-media" muted autoplay
                     playsinline="true" webkit-playsinline="true"
                     :src="article.page_image"></video>
            </a>
            <a v-else class="article-item-link"
               @click="openArticle(article.slug)"
            >
              <img v-if="article.page_image !== undefined" class="article-media" :alt="article.slug"
                   src="https://images.leorain.cn/icons/assets/pure_article.png"
                   data-holder-rendered="true">
            </a>
          </div>
          <div class="media-body article-body">
            <div class="media-heading" style="cursor: pointer">
              <a @click="openArticle(article.slug)" :title="article.title">
                <span class="article-title">
                  {{ article.title }}
                </span>
              </a>
            </div>
            <div class="article-description" style="cursor: pointer"
                 :style="getTransform(index, 'description')"
            >
              <div @click="openArticle(article.slug)" :title="article.slug">
                <span>
                  {{ article.meta_description ?? article.subtitle }}
                </span>
              </div>
            </div>
            <div class="article-extra">
              <div style="display: flex; flex-wrap: wrap;">
                <el-tag v-for="(tag, index) in article.tags" class="article-tag" style="cursor: pointer" :key="index"
                        @click="open_tag(tag.tag)"
                        :title="tag.tag" type="info">
                  {{
                    tag.tag
                  }}
                </el-tag>
              </div>

              <div class="info" style="color: grey; font-size: .8em">
                <i class="fas fa-user" @click="go_user(article.user.uid)" style="cursor: pointer">
                  {{ article.user.name ?? 'null' }}
                </i>
                <i :title="moment(article.published_at).format('Y-M-D H:m:s')" :id="index" class="fas fa-clock">
                  {{ getFriendlyDate(moment(article.published_at).format("Y-M-D H:m:s")) }}
                </i>
                <i class="fas fa-eye">
                  {{ article.view_count }}
                </i>
                <i class="fas fa-comments">
                  {{ article.comments_count }}
                </i>
                <a @click="openArticle(article.slug)" class="float-right" style="cursor: pointer"
                   :title="article.slug">
                  More
                  <i class="fas fa-chevron-right"></i>
                </a>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 10px">
        <el-pagination
            v-model:page-size="per_page"
            :page-sizes="[18, 21, 36]"
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
import {
  getFriendlyDate,
  mediaType,
  paginateLayouts,
  syncUrlPaginate
} from '@/utils/helpers'
import moment from 'moment'
import anime from 'animejs'
import { articleApi } from '@/apis'

export default {
  computed: {
    moment () {
      return moment
    }
  },
  props: {},
  data () {
    return {
      page: 1,
      activeIndex: -1,
      total: null,
      per_page: 21,
      smallWindowSize: false,
      layout: null,
      articles: [],
      currentRotations: []
    }
  },
  methods: {
    paginateLayouts,
    getFriendlyDate,
    mediaType,
    syncUrlPaginate,
    getTransform (index, type) {
      const rotation = this.currentRotations[index] || { x: 0, y: 0 }
      const move = this.currentRotations[index] || { x: 0, y: 0 }

      let moveX = move.x
      let moveY = move.y
      let transform = `transform: perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`

      if (type) {
        if (type === 'image') {
          moveX *= 1.5 // 图片移动更明显
          moveY *= 1.5
        } else if (type === 'title') {
          moveX *= 0.5 // 标题移动较小
          moveY *= 0.5
        } else if (type === 'description') {
          moveX *= 0.7 // 描述稍微偏移
          moveY *= 0.7
        } else if (type === 'footer') {
          moveX *= 0.9 // 描述稍微偏移
          moveY *= 0.9
        }
        transform += ` translate(${moveX}px, ${moveY}px);`
      }
      return transform
    },
    getCardStyle (index) {
      const rotation = this.currentRotations[index] || { x: 0, y: 0 }
      return {
        transform: `perspective(1200px) translateY(0) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        willChange: 'transform',
        '--card-rotate-x': `${rotation.x}deg`,
        '--card-rotate-y': `${rotation.y}deg`
      }
    },
    handleCardMove (event, index) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }
      const rect = event.currentTarget.getBoundingClientRect()
      const offsetX = (event.clientX - rect.left) / rect.width
      const offsetY = (event.clientY - rect.top) / rect.height
      const rotateY = (offsetX - 0.5) * 8
      const rotateX = (0.5 - offsetY) * 8
      this.currentRotations.splice(index, 1, {
        x: Number(rotateX.toFixed(2)),
        y: Number(rotateY.toFixed(2))
      })
    },
    resetCardTransform (index) {
      this.currentRotations.splice(index, 1, { x: 0, y: 0 })
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
    load () {
      articleApi.getArticles({
        page: this.page,
        per_page: this.per_page
      }).then((response) => {
        this.articles = response.data
        this.currentRotations = response.data.map(() => ({ x: 0, y: 0 }))
        this.total = response.total
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
    // 如果是竖屏，设置windowSize为6
    this.smallWindowSize = articlePaginateLayouts.smallWindowSize
    this.layout = articlePaginateLayouts.layout
    // 加载首页数据
    this.load()
  }
}
</script>
<style scoped lang="scss">

.article-list-container {
  padding-top: 10px;
  width: 100%;
  max-width: 100%;
}

@media screen and (max-aspect-ratio: 1/.7) {
  .article-list-container {
    padding-left: 3px !important;
    padding-right: 3px !important;
  }
}

.article-body {
  font-size: 1em;
  max-height: 100%;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-left: 8%;
  padding-right: 2%;
  padding-top: 20px;
  @media screen and (max-aspect-ratio: 1/1) {
    padding: 5px !important;
    grid-template-columns: 1fr;
  }
}

.article-list:last-child {
  justify-content: start;
}

.article-item {
  :deep(.el-card__body) {
    overflow: hidden;
    border-radius: 15px;
    background-color: rgb(255 255 255 / 0.81);
  }

  padding: 5px !important;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  backdrop-filter: blur(16px);
  background: linear-gradient(145deg,
      rgba(255, 255, 255, 0.72) 0%,
      rgba(228, 240, 255, 0.58) 42%,
      rgba(247, 225, 239, 0.6) 100%,
  );
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transform-style: preserve-3d;

  &::before {
    content: '';
    position: absolute;
    inset: -35%;
    background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 28%,
            rgba(255, 255, 255, 0.3) 48%,
            rgba(255, 255, 255, 0) 68%
    );
    transform: translateX(-120%) skewX(-20deg);
    opacity: 0;
    transition: transform 0.8s ease, opacity 0.8s ease;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 36%),
      radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.18), transparent 34%);
    opacity: 0.85;
    z-index: 0;
  }

  @media screen and (max-aspect-ratio: 1/.7) {
    width: 100%;
    padding: 5px !important;
    height: auto !important;
    display: block;
    margin-right: 5px;
    margin-left: 5px;
  }
  border: 1px solid rgba(255, 255, 255, 0.55);
  background-clip: padding-box;
  margin: 0;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12),
  0 16px 34px rgba(15, 23, 42, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: transform 0.35s ease,
  background 0.35s ease,
  border-color 0.35s ease,
  box-shadow 0.35s ease;
  will-change: transform, box-shadow;
  z-index: 1;
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
  opacity: 0.9;
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
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.article-item:hover {
  transform: perspective(1200px) translateY(-12px) rotateX(var(--card-rotate-x, 0deg)) rotateY(var(--card-rotate-y, 0deg)) !important;
  background: linear-gradient(145deg,
      rgba(255, 255, 255, 0.84) 0%,
      rgba(224, 236, 255, 0.72) 42%,
      rgba(253, 232, 243, 0.72) 100%,
  );
  border-color: rgba(255, 255, 255, 0.82);
  z-index: 10;

  &::before {
    opacity: 1;
    transform: translateX(120%) skewX(-20deg);
  }

  box-shadow: 0 22px 48px rgba(99, 102, 241, 0.2),
  0 24px 60px rgba(15, 23, 42, 0.16),
  0 0 28px rgba(236, 72, 153, 0.12),
  inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.article-item:hover .article-card-glow {
  opacity: 1;
}

.article-item:hover .article-card-grid {
  opacity: 0.3;
}

.article-item:hover .article-card-shine {
  box-shadow: 0 0 24px rgba(255, 255, 255, 0.5);
}

.article-item-link {
  display: flex;
  padding: 5px !important;
  justify-content: center;
  width: 200px;
  margin: auto;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transform-style: preserve-3d;
  @media screen and (max-aspect-ratio: 1/1) {
    display: block;
    width: 100%;
  }
}

.article-media {
  width: 100%;
  max-width: 200px;
  max-height: 190px;
  height: 100%;
  object-fit: contain;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.66);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.12),
  0 12px 20px rgba(15, 23, 42, 0.08),
  inset 0 1px 0 rgba(255, 255, 255, 0.38);
  @media screen and (max-aspect-ratio: 1/1) {
    max-width: 1500px;
  }
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
  box-shadow 0.4s ease,
  border-color 0.4s ease,
  filter 0.4s ease;
  transform-origin: center;
  position: relative;
  z-index: 1;
  transform: translateZ(26px) scale(1) rotate(0deg);
}

.article-item:hover .article-media {
  transform: translateZ(42px) scale(1.08) rotate(1.6deg);
  box-shadow: 0 18px 34px rgba(99, 102, 241, 0.24),
  0 8px 20px rgba(236, 72, 153, 0.16),
  inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.88);
  filter: saturate(1.08);
}

.article-title {
  position: relative;
  z-index: 1;
  font-size: 1.3em;
  display: inline-block;
  transform: translateZ(26px);
  text-shadow: 0 8px 22px rgba(99, 102, 241, 0.08);
}

.article-body {
  margin: 2px;
  position: relative;
  z-index: 1;
  transform-style: preserve-3d;
  @media screen and (max-aspect-ratio: 1/1) {
    width: 100%;
    padding-top: 5px;
  }
}

.article-description {
  margin-top: .6em;
  font-size: .8em;
  height: 40px;
  line-height: 1.4285em;
  color: #5b6476;
  overflow-y: hidden;
  display: flex;
  align-items: flex-end;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease, text-shadow 0.3s ease;
  transform: translateZ(18px);

  &:hover {
    color: #364152;
    text-shadow: 0 6px 16px rgba(99, 102, 241, 0.08);
  }
}

.article-extra {
  margin-top: 5px;
  margin-bottom: 5px;
  position: relative;
  z-index: 1;
  transform: translateZ(18px);
}

.article-tag {
  margin-right: 5px;
  margin-bottom: 5px;
  border-radius: 999px;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22) 0%, rgba(96, 165, 250, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.42);
  color: #4b5563;
  font-weight: 500;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
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
    border-color: rgba(255, 255, 255, 0.72);
    box-shadow: 0 8px 18px rgba(99, 102, 241, 0.16),
    0 4px 10px rgba(236, 72, 153, 0.12);
    color: #7c3aed !important;
  }
}

:deep(.el-card__body) {
  padding: 12px;
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

// 添加信息图标的动画
.info {
  i {
    transition: transform 0.3s ease,
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
      color: #7c3aed !important;
    }
  }

  a {
    transition: transform 0.3s ease,
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
      color: #db2777 !important;
    }
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
}

// 添加加载动画增强
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

.article-item {
  animation: slideInUp 0.6s ease-out backwards;

  @for $i from 1 through 50 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}
</style>
