<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOauthStore } from '@/store/oauth'

const route = useRoute()
const router = useRouter()
const oauthStore = useOauthStore()

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    console.error('Missing code parameter')
    return
  }

  try {
    await oauthStore.loginWithGithub(code)
    router.push('/')
  } catch (error) {
    console.error('GitHub github failed:', error)
  }
})
</script>

<template>
<div>
  <p v-if="oauthStore.loading">正在登录中...</p>
  <p v-else-if="oauthStore.error">登录失败，请重试</p>
</div>
</template>

<style scoped lang="scss">

</style>
