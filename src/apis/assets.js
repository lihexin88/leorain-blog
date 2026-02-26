import api from './base'

const assetsApi = {
  getAssets (params) {
    return api.get('/asset', { params })
  }
}

export default assetsApi
