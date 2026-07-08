import api from './base'

// 请求日志相关 API
const requestLogApi = {
  // 获取请求日志列表（分页）
  getRequestLogs (params) {
    const url = (import.meta.env.VITE_TOOL_HOST || '') + '/request/log'
    return api.get(url, { params })
  }
}

export default requestLogApi
