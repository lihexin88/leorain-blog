import api from './base'

export default {
  // 获取git记录
  getGitLogs (params) {
    return api.get('/git_logs', { params })
  }
}
