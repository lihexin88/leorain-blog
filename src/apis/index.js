import articleApi from './article'
import tagApi from './tag'
import categoryApi from './categories'
import gitLogApi from './gitLog'
import configApi from './config'
import systemInfoApi from './systemInfo'
import visitorMapApi from './visitorMap'

export default {
    articleApi,
    tagApi,
    categoryApi,
    gitLogApi,
    configApi,
    systemInfoApi,
    visitorMapApi
}

// 也可以单独导出各个模块
export {articleApi, tagApi, categoryApi, gitLogApi, configApi, systemInfoApi, visitorMapApi}
