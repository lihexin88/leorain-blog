import api from './base'

export default {
  getVideoMemory (num) {
    return api.get('/wlwz_video', {
      params: {
        num
      }
    })
  },
  takeImage () {
    return api.get('/site/image/random')
  }
}
