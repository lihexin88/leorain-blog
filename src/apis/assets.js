import api from './base'

const assetsApi = {
  getAssets (params) {
    return api.get('/asset', { params })
  },
  getDefaultDir () {
    return api.get('/api/assets/info/default')
  },
  getUploadUrl (fileName) {
    return api.get('/api/assets/upload', {
      params: {
        file_name: fileName
      }
    })
  },
  createAsset (data) {
    return api.post('/api/assets', data)
  },
  assetAsr (data) {
    return api.post('asr', data)
  },
  getAsrDetail (recordId) {
    return api.get('/api/frontend/asr/detail', {
      params: {
        record_id: recordId
      }
    })
  }
}

export default assetsApi
