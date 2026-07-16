import { defineStore } from 'pinia'
import configApi from '@/apis/config'

// 模块级请求合并：多个组件同时 fetch 时只发一次网络请求
let fetchPromise = null

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {},
    loading: false,
    error: null,
    showSiteInfo: true,
    // 是否已成功加载过配置
    loaded: false
  }),

  getters: {
    // 获取网站标题
    title: (state) => state.config.title || '',

    // 获取网站描述
    description: (state) => state.config.description || '',

    // 获取关于我信息
    aboutMe: (state) => state.config.about_me || '',

    // 获取配额信息
    quotaInfo: (state) => state.config.quota_info || null,

    // 获取网站背景图片/视频
    backgroundImage: (state) => state.config.background_image || null
  },

  actions: {
    /**
     * 获取配置信息
     * @param {Object} [options]
     * @param {boolean} [options.force=false] 为 true 时忽略缓存强制刷新
     */
    async fetchConfigs (options = {}) {
      const { force = false } = options

      // 已加载成功且非强制刷新：直接返回缓存
      if (this.loaded && !force) {
        return this.config
      }

      // 已有进行中的请求：复用同一 Promise
      if (fetchPromise && !force) {
        return fetchPromise
      }

      this.loading = true
      this.error = null

      fetchPromise = (async () => {
        try {
          const response = await configApi.getConfigs()
          this.config = response
          this.loaded = true
          return response
        } catch (error) {
          this.error = error.message || '获取配置信息失败'
          console.error('获取配置信息失败:', error)
          // 失败时允许后续重试
          fetchPromise = null
          throw error
        } finally {
          this.loading = false
        }
      })()

      return fetchPromise
    }
  }
})
