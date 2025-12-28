import api from './base'

export default {
  // 获取系统信息
  getSystemInfo () {
    return api.get('/system_info')
  }
}
