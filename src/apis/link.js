import api from './base'

export default {
  // 获取分类列表
  getLinks () {
    return api.get('/link')
  },
  // 记录链接访问/预览（后端用于统计）
  visitLink (id) {
    return api.get(`/link/${id}`)
  }
}
