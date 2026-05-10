<template>
  <div class="article-box">
    <div class="article-page-left">
      <article-contents ref="articleContent"></article-contents>
    </div>
    <div class="article-container">
      <!-- 文章顶部 -->
      <div class="article-header-container">
        <div class="text-center" id="page-image" v-if="article.page_image">
          <video
              v-if="isVideo(article.page_image)"
              class="article-page-video"
              loop
              muted
              autoplay
              style="max-width: 200px; max-height: 200px"
          >
            <source :src="article.page_image" type="video/mp4">
            您的浏览器不支持视频标签。
          </video>
          <el-image
              v-else
              fit="contain"
              :preview-src-list="[article.page_image]"
              :close-on-press-escape="true"
              :hideOnClickModal="true"
              style="max-width: 200px; max-height: 200px"
              :src="article.page_image"
          ></el-image>
        </div>
        <div class="article-title-box">
          <div>
            <h4>{{ article.title }}</h4>
            <h6>{{ article.subtitle }}</h6>
            <div class="header">
              <router-link :to="`/user/profile?uid=${article.user?.name}`" class="author-link">
                <i class="fas fa-user"></i>{{ article.user?.name ?? 'null' }}
              </router-link>
              <template v-if="article.tags && article.tags.length">
                <i class="fas fa-tags"></i>
                <router-link
                    v-for="(tag, index) in article.tags"
                    :key="index"
                    :to="`/tag/${tag.tag}`"
                    class="tag-link"
                >
                  {{ tag.tag }}
                </router-link>
              </template>
            </div>
          </div>
          <div>
            <div>
              <el-icon>
                <Clock/>
              </el-icon>
              {{ formatDate(article.published_at) }}
              <el-link :href="`#article-comment-area`" class="comment-link">
                <el-icon>
                  <Clock/>
                </el-icon>
                {{ article.comment_count ?? 0 }}
              </el-link>
            </div>
          </div>
          <div>
            本文 <b>{{ wordCount }}</b> 个字，阅读需要大约
            <b>{{ readingTime }}</b> 分钟
          </div>
        </div>
      </div>
      <div class="article container">
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
                <i>本文已被浏览: {{ article.visitors ?? 0 }} (有延迟)</i>
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
import { Clock } from '@element-plus/icons-vue'

export default {
  name: 'ArticleDetail',
  tdk () {
    return {
      title: this.article.title ? `${this.article.title}` : '文章详情',
      description: this.article.subtitle || (this.article.content ? this.article.content.substring(0, 100) : ''),
      keywords: this.article.tags ? this.article.tags.map(t => t.tag).join(',') : ''
    }
  },
  components: {
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
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
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

.article-header-container {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  gap: 10px;
  align-items: center;
}

.article-title-box {
  width: 100%;
}

.article-title-box h4 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.article-title-box h6 {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1rem;
}

.author-link, .tag-link, .comment-link {
  color: rgb(17, 59, 85);
  text-decoration: none;
  margin-right: 10px;
}

.author-link:hover, .tag-link:hover, .comment-link:hover {
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

#page-image {
  margin-top: 20px;
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
