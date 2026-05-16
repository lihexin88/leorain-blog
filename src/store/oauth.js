import { defineStore } from 'pinia'
import api from '@/apis/base'
import { useUserStore } from '@/store/user'
import { dispatchUserLoginSuccess } from '@/utils/auth-events'

export const useOauthStore = defineStore('oauth', {
  state: () => ({
    loading: false,
    error: null
  }),

  actions: {
    async loginWithGithub (code) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/github/callback', { code })
        const userStore = useUserStore()

        const token = response.access_token || response.token
        if (token) {
          userStore.token = token
          localStorage.setItem('token', token)
        }

        await userStore.fetchUserInfo()
        dispatchUserLoginSuccess({
          user: userStore.user,
          token: userStore.token
        })

        return response
      } catch (error) {
        this.error = error
        console.error('GitHub OAuth login failed:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async loginWithGitee (code) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/gitee/callback', { code })
        const userStore = useUserStore()

        const token = response.access_token || response.token
        if (token) {
          userStore.token = token
          localStorage.setItem('token', token)
        }

        await userStore.fetchUserInfo()
        dispatchUserLoginSuccess({
          user: userStore.user,
          token: userStore.token
        })

        return response
      } catch (error) {
        this.error = error
        console.error('Gitee OAuth login failed:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
