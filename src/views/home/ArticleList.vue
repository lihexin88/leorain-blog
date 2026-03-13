<template>
  <div class="container list article-list-container" id="container-left">
    <div class="row">
      <div class="article-list">
        <el-card v-for="(article,index) in articles"
                 class="media article-item"
                 :key="index"
        >
            <div>
              <a v-if="article.page_image" class="article-item-link"
                 :title="article.slug"
                 @click="openArticle(article.slug)"
              >
                <!--             图片 -->
                <img v-if="mediaType(article.page_image) === 'image'" class="article-media" :alt="article.slug"
                     :src="article.is_zoom ? article.page_image+'?x-oss-process=style/page-image':article.page_image"
                     data-holder-rendered="true">
                <!--            视频-->
                <video v-else-if="mediaType(article.page_image) === 'video'" class="article-media" muted autoplay
                       playsinline="true" webkit-playsinline="true"
                       :src="article.page_image"></video>
              </a>
              <a v-else class="article-item-link"
                 @click="openArticle(article.slug)"
              >
                <img class="article-media" :alt="article.slug"
                     src="https://images.leorain.cn/icons/assets/pure_article.png"
                     data-holder-rendered="true">
              </a>
            </div>
            <div class="media-body article-body">
              <div class="media-heading" style="cursor: pointer"
              >
                <a @click="openArticle(article.slug)" :title="article.title"
                >
                 <span class="article-title">
                    {{ article.title }}
                </span>
                </a>
              </div>
              <div class="article-description" style="cursor: pointer"
                   :style="getTransform(index,'description')"
              >
                <div @click="openArticle(article.slug)" :title="article.slug"
                >
                  <span>
                    {{ article.meta_description ?? article.subtitle }}
                  </span>
                </div>
              </div>
              <div class="article-extra"
              >
                <div style="display: flex;flex-wrap: wrap;">
                  <el-tag v-for="(tag,index) in article.tags" class="article-tag" style="cursor: pointer" :key="index"
                          @click="open_tag(tag.tag)"
                          :title="tag.tag" type="info">{{
                      tag.tag
                    }}
                  </el-tag>
                </div>

                <div class="info" style="color: grey;font-size: .8em">
                  <i class="fas fa-user" @click="go_user(article.user.uid)" style="cursor: pointer">
                    {{ article.user.name ?? 'null' }}
                  </i>
                  <i :title=" moment(article.published_at).format('Y-M-D H:m:s')" :id="index" class="fas fa-clock">
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
      <div style="width: 100%;display: flex;justify-content: center;align-items: center;padding: 10px">
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
      rotations: [], // 用于存储每个元素的偏移量
      maxOffset: 15,
      total: null,
      per_page: 21,
      smallWindowSize: false,
      layout: null,
      articles: [],
      resetTimers: {},
      currentRotations: [],
      animationFrame: {} // 存储 requestAnimationFrame 句柄
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
          // 增加动画 - 更年轻化的动画效果
          anime({
            targets: '.article-item',
            scale: [0.8, 1],
            opacity: [0, 1],
            translateY: [30, 0],
            rotateZ: [5, 0],
            delay: anime.stagger(80, { easing: 'easeOutElastic(1, .6)' }),
            duration: 600,
            easing: 'easeOutElastic(1, .8)'
          })
          // 为内部元素添加延迟动画
          anime({
            targets: '.article-item-rotate',
            scale: [0.9, 1],
            opacity: [0, 1],
            delay: anime.stagger(80, { start: 200 }),
            duration: 400,
            easing: 'easeOutBack'
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
  }

  padding: 5px !important;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg,
      rgba(217, 214, 217, 0.55) 0%,
      rgba(173, 216, 230, 0.55) 50%,
      rgba(242, 214, 218, 0.55) 100%,
  );
  position: relative;
  overflow: hidden;

  // 添加动态渐变背景
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
            45deg,
            rgba(255, 105, 180, 0.1) 0%,
            rgba(135, 206, 250, 0.1) 25%,
            rgba(147, 112, 219, 0.1) 50%,
            rgba(255, 182, 193, 0.1) 75%,
            rgba(255, 105, 180, 0.1) 100%
    );
    background-size: 400% 400%;
    animation: gradientShift 8s ease infinite;
    opacity: 0;
    transition: opacity 0.5s ease;
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
  border: 2px solid #e7cfcfad;
  background-clip: padding-box;
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.1),
  0 2px 8px rgba(135, 206, 250, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
  background 0.4s ease,
  border-color 0.4s ease,
  box-shadow 0.4s ease,
  z-index 0s;
  will-change: transform, box-shadow;
  z-index: 1;
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
  transform: translateY(-8px) scale(1.02);
  background: linear-gradient(135deg,
      rgba(221, 160, 221, 0.25) 0%,
      rgba(173, 216, 230, 0.25) 50%,
      rgba(255, 182, 193, 0.25) 100%,
  );
  border-color: rgba(255, 105, 180, 0.3);
  z-index: 10;

  &::before {
    opacity: 1;
  }

  box-shadow: 0 12px 30px rgba(255, 105, 180, 0.25),
  0 8px 20px rgba(135, 206, 250, 0.2),
  0 4px 10px rgba(147, 112, 219, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
  border-radius: 10px;
  border: 2px solid rgba(240, 200, 200, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
  @media screen and (max-aspect-ratio: 1/1) {
    max-width: 1500px;
  }
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
  box-shadow 0.4s ease,
  border-color 0.4s ease;
  transform-origin: center;
  position: relative;
  z-index: 1;
  transform: scale(1) rotate(0deg);
}

.article-item:hover .article-media {
  transform: scale(1.08) rotate(2deg);
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.3),
  0 4px 12px rgba(135, 206, 250, 0.2),
  inset 0 1px 0 rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 105, 180, 0.5);
}

