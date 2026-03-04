import api from './base'

export default {
  // 获取话题列表
  getTopics (params) {
    return api.get('topic', { params })
  },
  // 获取话题详情
  getTopicDetail (slug) {
    // 明确使用绝对路径以满足接口地址要求：/api/frontend/topic/{slug}
    return api.get(`/api/frontend/topic/${slug}`)
  },
  // 提交话题答案
  submitTopicAnswers (slug, answers) {
    return api.patch(`topic/${slug}/submit`, { answers })
  }
}
