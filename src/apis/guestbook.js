import api from './base'

export default {
  // 获取评论
  getGuestbooks (params) {
    const url = 'guestbooks/'
    return api.get(url, { params })
  },
  getGuestbookDetail (id) {
    return api.get(`/guestbooks/${id}`)
  },
  // 提交留言
  createGuestbook (data) {
    return api.post('/guestbooks', data)
  },
  // 提交已授权留言
  createAuthorizedGuestbook (data) {
    return api.post('/guestbooks/authorized', data)
  },
  // 删除留言
  deleteGuestbook (id) {
    return api.delete(`/guestbooks/${id}`)
  }
}
