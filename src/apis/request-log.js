import api from './base'

// 请求日志相关 API
const requestLogApi = {
  // 获取请求日志列表（分页）
  getRequestLogs (params) {
    const url = (process.env.DRAW_WS_HOST || '') + '/request/log'
    return api.get(url, { params })
  }
}

export default requestLogApi
