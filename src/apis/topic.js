import api from './base'

export default {
  // 获取话题列表
  getTopics (params) {
    return api.get('topic', { params })
  },
  // 提交话题答案
  submitTopicAnswers (slug, answers) {
    return api.patch(`topic/${slug}/submit`, { answers })
  }
}
