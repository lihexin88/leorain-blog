
import api from './base'

const visitorMapApi = {
  // 获取国家地图数据
  getCountryMap() {
    return api({
      url: 'https://images.leorain.cn/files/country_map.json',
      method: 'get'
    })
  }
}

export default visitorMapApi
