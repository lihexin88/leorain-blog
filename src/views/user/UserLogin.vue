<template>
  <div class="container">
    <div class="row">
      <div class="col-md-6 offset-md-3" style="margin-top: 50px;">
        <div class="well">
          <form class="form" role="form" @submit.prevent="handleLogin">
            <fieldset>
              <legend class="text-center">登录</legend>
              <div class="form-group">
                <div class="col-md-10 offset-md-1">
                  <label class="control-label" for="email">邮箱</label>
                  <input id="email" type="email"
                         class="form-control"
                         v-model="loginForm.email"
                         placeholder="请输入邮箱" required autofocus>
                  <i style="font-size: .85em">如果您在本站评论或者留言过，请点击下面的忘记密码，重置您的密码即可登录</i>
                </div>
              </div>
              <div class="form-group">
                <div class="col-md-10 offset-md-1">
                  <label class="control-label" for="password">密码</label>
                  <input id="password" type="password"
                         class="form-control"
                         v-model="loginForm.password"
                         placeholder="请输入密码" required>
                </div>
              </div>
              <div class="form-group">
                <div class="col-md-8 offset-md-1">
                  <div class="checkbox">
                    <label>
                      <input type="checkbox" v-model="loginForm.remember"> 记住我
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-group" id="validator">
                <div class="col-md-10 offset-md-1">
                  <Validator ref="validatorRef" />
                </div>
              </div>
              <div class="form-group">
                <div class="col-md-10 offset-md-1">
                  <button type="submit" class="btn btn-success form-control" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                  </button>
                </div>
              </div>

              <div class="col-md-10 offset-md-1">
                <div class="strike">
                  <span>or</span>
                </div>
              </div>

              <div class="form-group">
                <div class="col-md-10 offset-md-1">
                  <a href="/api/frontend/auth/github" class="btn btn-primary form-control">
                    <i class="fab fa-github"></i> GitHub 登录
                  </a>
                </div>
              </div>

              <div class="form-group">
                <div class="col-md-8 offset-md-2 text-center">
                  <router-link class="btn btn-link" to="/password/reset">
                    忘记密码
                  </router-link>
                  <router-link class="btn btn-link" to="/register">
                    注册
                  </router-link>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Validator from '@/components/Validator.vue'
import { useUserStore } from '@/store/user'
import { mapActions } from 'pinia'

export default {
  name: 'UserLogin',
  components: {
    Validator
  },
  data () {
    return {
      loginForm: {
        email: '',
        password: '',
        remember: false
      },
      loading: false
    }
  },
  methods: {
    ...mapActions(useUserStore, ['login']),
    async handleLogin () {
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
    }
  }
}
</script>

<style scoped>
.well {
  min-height: 20px;
  padding: 19px;
  margin-bottom: 20px;
  background-color: #f5f5f5;
  border: 1px solid #e3e3e3;
  border-radius: 4px;
  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .05);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .05);
}
.strike {
  display: block;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  margin: 20px 0;
}
.strike > span {
  position: relative;
  display: inline-block;
}
.strike > span:before,
.strike > span:after {
  content: "";
  position: absolute;
  top: 50%;
  width: 9999px;
  height: 1px;
  background: #e3e3e3;
}
.strike > span:before {
  right: 100%;
  margin-right: 15px;
}
.strike > span:after {
  left: 100%;
  margin-left: 15px;
}
.form-group {
  margin-bottom: 15px;
}
</style>
