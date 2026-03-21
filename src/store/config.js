import { defineStore } from 'pinia'
import configApi from '@/apis/config'

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {},
    loading: false,
    error: null,
    showSiteInfo: true
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
    // 获取配置信息
    async fetchConfigs () {
      this.loading = true
      this.error = null

      try {
        const response = await configApi.getConfigs()
        this.config = response
        return response
      } catch (error) {
        this.error = error.message || '获取配置信息失败'
        console.error('获取配置信息失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
