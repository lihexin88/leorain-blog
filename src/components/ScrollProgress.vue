<template>
  <div class="navbar-progress">
    <el-progress
      class="flow-progress"
      :stroke-width="3"
      :show-text="false"
      stroke-linecap="round"
      :percentage="percentage"
    ></el-progress>
  </div>
</template>

<script>
export default {
  data() {
    return {
      percentage: 0,
      customColors: [
        { color: '#f56c6c', percentage: 5 },
        { color: '#f89860', percentage: 10 },
        { color: '#e6a23c', percentage: 15 },
        { color: '#d8b455', percentage: 20 },
        { color: '#c9c96e', percentage: 25 },
        { color: '#b3d17a', percentage: 30 },
        { color: '#9cd987', percentage: 35 },
        { color: '#7ecfa3', percentage: 40 },
        { color: '#5cb87a', percentage: 45 },
        { color: '#4aa983', percentage: 50 },
        { color: '#35969d', percentage: 55 },
        { color: '#1989fa', percentage: 60 },
        { color: '#3474e0', percentage: 65 },
        { color: '#3a65c4', percentage: 70 },
        { color: '#5055a7', percentage: 75 },
        { color: '#5d4b97', percentage: 80 },
        { color: '#6a4388', percentage: 85 },
        { color: '#7c3a78', percentage: 90 },
        { color: '#903066', percentage: 95 },
        { color: '#a62652', percentage: 100 }
      ]
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      let scrollTop = window.scrollY || document.documentElement.scrollTop
      let scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      this.percentage = (scrollTop / scrollHeight) * 100
    }
  }
}
</script>
<style scoped lang="scss">
.navbar-progress {
  width: 100%;
  position: fixed;
  top: 0;
  height: 6px;
  left: 0;
}
:deep(.el-progress-bar__outer) {
  background-color: transparent !important;
  height: 5px !important;
}
</style>
<style lang="scss">
.flow-progress .el-progress-bar__inner {
  background: linear-gradient(
    90deg,
    #f56c6c,
    #f89860,
    #e6a23c,
    #d8b455,
    #c9c96e,
    #b3d17a,
    #9cd987,
    #7ecfa3,
    #5cb87a,
    #4aa983,
    #35969d,
    #1989fa,
    #3474e0,
    #3a65c4,
    #5055a7,
    #5d4b97,
    #6a4388,
    #7c3a78,
    #903066,
    #a62652
  );
  background-size: 200% 100%;
  animation: gradient-move 3s linear infinite;
}

@keyframes gradient-move {
  0% {
    background-position: 0 0;
  }
  50% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
