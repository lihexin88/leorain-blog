import api from './base'

const userApi = {
  getUserInfo () {
    return api.get('/user/info')
  }
}

export default userApi
