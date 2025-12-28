import api from './base'

export default {
  // 获取自定义表情包
  getEmojiData (params) {
    return api.get('/custom_emojis', { params })
  }
}
