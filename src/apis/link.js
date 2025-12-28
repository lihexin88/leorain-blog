import api from './base'

export default {
  // 获取分类列表
  getLinks () {
    return api.get('/link')
  }
}
