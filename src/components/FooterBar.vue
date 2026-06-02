<script>
import FootLinks from './FootLinks.vue'

export default {
  components: { FootLinks },
  data () {
    return {
      githubStars: null
    }
  },
  mounted () {
    this.fetchGithubStars()
  },
  methods: {
    async fetchGithubStars () {
      const response = await fetch('https://api.github.com/repos/lihexin88/leorain-blog')
      const repo = await response.json()
      this.githubStars = repo.stargazers_count
    }
  }
}
</script>

<template>
  <div class="copy-right text-center footer-padding">
    <div class="ali-report-wrap">
      <span class="footer-link-text-color" style="pointer-events: none"> © 2021. Powered by leorain </span>
      ·
      <el-link class="github-stars" href="https://github.com/lihexin88/leorain-blog" target="_blank" underline="never">
        <span class="github-stars-label">
          <svg class="github-logo" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          github
        </span>
        <span class="github-stars-count">{{ githubStars ?? '-' }}</span>
      </el-link>
      ·
      <el-link class="footer-link-text-color" href="https://beian.miit.gov.cn/" target="_blank">
        浙ICP备19033456号-2
      </el-link>
    </div>
    <div class="ali-report-wrap">
      <foot-links />
    </div>
  </div>
</template>

<style scoped lang="scss">
.github-stars {
  display: inline-flex;
  align-items: center;
  height: 20px;
  overflow: hidden;
  border-radius: 3px;
  color: #ffffff;
  font-size: 11px;
  line-height: 20px;
  vertical-align: middle;
}

.github-stars-label,
.github-stars-count {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 6px;
}

.github-stars-label {
  gap: 4px;
  background-color: #555555;
}

.github-stars-count {
  background-color: #24292f;
}

.github-logo {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
</style>
