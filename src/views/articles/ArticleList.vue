<template>
  <div class="article-list-container">
    <h2>文章列表</h2>
    <div class="articles">
      <p>这里是文章列表页面的内容。</p>
      <!-- 可以在这里添加更多内容 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArticleList',
  data () {
    return {
      // 数据属性
    }
  },
  methods: {
    // 方法
  }
}
</script>

<style scoped>
.article-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.articles {
  margin-top: 2rem;
}
</style>
