import api from './base'

const assetsApi = {
  getAssets (params) {
    return api.get('/asset', { params })
  },
  getDefaultDir () {
    return api.get('/assets/info/default')
  },
  getUploadUrl (fileName) {
    return api.get('/assets/upload', {
      params: {
        file_name: fileName
      }
    })
  },
  createAsset (data) {
    return api.post('assets', data)
  }
}

export default assetsApi
