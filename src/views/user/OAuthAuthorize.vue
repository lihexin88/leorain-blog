<template>
  <div class="oauth-authorize-page">
    <el-card class="oauth-card" shadow="always">
      <div v-if="pageStatus === 'loading'" class="oauth-state">
        <el-icon class="is-loading state-icon"><Loading /></el-icon>
        <h2>正在加载授权信息</h2>
        <p>请稍候，我们正在校验三方应用请求…</p>
      </div>

      <div v-else-if="pageStatus === 'login_required'" class="oauth-state">
        <el-icon class="state-icon"><Lock /></el-icon>
        <h2>需要登录后继续授权</h2>
        <p>登录或注册成功后，将自动回到本页完成授权。</p>
        <div class="oauth-actions">
          <el-button type="primary" @click="openLogin">去登录</el-button>
          <el-button @click="goRegister">去注册</el-button>
        </div>
      </div>

      <div v-else-if="pageStatus === 'error'" class="oauth-state is-error">
        <el-icon class="state-icon"><CircleCloseFilled /></el-icon>
        <h2>授权请求无效</h2>
        <p>{{ errorMessage || '请检查 client_id、redirect_uri 等参数后重试。' }}</p>
        <div class="oauth-actions">
          <el-button type="primary" @click="goHome">返回首页</el-button>
          <el-button @click="loadAuthorizeInfo">重试</el-button>
        </div>
      </div>

      <div v-else-if="pageStatus === 'redirecting'" class="oauth-state is-success">
        <el-icon class="state-icon"><CircleCheckFilled /></el-icon>
        <h2>授权成功</h2>
        <p>正在跳转回应用…</p>
      </div>

      <div v-else class="oauth-body">
        <div class="oauth-hero">
          <div class="app-badge">
            <el-icon><Link /></el-icon>
          </div>
          <h2>应用授权请求</h2>
          <p>
            <strong>{{ clientName }}</strong>
            正在请求访问你的账号
          </p>
        </div>

        <div class="oauth-panel">
          <div class="panel-block">
            <div class="panel-label">申请应用</div>
            <div class="panel-value">{{ clientName }}</div>
            <div class="panel-sub" v-if="clientId">Client ID: {{ clientId }}</div>
          </div>

          <div class="panel-block">
            <div class="panel-label">当前账号</div>
            <div class="user-row">
              <el-avatar :size="40" :src="userAvatar">{{ userDisplayName?.slice(0, 1) }}</el-avatar>
              <div>
                <div class="panel-value">{{ userDisplayName }}</div>
                <div class="panel-sub">{{ userName }}</div>
              </div>
            </div>
          </div>

          <div class="panel-block" v-if="scopes.length">
            <div class="panel-label">将获得以下权限</div>
            <ul class="scope-list">
              <li v-for="scope in scopes" :key="scope.id">
                <el-icon><Check /></el-icon>
                <span>{{ scope.description || scope.id }}</span>
              </li>
            </ul>
          </div>
          <div class="panel-block" v-else>
            <div class="panel-label">权限范围</div>
            <div class="panel-value">默认访问权限</div>
          </div>

          <div class="panel-block">
            <div class="panel-label">授权后将返回</div>
            <div class="panel-value redirect-uri">{{ redirectUri }}</div>
          </div>
        </div>

        <div class="oauth-actions">
          <el-button type="primary" size="large" :loading="submitting" @click="handleApprove">
            同意授权
          </el-button>
          <el-button size="large" :disabled="submitting" @click="handleDeny">
            拒绝
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  Loading,
  Lock,
  Link,
  Check,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import oauthApi from '@/apis/oauth'
import { useUserStore } from '@/store/user'
import { mapActions, mapState } from 'pinia'
import {
  savePostLoginRedirectFromRoute,
  clearPostLoginRedirect
} from '@/utils/redirect'
import { USER_LOGIN_SUCCESS_EVENT } from '@/utils/auth-events'

