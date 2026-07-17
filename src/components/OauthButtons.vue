<script>
import authApi from '@/apis/auth'

export default {
  data () {
    return {
      authConfig: []
    }
  },
  methods: {
    getAuthConfig () {
      authApi.getConfig().then(res => {
        this.authConfig = res
      })
    },
    handleOauthLogin (url) {
      window.location.href = url
    }
  },
  mounted () {
    this.getAuthConfig()
  }
}
</script>

<template>
  <div>
    <el-button v-for="(auth, authKey) in authConfig" :key="authKey" @click="handleOauthLogin(auth.auth_url)">
      <el-avatar :size="20" :src="auth.logo" />
      <span style="margin-left: 5px">
        {{ authKey }}
      </span>
    </el-button>
  </div>
</template>

<style scoped lang="scss"></style>
