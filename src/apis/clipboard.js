import api from './base'

// 剪切板相关 API
// baseURL 在 base.js 中配置为 /api/frontend

function resolveBasePath (sourceType) {
  // sourceType: 'public' | 'private'
  return sourceType === 'private' ? '/clipboard-authorized' : '/clipboard'
}

export default {
  // 获取列表（分页、搜索）
  getList (sourceType, params) {
    const basePath = resolveBasePath(sourceType)
    return api.get(basePath, { params })
  },

  // 新增
  create (sourceType, data) {
    const basePath = resolveBasePath(sourceType)
    return api.post(basePath, data)
  },

  // 更新
  update (sourceType, id, data) {
    const basePath = resolveBasePath(sourceType)
    return api.patch(`${basePath}/${id}`, data)
  },

  // 删除
  remove (sourceType, id) {
    const basePath = resolveBasePath(sourceType)
    return api.delete(`${basePath}/${id}`)
  }
}