export default {
  name: 'OAuthAuthorize',
  components: {
    Loading,
    Lock,
    Link,
    Check,
    CircleCheckFilled,
    CircleCloseFilled
  },
  data () {
    return {
      pageStatus: 'loading', // loading | login_required | ready | redirecting | error
      errorMessage: '',
      submitting: false,
      authToken: '',
      client: null,
      user: null,
      scopes: [],
      redirectUri: '',
      state: ''
    }
  },
  computed: {
    ...mapState(useUserStore, ['isLoggedIn', 'token']),
    clientName () {
      return this.client?.name || '未知应用'
    },
    clientId () {
      return this.client?.id || this.$route.query.client_id || ''
    },
    userDisplayName () {
      return this.user?.nickname || this.user?.name || '当前用户'
    },
    userName () {
      return this.user?.name || ''
    },
    userAvatar () {
      return this.user?.avatar || ''
    },
    authorizeParams () {
      const q = this.$route.query
      return {
        client_id: q.client_id,
        redirect_uri: q.redirect_uri,
        response_type: q.response_type || 'code',
        scope: q.scope ?? '',
        state: q.state,
        prompt: q.prompt
      }
    }
  },
  watch: {
    isLoggedIn (val) {
      if (val && (this.pageStatus === 'login_required' || this.pageStatus === 'loading')) {
        this.loadAuthorizeInfo()
      }
    }
  },
  methods: {
    ...mapActions(useUserStore, ['setShowLoginDialog']),
    validateQuery () {
      const { client_id: clientId, redirect_uri: redirectUri, response_type: responseType } =
        this.authorizeParams
      if (!clientId || !redirectUri || !responseType) {
        this.pageStatus = 'error'
        this.errorMessage = '缺少必要参数：client_id、redirect_uri、response_type'
        return false
      }
      return true
    },
    openLogin () {
      savePostLoginRedirectFromRoute(this.$route)
      this.setShowLoginDialog(true)
    },
    goRegister () {
      savePostLoginRedirectFromRoute(this.$route)
      this.$router.push('/register')
    },
    goHome () {
      this.$router.push('/')
    },
    extractPayload (response) {
      if (!response) return {}
      if (response.data && typeof response.data === 'object') {
        return response.data
      }
      return response
    },
    handleAuthorizeResult (response) {
      const data = this.extractPayload(response)

      // 已授权 / 自动同意：直接跳转
      if (data.redirect && data.redirect_uri) {
        this.redirectToApp(data.redirect_uri)
        return
      }

      // 需要用户确认
      if (data.client && data.auth_token) {
        this.client = data.client
        this.user = data.user
        this.scopes = Array.isArray(data.scopes) ? data.scopes : []
        this.authToken = data.auth_token
        this.redirectUri = data.redirect_uri || this.authorizeParams.redirect_uri
        this.state = data.state || this.authorizeParams.state || ''
        this.pageStatus = 'ready'
        clearPostLoginRedirect()
        return
      }

      this.pageStatus = 'error'
      this.errorMessage = '未识别的授权响应，请稍后重试'
    },
    redirectToApp (url) {
      this.pageStatus = 'redirecting'
      clearPostLoginRedirect()
      window.location.href = url
    },
    async loadAuthorizeInfo () {
      if (!this.validateQuery()) return

      if (!this.isLoggedIn || !this.token) {
        this.pageStatus = 'login_required'
        savePostLoginRedirectFromRoute(this.$route)
        this.setShowLoginDialog(true)
        return
      }

      this.pageStatus = 'loading'
      this.errorMessage = ''

      try {
        const response = await oauthApi.authorize(this.authorizeParams)
        this.handleAuthorizeResult(response)
      } catch (error) {
        const status = error.response?.status
        const body = error.response?.data || {}
        const data = body.data || {}
        let message = body.message || body.error_description || body.error || '授权请求失败'

        // OAuth 错误有时写在 redirect_uri 的 query 里
        if (data.redirect_uri) {
          try {
            const u = new URL(data.redirect_uri)
            const desc = u.searchParams.get('error_description') || u.searchParams.get('hint')
            const err = u.searchParams.get('error')
            if (desc || err) {
              message = decodeURIComponent(desc || err)
            }
          } catch (e) {
            // ignore parse error
          }
        }

        if (status === 401 || body.login_required) {
          this.pageStatus = 'login_required'
          savePostLoginRedirectFromRoute(this.$route)
          this.setShowLoginDialog(true)
          return
        }

        this.pageStatus = 'error'
        this.errorMessage = message
        console.error('OAuth authorize failed:', error)
      }
    },
    async handleApprove () {
      if (!this.authToken) {
        this.$message.error('授权凭证丢失，请刷新后重试')
        this.loadAuthorizeInfo()
        return
      }
      this.submitting = true
      try {
        const response = await oauthApi.approve({
          auth_token: this.authToken,
          state: this.state,
          client_id: this.clientId
        })
        const data = this.extractPayload(response)
        if (data.redirect_uri) {
          this.redirectToApp(data.redirect_uri)
          return
        }
        this.$message.error('授权成功但未返回跳转地址')
      } catch (error) {
        const message = error.response?.data?.message || '同意授权失败'
        this.$message.error(message)
        console.error(error)
      } finally {
        this.submitting = false
      }
    },
    async handleDeny () {
      if (!this.authToken) {
        this.goHome()
        return
      }
      this.submitting = true
      try {
        const response = await oauthApi.deny({
          auth_token: this.authToken,
          state: this.state,
          client_id: this.clientId
        })
        const data = this.extractPayload(response)
        if (data.redirect_uri) {
          this.redirectToApp(data.redirect_uri)
          return
        }
        this.goHome()
      } catch (error) {
        // 拒绝时后端可能以错误响应返回带 error 的 redirect
        const headers = error.response?.headers || {}
        const location = headers.location || headers.Location
        if (location) {
          this.redirectToApp(location)
          return
        }
        const body = error.response?.data
        if (body?.data?.redirect_uri) {
          this.redirectToApp(body.data.redirect_uri)
          return
        }
        this.$message.error(body?.message || '拒绝授权失败')
        console.error(error)
      } finally {
        this.submitting = false
      }
    },
    onLoginSuccess () {
      if (this.$route.path === '/oauth/authorize') {
        this.loadAuthorizeInfo()
      }
    }
  },
  mounted () {
    window.addEventListener(USER_LOGIN_SUCCESS_EVENT, this.onLoginSuccess)
    this.loadAuthorizeInfo()
  },
  beforeUnmount () {
    window.removeEventListener(USER_LOGIN_SUCCESS_EVENT, this.onLoginSuccess)
  }
}
</script>

