import TestFullscreenButton from '../TestFullscreenButton.vue'

/**
 * 测试工具内容区全屏：避开顶部 NavBar 与左侧测试导航，Esc 退出。
 * 在根节点使用 :class="{ 'is-fullscreen': isFullscreen }"，
 * display-area 右上角放置 <test-fullscreen-button />。
 *
 * 通过 section id 注册到 ToolTest，侧栏切换时可把全屏带到新测试。
 */
export default {
  components: {
    TestFullscreenButton
  },
  inject: {
    testPageFullscreen: { default: null }
  },
  data () {
    return {
      isFullscreen: false
    }
  },
  mounted () {
    document.addEventListener('keydown', this._onFullscreenKeydown)
    this.$nextTick(() => {
      this._registerTestFullscreen()
    })
  },
  beforeUnmount () {
    document.removeEventListener('keydown', this._onFullscreenKeydown)
    if (typeof this._unregisterTestFullscreen === 'function') {
      this._unregisterTestFullscreen()
      this._unregisterTestFullscreen = null
    }
    this.exitFullscreen(true)
  },
  methods: {
    _registerTestFullscreen () {
      if (!this.testPageFullscreen || typeof this.testPageFullscreen.register !== 'function') {
        return
      }
      const sectionId = this.$el?.closest?.('section[id]')?.id
      if (!sectionId) return

      this._unregisterTestFullscreen = this.testPageFullscreen.register(sectionId, {
        enter: () => this.enterFullscreen({ fromParent: true }),
        exit: () => this.exitFullscreen(true),
        isActive: () => this.isFullscreen
      })
    },
    _onFullscreenKeydown (event) {
      if (event.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen()
      }
    },
    toggleFullscreen () {
      if (this.isFullscreen) {
        this.exitFullscreen()
      } else {
        this.enterFullscreen()
      }
    },
    enterFullscreen (options = {}) {
      // 用户手动进入时清掉其他全屏；父级导航切换时已 exitAll，避免重复闪烁
      if (!options.fromParent) {
        this.testPageFullscreen?.exitAll?.()
      }
      this.isFullscreen = true
      document.body.style.overflow = 'hidden'
      this.$nextTick(() => {
        this.onFullscreenChange(true)
      })
    },
    exitFullscreen (silent = false) {
      if (!this.isFullscreen) return
      this.isFullscreen = false
      document.body.style.overflow = ''
      if (!silent) {
        this.$nextTick(() => {
          this.onFullscreenChange(false)
        })
      }
    },
    /** 全屏切换后：有图表的子组件会走 resizeChart */
    onFullscreenChange () {
      if (typeof this.resizeChart === 'function') {
        this.resizeChart()
      }
    }
  }
}
