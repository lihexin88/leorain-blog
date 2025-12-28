import api from './base'

export default {
  // 获取配置信息
  getConfigs () {
    return api.get('/configs')
  }
}