<style scoped lang="scss">
.oauth-authorize-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 16px 80px;
  min-height: 60vh;
}

.oauth-card {
  width: 100%;
  max-width: 560px;
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 32px 28px;
  }
}

.oauth-state {
  text-align: center;
  padding: 24px 8px;

  h2 {
    margin: 16px 0 8px;
    font-size: 22px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #606266;
    line-height: 1.6;
  }

  &.is-error h2 {
    color: #f56c6c;
  }

  &.is-success h2 {
    color: #67c23a;
  }
}

.state-icon {
  font-size: 42px;
  color: #409eff;

  &.is-loading {
    animation: rotating 1.2s linear infinite;
  }
}

.is-error .state-icon {
  color: #f56c6c;
}

.is-success .state-icon {
  color: #67c23a;
}

.oauth-hero {
  text-align: center;
  margin-bottom: 28px;

  h2 {
    margin: 12px 0 8px;
    font-size: 24px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #606266;
    line-height: 1.6;
  }
}

.app-badge {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  font-size: 28px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.28);
}

.oauth-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
}

.panel-block {
  padding: 14px 16px;
  border-radius: 10px;
  background: #f5f7fa;
}

.panel-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.panel-value {
  font-size: 15px;
  color: #303133;
  word-break: break-all;
  font-weight: 500;
}

.panel-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    color: #303133;
    font-size: 14px;

    .el-icon {
      color: #67c23a;
    }
  }
}

.redirect-uri {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 400;
}

.oauth-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;

  .el-button {
    min-width: 120px;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@include mobile {
  .oauth-authorize-page {
    padding: 24px 12px 48px;
  }

  .oauth-card {
    :deep(.el-card__body) {
      padding: 24px 16px;
    }
  }
}
</style>
