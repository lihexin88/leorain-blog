import api from './base'

export default {
  // 获取评论
  getComments (params) {
    const url = 'commentable/' + params.commentable_id + '/comment'
    return api.get(url, { params })
  }
}
