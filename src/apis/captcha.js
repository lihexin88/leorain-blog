import api from './base'

const captchaApi = {
  getMathCaptcha () {
    return api.get('/captcha/math')
  }
}

export default captchaApi