.article-title {
  position: relative;
  z-index: 1;
  font-size: 1.3em;
}

.article-body {
  margin: 2px;
  position: relative;
  z-index: 1;
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
  color: #6c757d;
  //height: 93px;
  overflow-y: hidden;
  display: flex;
  align-items: flex-end;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;

  &:hover {
    color: #495057;
  }
}

.article-extra {
  margin-top: 5px;
  margin-bottom: 5px;
  position: relative;
  z-index: 1;
}

.article-tag {
  margin-right: 5px;
  margin-bottom: 5px;
  border-radius: 20px;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(173, 216, 230, 0.3) 100%);
  border: 1px solid rgba(255, 105, 180, 0.2);
  color: #6c757d;
  font-weight: 500;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
  background 0.3s ease,
  border-color 0.3s ease,
  box-shadow 0.3s ease,
  color 0.3s ease;
  position: relative;
  overflow: hidden;
  transform: scale(1) translateY(0);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    transform: scale(1.1) translateY(-2px);
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.4) 0%, rgba(135, 206, 250, 0.4) 100%);
    border-color: rgba(255, 105, 180, 0.5);
    box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3),
    0 2px 6px rgba(135, 206, 250, 0.2);
    color: #495057;

    &::before {
      left: 100%;
    }
  }
}

.article-item:hover {
  scale: 1.02;
  transition: scale 0.5s ease-in-out;
}

:deep(.el-card__body) {
  padding: 10px;
  width: 100%;
  height: 100%;
  background: transparent;
}

// 添加信息图标的动画
.info {
  i {
    transition: transform 0.3s ease,
    background 0.3s ease,
    color 0.3s ease;
    padding: 2px 4px;
    border-radius: 4px;
    transform: scale(1);

    &:hover {
      background: linear-gradient(135deg, rgba(255, 182, 193, 0.2) 0%, rgba(173, 216, 230, 0.2) 100%);
      transform: scale(1.1);
      color: #ff6b9d !important;
    }
  }

  a {
    transition: transform 0.3s ease,
    background 0.3s ease,
    color 0.3s ease;
    padding: 2px 8px;
    border-radius: 6px;
    transform: translateX(0) scale(1);

    &:hover {
      background: linear-gradient(135deg, rgba(255, 105, 180, 0.2) 0%, rgba(135, 206, 250, 0.2) 100%);
      transform: translateX(5px) scale(1.05);
      color: #ff1493 !important;
    }
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
