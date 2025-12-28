import api from './base'

export default {
  // 获取文章列表
  getArticles (params) {
    return api.get('/articles', { params })
  },

  // 获取文章详情
  getArticleDetail (slug) {
    return api.get(`/articles/${slug}`)
  }
}
