<template>
  <div class="article-box">
    <div class="article-page-left">
      <article-contents ref="articleContent"></article-contents>
    </div>
    <div class="article-container">
      <!-- 文章顶部 -->
      <header class="article-header">
        <div class="article-cover" v-if="article.page_image">
          <video
              v-if="isVideo(article.page_image)"
              class="article-cover-media"
              loop
              muted
              autoplay
          >
            <source :src="article.page_image" type="video/mp4">
            您的浏览器不支持视频标签。
          </video>
          <el-image
              v-else
              class="article-cover-media"
              fit="cover"
              :preview-src-list="[article.page_image]"
              :close-on-press-escape="true"
              :hideOnClickModal="true"
              :src="article.page_image"
          ></el-image>
        </div>
        <div class="article-header-info">
          <h4 class="article-title">{{ article.title }}</h4>
          <p class="article-subtitle" v-if="article.subtitle">{{ article.subtitle }}</p>
          <div class="article-meta">
            <router-link
                :to="`/user/profile?uid=${article.user?.uid}`"
                class="meta-item author-link"
            >
              <i class="fas fa-user"></i>
              <span>{{ article.user?.name ?? 'null' }}</span>
            </router-link>
            <span class="meta-dot" aria-hidden="true">·</span>
            <span class="meta-item">
              <el-icon><Clock/></el-icon>
              <span>{{ formatDate(article.published_at) }}</span>
            </span>
            <span class="meta-dot" aria-hidden="true">·</span>
            <el-link
                :href="`#article-comment-area`"
                class="meta-item comment-link"
                :underline="false"
            >
              <el-icon><Comment/></el-icon>
              <span>{{ article.comment_count ?? 0 }}</span>
            </el-link>
            <span class="meta-dot" aria-hidden="true">·</span>
            <span class="meta-item">
              <i class="fas fa-book-open"></i>
              <span>{{ wordCount }} 字 / {{ readingTime }} 分钟</span>
            </span>
          </div>
          <div class="article-tags" v-if="article.tags && article.tags.length">
            <router-link
                v-for="(tag, index) in article.tags"
                :key="index"
                :to="`/tag/${tag.tag}`"
                class="tag-pill"
            >
              # {{ tag.tag }}
            </router-link>
          </div>
        </div>
      </header>
      <div class="article container">
        <a
            v-if="article.id && userInfo.is_admin === 1"
            class="article-edit-link"
            :href="`${apiHost}/dashboard/articles/${article.id}/edit`"
            target="_blank"
            rel="noopener noreferrer"
        >
          [编辑]
        </a>
        <div class="row container-text-overflow-wrap article-content-container">
          <div class="article-content">
            <div v-if="article.is_markdown">
              <parse class="article-parser" v-if="article.content" id="article-show-content" :content="article.content"></parse>
            </div>
            <div v-else id="article-show-content" v-html="article.content"></div>
            <div class="offset-lg-1">
              <div class="content article-tips">
                <em v-if="article.is_original">本文为原创文章</em>
                <i>以上就是本文的全部内容啦，有什么疑问欢迎在下方评论区留言嗷，收到通知会及时回复~</i>
              </div>
              <div class="content article-tips">
                <i>本文已被浏览: {{ article.visitors ?? 0 }}</i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="article-comment-area">
        <comment-area
            title="评论"
            :uid="article.user?.uid"
            :email-hash="article.user?.email_hash"
            :user-id="article.user?.uid"
            commentable-type="articles"
            :commentable-id="article.id"
            :can-comment="true"
            v-if="article.id"
        ></comment-area>
      </div>
    </div>
    <div class="article-page-right">
      <recommend-article ref="recommendArticle" v-if="article.title" :query="article.title" :article_id="article.id"></recommend-article>
    </div>
  </div>
</template>

<script>
import ArticleContents from '@/components/ArticleContents.vue'
import MarkdownParse from '@/components/MarkdownParse.vue'
import CommentArea from '@/components/CommentArea.vue'
import RecommendArticle from '@/components/RecommendArticle.vue'
import { useConfigStore } from '@/store/config'
import moment from 'moment'
import { articleApi } from '@/apis'
import { Clock, Comment } from '@element-plus/icons-vue'
import { mapState } from 'pinia'
import { useUserStore } from '@/store/user'

