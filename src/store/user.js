import { defineStore } from 'pinia'
import authApi from '@/apis/auth'
import userApi from '@/apis/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    showLoginDialog: false,
    // 确保全局仅有一个登录/访客信息弹窗渲染实例
    loginDialogOwnerId: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user && !!state.token
  },

  actions: {
    setShowLoginDialog (show) {
      this.showLoginDialog = show
    },
    // 注册弹窗的拥有者，只有拥有者实例才渲染弹窗
    registerLoginDialogOwner (id) {
      if (!this.loginDialogOwnerId) {
        this.loginDialogOwnerId = id
      }
    },
    // 释放拥有者（例如弹窗关闭或组件卸载时）
    unregisterLoginDialogOwner (id) {
      if (this.loginDialogOwnerId === id) {
        this.loginDialogOwnerId = null
      }
    },
    async login (params) {
      try {
        const response = await authApi.login(params)
        // 假设后端返回的数据结构中包含 token
        if (response.token) {
          this.token = response.token
          localStorage.setItem('token', this.token)
        } else if (response.access_token) {
          this.token = response.access_token
          localStorage.setItem('token', this.token)
        } else {
          const data = response.data || response
          this.token = data.token || data.access_token || ''
          if (this.token) {
            localStorage.setItem('token', this.token)
          }
        }

        // 登录成功后获取用户信息
        await this.fetchUserInfo()

        return response
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },

    async fetchUserInfo () {
      try {
        const response = await userApi.getUserInfo()
        const userData = response.data || response
        this.user = userData
        localStorage.setItem('user', JSON.stringify(this.user))
        return userData
      } catch (error) {
        console.error('Fetch user info failed:', error)
        throw error
      }
    },

    logout () {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
})
