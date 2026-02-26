import api from './base'

const userApi = {
  getUserInfo () {
    return api.get('/user/info')
  },
  getUserByUid (uid) {
    return api.get(`/user/${uid}`)
  },
  getUserItems (params) {
    return api.get('/user-items', { params })
  },
  exchangeUserItem (userItemId) {
    return api.post(`/user-items/${userItemId}`)
  },
  getUserItemDetail (userItemId, params) {
    return api.get(`/user-items/${userItemId}`, { params })
  }
}

export default userApi
