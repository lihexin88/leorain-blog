import api from './base'

export default {
  // 获取标签列表
  getTags () {
    return api.get('/tags')
  }
}
