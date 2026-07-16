import api from './base'

const oauthApi = {
  /**
   * 获取授权信息 / 自动完成授权
   * @param {Object} params client_id, redirect_uri, response_type, scope, state, prompt
   */
  authorize (params) {
    return api.get('/oauth/authorize', {
      params,
      // 需要携带 session cookie，供 approve/deny 使用
      withCredentials: true
    })
  },

  /**
   * 同意授权
   */
  approve (data) {
    return api.post('/oauth/authorize', data, {
      withCredentials: true
    })
  },

  /**
   * 拒绝授权
   */
  deny (data) {
    return api.delete('/oauth/authorize', {
      data,
      withCredentials: true
    })
  }
}

export default oauthApi
