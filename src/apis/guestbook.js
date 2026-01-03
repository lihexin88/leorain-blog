import api from './base'

export default {
  // 获取评论
  getGuestbooks (params) {
    const url = 'guestbooks/'
    return api.get(url, { params })
  },
  getGuestbookDetail (id) {
    return api.get(`/guestbooks/${id}`)
  }
}
