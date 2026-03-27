import api from './base'

export default {
  getRssList (params) {
    return api.get('/rss', { params })
  }
}
