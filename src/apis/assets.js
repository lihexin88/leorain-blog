import api from './base'

const assetsApi = {
  getAssets (params) {
    return api.get('/asset', { params })
  },
  getAssetDetail (assetId) {
    return api.get('/api/frontend/asset/' + assetId + '?include=fullPath')
  },
  updateAsset (assetId, data) {
    return api.patch(`/api/frontend/asset/${assetId}`, data)
  },
  deleteAsset (assetId) {
    return api.delete(`/api/frontend/asset/${assetId}`)
  },
  getDefaultDir () {
    return api.get('/api/assets_dir/default')
  },
  getUploadUrl (fileName) {
    return api.get('/api/assets_upload/upload', {
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
