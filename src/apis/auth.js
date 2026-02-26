import api from './base'

const authApi = {
  login (params) {
    return api.post('/auth/login', params)
  }
}

export default authApi
