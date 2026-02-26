import api from './base'

const lotteryApi = {
  // 获取彩票分类
  getCategories () {
    return api.get('/lottery-categories')
  },

  // 抽取新彩票
  drawLottery (categoryId, params) {
    return api.get(`/lottery-categories/${categoryId}/draw`, { params })
  },

  // 获取用户彩票记录
  getUserLotteries (params) {
    return api.get('/user-items', { params })
  },

  // 获取特定彩票详情
  getLotteryDetail (userItemId, params) {
    return api.get(`/user-items/${userItemId}`, { params })
  },

  // 兑换/刮开彩票
  redeemLottery (userItemId) {
    return api.post(`/user-items/${userItemId}`)
  },

  // 获取用户积分
  getUserScore () {
    return api.get('/user/score')
  },

  // 获取积分日志
  getScoreLogs (params) {
    return api.get('/user/score-log', { params })
  }
}

export default lotteryApi
