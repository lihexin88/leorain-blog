import api from './base'

const authApi = {
  login (params) {
    return api.post('/auth/login', params)
  },
  register (params) {
    return api.post('/auth/register', params)
  }
}

export default authApi
