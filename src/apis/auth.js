import api from './base'

const authApi = {
  login (params) {
    return api.post('/auth/login', params)
  },
  register (params) {
    return api.post('/auth/register', params)
  },
  getConfig () {
    return api.get('/auth/config')
  },
  sendResetPasswordEmail (params) {
    return api.post('/auth/send_reset_password_email', params)
  },
  resetPassword (params) {
    return api.post('/auth/reset_password', params)
  }
}

export default authApi
