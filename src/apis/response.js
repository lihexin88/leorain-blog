import api from './base'

// 前端缓存相关接口
export default {
  // 清除缓存
  clearCache () {
    // baseURL 为 /api/frontend，此处仅需写相对路径
    return api.post('/response/clear', { withCredentials: true })
  }
}
