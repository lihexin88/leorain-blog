import http from './base'

/**
 * 删除画布
 * @param {string} assetId - The ID of the asset to delete.
 * @returns {Promise}
 */
export function deleteDraw (assetId) {
  return http.delete(`/api/draws/${assetId}`)
}

/**
 * 创建新画布
 * @param {string} name - The name of the new draw.
 * @returns {Promise}
 */
export function createDraw (name) {
  return http.post('/api/draws', { name })
}

/**
 * 保存画布
 * @param {string} drawId - The ID of the draw to save.
 * @returns {Promise}
 */
export function saveDraw (drawId) {
  return http.post(`${process.env.DRAW_WS_HOST}/draw/paint/save`, {
    draw_id: drawId
  })
}

/**
 * 获取画布信息
 * @param {string} assetId - The ID of the asset to get.
 * @returns {Promise}
 */
export function getDraw (assetId) {
  return http.get(`/api/draws/${assetId}`)
}

/**
 * 更新画布
 * @param {string} assetId - The ID of the asset to update.
 * @param {object} data - The data to update.
 * @returns {Promise}
 */
export function updateDraw (assetId, data) {
  return http.patch(`/api/draws/${assetId}`, data)
}

/**
 * 获取画布列表
 * @param {object} params - The query parameters.
 * @returns {Promise}
 */
export function getDraws (params) {
  return http.get('/api/draws', { params })
}

/**
 * 获取画布初始化数据
 * @param {string} drawId - The ID of the draw.
 * @returns {Promise}
 */
export function getDrawInitData (drawId) {
  return http.get(`${process.env.DRAW_WS_HOST}/draw/paint/init`, {
    params: {
      draw_id: drawId
    }
  })
}

/**
 * 获取画布锁
 * @param {string} drawId - The ID of the draw.
 * @returns {Promise}
 */
export function getDrawLock (drawId) {
  return http.post(`${process.env.DRAW_WS_HOST}/draw/lock/get`, {
    type: 0,
    draw_id: drawId
  })
}
