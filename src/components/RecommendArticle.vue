<template>
  <div style="display: flex;justify-content: center">
    <div>
      <el-card>
        <template v-slot:header>
          <div class="clearfix">
            <span style="font-size: 1.05em"><b>推荐文章</b></span>
            <span ><i>使用余弦向量算法进行推荐(分数)</i></span>
          </div>
        </template>

        <div class="recommend-article-box" v-for="(article,index) in articles" :key="index">
          <div class="recommend-article-item">
            <div class="recommend-article-container" @click="open_article(article.slug)">
              <div class="recommend-article-title">
                {{ maxString(article.title, 48) }}
              </div>
              <div>
                <div class="recommend-article-description">
                  {{ maxString(article.meta_description ?? article.title, 150) }}
                </div>
              </div>
              <div style="display: flex;justify-content: flex-start">
                <div class="recommend-article-tips">
                  <el-link :href="`/user/profile?uid=` + article.user.name">
                    <i class="fa fa-user"></i>{{ article.user.name }}
                  </el-link>
                </div>
                <div class="recommend-article-tips">
                  <i class="fa fa-comment"></i>{{ article.comments_count }}
                </div>
                <div class="recommend-article-tips">
                  <i class="fa fa-clock"></i>{{ article.published_at }}
                </div>
              </div>
            </div>
            <div style="position: absolute;right: 30px;">
              ≈ {{ ((1 - article.score.slice(0, 6)) * 100).toFixed(4) }}
            </div>
          </div>
          <el-divider></el-divider>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { maxString } from '@/utils/helpers'
import { articleApi } from '@/apis'

export default {
  props: {
    query: {
      type: String,
      default: null
    },
    article_id: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      articles: []
    }
  },
  methods: {
    maxString,
    getRecommendArticles () {
      articleApi.getRecommendArticles({
        query: this.query,
        article_id: this.article_id
      }).then(res => {
        this.articles = res
      })
    },
    open_article (slug) {
      this.$router.push({ name: 'article', params: { slug } })
    }
  },
  mounted () {
    this.getRecommendArticles()
  }
}
</script>
<style scoped lang="scss">
:deep(.el-divider--horizontal) {
  margin: 12px 0;
}

:deep(.el-card__body) {
  padding: 10px;
}

.recommend-article-tips {
  padding-right: 5px;
}

.recommend-article-container {
  cursor: pointer;
}

.recommend-article-description {
  font-size: 0.9em;
  color: #909399
}

.recommend-article-item {
  width: 82%;
  display: flex;
}

.recommend-article-box {
  padding: 10px;
}

.recommend-article-box:hover {
  background-color: rgba(231, 239, 241, 0.34);
}

.recommend-article-container:hover {
  transform: scale(1.03);
}

:deep(.el-card__body) {
  padding: 0 !important;
}
</style>