export default {
  name: 'ArticleDetail',
  tdk () {
    return {
      title: this.article.title ? `${this.article.title}` : '文章详情',
      description: this.article.subtitle || (this.article.content ? this.article.content.substring(0, 100) : ''),
      keywords: this.article.tags ? this.article.tags.map(t => t.tag).join(',') : ''
    }
  },
  computed: {
    ...mapState(useUserStore, { userInfo: 'user' }),
    apiHost () {
      return process.env.API_HOST || ''
    }
  },
  components: {
    Comment,
    Clock,
    ArticleContents,
    Parse: MarkdownParse,
    CommentArea,
    RecommendArticle
  },
  data () {
    return {
      fetchTimer: null,
      article: {
        id: 0,
        title: '',
        subtitle: '',
        content: '',
        user: {
          name: '',
          avatar: '',
          email_hash: ''
        },
        tags: [],
        published_at: '',
        comments_count: 0,
        page_image: '',
        is_markdown: true,
        is_original: true,
        view_count: 0
      },
      user: null,
      wordCount: 0,
      readingTime: 0,
      slug: null
    }
  },
  setup () {
    const configStore = useConfigStore()

    const isVideo = (url) => {
      if (!url) return false
      const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov']
      const extension = url.split('.').pop().toLowerCase()
      return videoExtensions.includes(extension)
    }

    return {
      configStore,
      isVideo
    }
  },
  methods: {
    async fetchArticle () {
      // 这里应该调用API获取文章详情
      try {
        // const articleId = this.$route.params.id
        // const response = await articleApi.getArticle(articleId)
        // this.article = response.data
        await articleApi.getArticleDetail(this.slug).then((response) => {
          this.article = response.data
          // 使用setTimeout确保DOM完全渲染完成
          this.fetchTimer = setTimeout(() => {
            this.$refs.articleContent?.init()
            // 计算字数和阅读时间
            this.calculateWordCount()
          }, 500) // 延迟500毫秒确保渲染完成
        })
      } catch (error) {
        console.error('获取文章详情失败:', error)
      }
    },

    calculateWordCount () {
      const content = this.article.is_markdown
        ? this.article.content
        : this.stripHtmlTags(this.article.content || '')

      this.wordCount = content?.length || 0
      this.readingTime = Math.ceil(this.wordCount / 500)
    },

    stripHtmlTags (html) {
      return html.replace(/<[^>]*>/g, '')
    },

    formatDate (date) {
      return moment(date).format('YYYY-MM-DD HH:mm')
    },

    async fetchUser () {
      // 这里应该调用API获取用户信息
      // 临时模拟数据
      this.user = {
        name: '当前用户',
        avatar: '/current-user-avatar.png',
        email_hash: 'def456',
        uid: '2'
      }
    }
  },

  mounted () {
    this.slug = this.$route.params.slug
    this.fetchArticle()
    this.fetchUser()
    this.configStore.fetchConfigs()
  },
  watch: {
    '$route.params.slug': {
      handler (newSlug) {
        if (newSlug) {
          this.article.id = null
          this.slug = newSlug
          this.fetchArticle()
          this.$refs.recommendArticle.getRecommendArticles()
        }
      }
    }
  },
  beforeUnmount () {
    if (this.fetchTimer) {
      clearTimeout(this.fetchTimer)
    }
  }
}
</script>

<style lang="scss" scoped>

.article-box {
  display: flex;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.article-page-left {
  max-width: 500px;
  width: 20%;
  margin-right: 20px;
  position: sticky;
  top: 60px;
  height: fit-content;
  align-self: flex-start;
}

.article-container {
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  padding: 20px;
  background-color: var(--article-item-bg, rgba(255, 255, 255, 1));
  color: var(--card-text-color, #111827);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.article-page-right {
  max-width: 500px;
  margin-left: 20px;
}

.article-page-video {
  border-radius: 4px;
  object-fit: contain;
}

.article-header {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 8px 4px 20px;
  border-bottom: 1px solid currentColor;
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

.article-cover {
  flex: 0 0 auto;
}

.article-cover-media {
  display: block;
  width: 168px;
  height: 168px;
  border-radius: 12px;
  overflow: hidden;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.article-header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article-title {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.01em;
  word-break: break-word;
}

.article-subtitle {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 400;
  line-height: 1.5;
  opacity: 0.7;
  word-break: break-word;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: 0.88rem;
  line-height: 1.5;
  opacity: 0.7;
}

.article-meta .meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: inherit;
  text-decoration: none;
}

.article-meta .meta-dot {
  user-select: none;
  opacity: 0.5;
}

.article-meta .el-icon {
  font-size: 0.95em;
}

.author-link,
.comment-link {
  color: inherit;
}

.author-link:hover,
.comment-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 0.8rem;
  line-height: 1.6;
  color: inherit;
  background-color: rgba(127, 127, 127, 0.12);
  border-radius: 999px;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.tag-pill:hover {
  background-color: rgba(127, 127, 127, 0.22);
  transform: translateY(-1px);
}

.article.container {
  position: relative;
}

.article-edit-link {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 0.9rem;
  color: rgb(17, 59, 85);
  text-decoration: none;
  z-index: 1;
}

.article-edit-link:hover {
  text-decoration: underline;
}

.article-content-container {
  margin-top: 20px;
}

.article-content {
  line-height: 1.6;
}

.article-tips {
  margin-top: 20px;
  padding: 10px;
  background-color: rgba(240, 240, 240, 0.5);
  border-radius: 4px;
}

.footing {
  margin-top: 20px;
  text-align: center;
}

.container-text-overflow-wrap {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式设计 */
@include mobile {
  .article-box {
    flex-direction: column;
    padding: 5px;
  }

  .article-page-right {
    flex: none;
    width: 100%;
    margin: 10px 0;
  }
  .article-page-left {
    display: none;
  }

  .article-container {
    padding: 14px;
  }

  .article-header {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    gap: 14px;
    padding: 4px 0 14px;
  }

  .article-cover {
    align-self: center;
  }

  .article-cover-media {
    width: 132px;
    height: 132px;
    border-radius: 10px;
  }

  .article-header-info {
    gap: 8px;
  }

  .article-title {
    font-size: 1.35rem;
    line-height: 1.35;
  }

  .article-subtitle {
    font-size: 0.95rem;
  }

  .article-meta {
    font-size: 0.82rem;
    gap: 4px 8px;
  }

  .article-meta .meta-dot {
    display: none;
  }

  .tag-pill {
    font-size: 0.75rem;
    padding: 1px 8px;
  }

  .article-edit-link {
    top: 6px;
    right: 8px;
    font-size: 0.82rem;
  }
}

:deep(.markdown) {
  background-color: rgb(0 0 0 / 0);
  img {
    max-width: 100%;
    cursor: pointer;
    transition: all .3s ease-in-out;
    &:hover{
      scale: 1.02;
    }
  }

  video {
    max-width: 100%;
    cursor: pointer;
    transition: all .3s ease-in-out;
    &:hover{
      scale: 1.02;
    }
  }
}
</style>
