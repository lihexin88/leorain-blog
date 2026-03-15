import api from './base'

export default {
  // 获取评论
  getComments (params) {
    const url = 'commentable/' + params.commentable_id + '/comment'
    return api.get(url, { params })
  },
  // 创建评论
  createComment (data) {
    return api.post('/api/comments', data)
  },
  // 删除评论
  deleteComment (id) {
    return api.delete('/api/comments/' + id)
  }
}
