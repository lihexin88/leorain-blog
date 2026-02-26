<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>登录</h2>
        </div>
      </template>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            clearable
            autofocus
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            如果您在本站评论或者留言过，请点击下面的忘记密码，重置您的密码即可登录
          </div>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="remember">
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item label="验证码" required>
          <Validator ref="validatorRef" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            native-type="submit"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="divider-container">
          <el-divider>or</el-divider>
        </div>

        <el-form-item>
          <el-button class="github-button" @click="handleGithubLogin">
            <i class="fab fa-github"></i>&nbsp;GitHub 登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <el-link type="info" @click="$router.push('/password/reset')">忘记密码</el-link>
          <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import Validator from '@/components/Validator.vue'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'
import { Message, Lock } from '@element-plus/icons-vue'

export default {
  name: 'UserLogin',
  components: {
    Validator,
    Lock,
    Message
  },
  setup () {
    return {
      Message,
      Lock
    }
  },
  data () {
    return {
      loginForm: {
        email: '',
        password: '',
        remember: false
      },
      loginRules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    ...mapActions(useUserStore, ['login']),
    async handleLogin () {
      // 表单预验证
      await this.$refs.loginFormRef.validate(async (valid) => {
        if (!valid) return

        const validator = this.$refs.validatorRef
        if (!validator.validateResult) {
          this.$message.error('请输入验证码结果')
          return
        }

        this.loading = true
        try {
          const payload = {
            ...this.loginForm,
            validate_key: validator.validateKey,
            validate_result: validator.validateResult
          }
          await this.login(payload)
          this.$message.success('登录成功')
          this.$router.push('/')
        } catch (error) {
          console.error(error)
          const msg = error.response?.data?.message || '登录失败，请检查账号密码或验证码'
          this.$message.error(msg)
          // 登录失败通常需要刷新验证码
          if (this.$refs.validatorRef) {
            this.$refs.validatorRef.getImageData()
          }
        } finally {
          this.loading = false
        }
      })
    },
    handleGithubLogin () {
      window.location.href = '/api/frontend/auth/github'
    }
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 100px);
  padding-top: 50px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  :deep(.el-card__header) {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #ebeef5;
  }
}

.login-header {
  h2 {
    margin: 0;
    font-size: 24px;
    color: #303133;
    font-weight: 600;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.divider-container {
  margin: 20px 0;
}

.github-button {
  width: 100%;
  background-color: #24292e;
  border-color: #24292e;
  color: #fff;

  &:hover, &:focus {
    background-color: #444d56;
    border-color: #444d56;
    color: #fff;
  }
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-container {
    padding: 20px;
    align-items: center;
    min-height: auto;
  }

  .login-card {
    box-shadow: none;
    border: none;
  }
}
</style>
