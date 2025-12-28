import api from './base'

export default {
  // 获取分类列表
  getCategories () {
    return api.get('/categories')
  }
}
