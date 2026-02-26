import api from './base'

const fishApi = {
  // 命中鱼并尝试获取物资
  takeItem () {
    return api.post('/items/take')
  }
}

export default fishApi
