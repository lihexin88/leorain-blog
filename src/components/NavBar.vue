<template>
  <div
    ref="navBanner"
    class="nav-banner"
    :class="{ 'is-colorful': isColorful }"
    @mousemove="onBannerMouseMove"
    @mouseleave="onBannerMouseLeave"
  >
    <!-- Three.js 粒子 / 光效画布 -->
    <canvas ref="fxCanvas" class="nav-fx-canvas" aria-hidden="true" />

    <!-- 跟随鼠标的彩色光斑 -->
    <div
      class="nav-cursor-glow"
      :style="cursorGlowStyle"
      aria-hidden="true"
    />

    <!-- 底部彩虹流光边：仅彩色主题显示 -->
    <div v-if="isColorful" class="nav-gradient-line" aria-hidden="true" />

    <!-- 扫描高光 -->
    <div class="nav-scan-light" aria-hidden="true" />

    <el-menu
      :default-active="activeIndex"
      class="nav-el-menu"
      mode="horizontal"
      :router="true"
      :ellipsis="false"
      menu-trigger="click"
      @select="handleSelect"
    >
      <el-menu-item index="/" class="nav-logo-item" @mouseenter="onLogoHover">
        <span ref="logoWrap" class="logo-img-wrap">
          <img
            ref="logoImg"
            src="/images/logo.png"
            class="nav-logo-img"
            alt="logo"
            width="60"
            height="60"
            :style="logoImgStyle"
          />
        </span>
        <span class="nav-logo-text">
          <span
            v-for="(ch, i) in logoChars"
            :key="i"
            class="logo-char"
            :style="{ '--i': i }"
          >{{ ch }}</span>
        </span>
      </el-menu-item>

      <!-- 移动端折叠菜单 -->
      <el-sub-menu index="more" class="mobile-more-menu">
        <template #title>
          <el-icon class="menu-icon">
            <MoreFilled />
          </el-icon>
          <span>更多</span>
        </template>
        <el-sub-menu index="/tools-mobile">
          <template #title>
            <el-icon class="menu-icon">
              <Operation />
            </el-icon>
            <span>工具箱</span>
          </template>
          <el-menu-item
            v-for="tool in tools"
            :key="tool.href"
            :index="tool.href"
          >
            <img :src="tool.image" class="menu-icon" alt="" />
            <span>{{ tool.text }}</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item
          v-for="item in desktopNavItems"
          :key="'m-' + item.index"
          :index="item.index"
        >
          <el-icon class="menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.text }}</span>
        </el-menu-item>
      </el-sub-menu>

      <el-sub-menu
        index="/tools"
        class="desktop-menu nav-item-animated"
        popper-class="nav-tools-popper"
      >
        <template #title>
          <el-icon class="menu-icon">
            <Operation />
          </el-icon>
          <span>工具箱</span>
        </template>
        <el-menu-item
          v-for="tool in tools"
          :key="tool.href"
          :index="tool.href"
          class="tool-menu-item"
        >
          <img :src="tool.image" class="menu-icon" alt="" />
          <div class="tool-menu-text">
            <span class="tool-title">{{ tool.text }}</span>
            <span v-if="tool.description" class="tool-desc">{{ tool.description }}</span>
          </div>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item
        v-for="item in desktopNavItems"
        :key="item.index"
        :index="item.index"
        class="desktop-menu nav-item-animated"
        @mouseenter="onMenuItemEnter"
        @mouseleave="onMenuItemLeave"
      >
        <el-icon class="menu-icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.text }}</span>
        <span class="nav-item-shine" aria-hidden="true" />
      </el-menu-item>

      <div class="flex-grow" />

      <div class="user-menu-container">
        <button
          v-if="!isLoggedIn"
          type="button"
          class="login-btn"
          @click="setShowLoginDialog(true)"
          @mouseenter="onLoginHover"
        >
          <el-icon class="login-icon" :size="22">
            <User />
          </el-icon>
          <span class="login-btn-text">登录</span>
          <span class="login-btn-glow" aria-hidden="true" />
        </button>
        <el-dropdown
          v-else
          trigger="click"
          @command="handleCommand"
          popper-class="user-dropdown-popper"
        >
          <div class="el-dropdown-link" @mouseenter="onAvatarHover">
            <el-avatar
              shape="circle"
              :size="40"
              :src="userAvatar"
              class="user-avatar"
            />
            <span class="avatar-ring" aria-hidden="true" />
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown-menu">
              <el-dropdown-item command="/user/profile">
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item command="https://api.leorain.cn/dashboard">
                <el-icon><Operation /></el-icon>
                <span>面板</span>
              </el-dropdown-item>
              <el-dropdown-item command="clear-cache">
                <el-icon><Delete /></el-icon>
                <span>清除缓存</span>
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-menu>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user'
import { mapState, mapActions } from 'pinia'
import responseApi from '@/apis/response'
import anime from 'animejs'
import * as THREE from 'three'
import {
  User,
  MoreFilled,
  Operation,
  Search,
  EditPen,
  ChatLineRound,
  Link as LinkIcon,
  Trophy,
  Delete,
  SwitchButton
} from '@element-plus/icons-vue'

const COLORFUL_PALETTE = [
  '#ff6b9d',
  '#c084fc',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#22d3ee',
  '#a78bfa'
]

export default {
  name: 'NavBar',
  components: {
    User,
    MoreFilled,
    Operation,
    Search,
    EditPen,
    ChatLineRound,
    LinkIcon,
    Trophy,
    Delete,
    SwitchButton
  },
  data () {
    return {
      activeIndex: this.$route.path,
      logoChars: ['首', '页'],
      resolvedTheme: 'white',
      mouse: { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, inside: false },
      cursorGlow: { x: 0, y: 0, opacity: 0 },
      tools: [
        {
          text: '时间戳转换',
          description: '时间戳转换工具，提供当前时间戳和时间字符串转换功能',
          href: '/tools/timestamp',
          image: 'https://images.leorain.cn/icons/tools/tool_timestamp.png'
        },
        // {
        //   text: '进制转换',
        //   description: '十进制 二进制 八进制 十六进制等自动转换',
        //   href: '/tools/radix',
        //   image: 'https://images.leorain.cn/icons/tools/tool_radix.png'
        // },
        {
          text: 'json格式化',
          description: 'json字符串格式化与压缩',
          href: '/tools/json',
          image: 'https://images.leorain.cn/icons/tools/tool_json_format.png'
        },
        {
          text: '代码在线运行',
          description: '代码在线运行工具',
          href: '/tools/code',
          image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
        },
        {
          text: '在线同步绘画',
          description: '在线协作作图工具',
          href: '/tools/draw',
          image: 'https://images.leorain.cn/icons/tools/tool_draw.png'
        },
        {
          text: '在线剪切板',
          description: '在线同步剪切板',
          href: '/tools/clipboard',
          image: 'https://images.leorain.cn/icons/tools/tool_clipboard.png'
        },
        {
          text: '舒尔特表格测试',
          description: '舒尔特表格测试',
          href: '/tools/schulte',
          image: 'https://images.leorain.cn/icons/tools/tool_table_number.png'
        },
        {
          text: 'CPU运行模拟',
          description: 'CPU运行过程模拟',
          href: '/tools/cpu',
          image: 'https://images.leorain.cn/icons/tools/tool_cpu.png'
        },
        {
          text: '我很幸运',
          description: '模拟',
          href: '/tools/lottery',
          image: 'https://images.leorain.cn/icons/tools/tool_lucky.png'
        },
        // {
        //   text: '媒体处理',
        //   description: '在线处理图片视频，格式转换，压缩等',
        //   href: '/tools/media',
        //   image: 'https://images.leorain.cn/icons/tools/tool_picture.png'
        // },
        {
          text: '开发工具箱',
          description: '字符串处理、在线 linux 终端、媒体处理',
          href: '/tools/coder',
          image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
        },
        {
          text: '鱼乐一下',
          description: '钓鱼小游戏',
          href: '/tools/fish',
          image: 'https://images.leorain.cn/icons/tools/tool_fish.png'
        },
        // {
        //   text: 'Linux 在线终端',
        //   description: '在浏览器中运行真实的 Linux 容器，支持完整终端交互',
        //   href: '/tools/linux',
        //   image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
        // },
        {
          text: 'SBTI 人格测试',
          description: '娱乐向 SBTI 人格测试与维度分析',
          href: '/tools/sbti',
          image: '/images/logo.png'
        },
        {
          text: '能力测试',
          description: '娱乐向个人能力测试',
          href: '/topics',
          image: '/images/logo.png'
        }
      ],
      desktopNavItems: [
        { index: '/assets', text: '智能媒体', icon: 'Search' },
        { index: '/guestbook', text: '留言板', icon: 'ChatLineRound' },
        { index: '/games', text: '童年游戏', icon: 'Trophy' },
        { index: '/links', text: '友情链接', icon: 'LinkIcon' }
      ]
    }
  },
  created () {
    // 非响应式运行时状态，避免 Three / anime 实例被代理
    this._three = null
    this._raf = 0
    this._resizeObs = null
    this._themeObs = null
    this._reducedMotion = false
    this._logoLoop = null
    this._colorCycle = null
    this._tmpColor = null
    this._accentColor = null
    this._accentRgb = { r: 14 / 255, g: 165 / 255, b: 233 / 255 }
    this._logoSpinTimer = 0
  },
  computed: {
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    userAvatar () {
      return this.user?.avatar || 'https://images.leorain.cn/avatar/default_avatar.png'
    },
    isColorful () {
      return this.resolvedTheme === 'colorful'
    },
    logoImgStyle () {
      // 内联尺寸，避免被任何 transform / 样式层覆盖
      return {
        width: '60px',
        height: '60px',
        minWidth: '60px',
        minHeight: '60px',
        maxWidth: '60px',
        maxHeight: '60px'
      }
    },
    cursorGlowStyle () {
      return {
        left: `${this.cursorGlow.x}px`,
        top: `${this.cursorGlow.y}px`,
        opacity: this.cursorGlow.opacity
      }
    }
  },
  methods: {
    ...mapActions(useUserStore, ['logout', 'setShowLoginDialog']),

    // ---------- 主题（与 SiteInfo 写入的 data-theme 同步）----------
    readResolvedTheme () {
      return document.documentElement.getAttribute('data-theme') || 'white'
    },
    syncThemeFromDom () {
      const next = this.readResolvedTheme()
      if (next === this.resolvedTheme) {
        this.refreshAccentFromCss()
        return
      }
      this.resolvedTheme = next
      this.refreshAccentFromCss()
      this.applyThemeVisuals()
    },
    refreshAccentFromCss () {
      const root = getComputedStyle(document.documentElement)
      const accent = (root.getPropertyValue('--theme-accent-color') || '#0ea5e9').trim() || '#0ea5e9'
      this._accentColor = accent
      if (!this._tmpColor) this._tmpColor = new THREE.Color()
      this._tmpColor.set(accent)
      this._accentRgb = {
        r: this._tmpColor.r,
        g: this._tmpColor.g,
        b: this._tmpColor.b
      }
    },
    getThemePalette () {
      if (this.isColorful) return COLORFUL_PALETTE.slice()
      const root = getComputedStyle(document.documentElement)
      const pick = (name, fallback) => {
        const v = (root.getPropertyValue(name) || '').trim()
        return v || fallback
      }
      const accent = pick('--theme-accent-color', '#0ea5e9')
      const light3 = pick('--theme-primary-light-3', accent)
      const light5 = pick('--theme-primary-light-5', light3)
      const dark2 = pick('--theme-primary-dark-2', accent)
      // 主题色系：主色 + 明暗变体（去重）
      return [...new Set([accent, light3, light5, dark2, accent])]
    },
    applyThemeVisuals () {
      this.recolorParticles()
      // 彩色主题才做文字彩虹循环；其它主题停掉并恢复文字色
      if (this._colorCycle) {
        this._colorCycle.pause()
        this._colorCycle = null
      }
      const chars = this.$el?.querySelectorAll?.('.logo-char')
      if (chars?.length) {
        anime.remove(chars)
        if (this.isColorful && !this._reducedMotion) {
          this._colorCycle = anime({
            targets: chars,
            color: this.getThemePalette(),
            delay: anime.stagger(140),
            duration: 3200,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
          })
        } else {
          anime.set(chars, { color: '' })
        }
      }
    },
    setupThemeObserver () {
      this.resolvedTheme = this.readResolvedTheme()
      this.refreshAccentFromCss()
      this._themeObs = new MutationObserver(() => this.syncThemeFromDom())
      this._themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
    },
    disposeThemeObserver () {
      if (this._themeObs) {
        this._themeObs.disconnect()
        this._themeObs = null
      }
    },
    recolorParticles () {
      const t = this._three
      if (!t) return
      const palette = this.getThemePalette()
      const color = this._tmpColor || new THREE.Color()
      for (let i = 0; i < t.count; i++) {
        color.set(palette[i % palette.length])
        t.colors[i * 3] = color.r
        t.colors[i * 3 + 1] = color.g
        t.colors[i * 3 + 2] = color.b
      }
      t.geometry.attributes.color.needsUpdate = true
    },

    handleSelect (key) {
      this.activeIndex = key
      this.burstParticles(0.6)
    },
    handleCommand (command) {
      if (command === 'logout') {
        this.handleLogout()
      } else if (command === 'clear-cache') {
        responseApi.clearCache()
          .then(() => {
            this.$message.success('缓存已清除')
            this.$router.go(0)
          })
          .catch((err) => {
            const msg = err?.message || err?.response?.data?.message || '未知错误'
            this.$message.error('清除失败：' + msg)
          })
      } else if (command === '/login') {
        this.setShowLoginDialog(true)
      } else if (command.startsWith('http://') || command.startsWith('https://')) {
        window.open(command, '_blank')
      } else {
        this.$router.push(command)
      }
    },
    handleLogout () {
      this.logout()
      this.setShowLoginDialog(true)
    },

    // ---------- 鼠标交互 ----------
    onBannerMouseMove (e) {
      const banner = this.$refs.navBanner
      if (!banner) return
      const rect = banner.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      this.mouse.targetX = x / rect.width
      this.mouse.targetY = y / rect.height
      this.mouse.inside = true
      this.cursorGlow.x = x
      this.cursorGlow.y = y
      this.cursorGlow.opacity = 0.85
    },
    onBannerMouseLeave () {
      this.mouse.inside = false
      this.mouse.targetX = 0.5
      this.mouse.targetY = 0.5
      this.cursorGlow.opacity = 0
    },
    onMenuItemEnter (e) {
      if (this._reducedMotion) return
      const el = e.currentTarget
      anime.remove(el)
      anime({
        targets: el,
        scale: [1, 1.06, 1.03],
        duration: 420,
        easing: 'easeOutElastic(1, .6)'
      })
      const shine = el.querySelector('.nav-item-shine')
      if (shine) {
        anime.remove(shine)
        anime({
          targets: shine,
          translateX: ['-120%', '140%'],
          duration: 700,
          easing: 'easeInOutQuad'
        })
      }
    },
    onMenuItemLeave (e) {
      if (this._reducedMotion) return
      const el = e.currentTarget
      anime.remove(el)
      anime({
        targets: el,
        scale: 1,
        duration: 280,
        easing: 'easeOutQuad'
      })
      // 鼠标移出时立刻复位高光，避免 anime 留下的 translateX 卡在中间
      const shine = el.querySelector('.nav-item-shine')
      if (shine) {
        anime.remove(shine)
        anime.set(shine, { translateX: '-120%' })
      }
    },
    onLogoHover () {
      if (this._reducedMotion) return
      const wrap = this.$refs.logoWrap
      if (!wrap) return
      // 仅用 CSS 类触发旋转，绝不让 anime 写 transform（会留下 scale 导致 60*0.4≈24）
      wrap.classList.remove('is-logo-spin')
      // 强制重绘以重启动画
      // eslint-disable-next-line no-unused-expressions
      wrap.offsetWidth
      wrap.classList.add('is-logo-spin')
      window.clearTimeout(this._logoSpinTimer)
      this._logoSpinTimer = window.setTimeout(() => {
        wrap.classList.remove('is-logo-spin')
      }, 700)

      const palette = this.getThemePalette()
      const logoColors = this.isColorful
        ? palette
        : [
            { value: palette[0] },
            { value: palette[1] || palette[0] },
            { value: palette[0] }
          ]
      anime({
        targets: this.$el.querySelectorAll('.logo-char'),
        translateY: [
          { value: -6, duration: 180 },
          { value: 0, duration: 280 }
        ],
        color: logoColors,
        delay: anime.stagger(50),
        easing: 'easeOutQuad'
      })
      this.burstParticles(1)
    },
    onLoginHover (e) {
      if (this._reducedMotion) return
      const btn = e.currentTarget
      anime.remove(btn)
      anime({
        targets: btn,
        scale: [1, 1.08, 1.04],
        duration: 500,
        easing: 'easeOutElastic(1, .55)'
      })
    },
    onAvatarHover (e) {
      if (this._reducedMotion) return
      const ring = e.currentTarget.querySelector('.avatar-ring')
      if (!ring) return
      anime.remove(ring)
      anime({
        targets: ring,
        rotate: '+=360',
        duration: 900,
        easing: 'easeInOutSine'
      })
      anime({
        targets: e.currentTarget.querySelector('.user-avatar'),
        scale: [1, 1.1, 1.05],
        duration: 450,
        easing: 'easeOutElastic(1, .6)'
      })
    },

    // ---------- 入场动画 ----------
    playEntrance () {
      if (this._reducedMotion) return
      // logo 不要进入 anime 的 transform 目标列表
      const items = this.$el.querySelectorAll(
        '.desktop-menu.nav-item-animated, .desktop-menu.el-sub-menu, .user-menu-container, .mobile-more-menu'
      )
      anime.set(items, { opacity: 0, translateY: -18 })
      anime({
        targets: items,
        opacity: [0, 1],
        translateY: [-18, 0],
        delay: anime.stagger(70, { start: 80 }),
        duration: 650,
        easing: 'easeOutExpo'
      })

      // logo 入场只用 CSS，避免 anime 写 scale/transform 导致视觉 24px
      const logoItem = this.$el.querySelector('.nav-logo-item')
      const logoWrap = this.$refs.logoWrap
      if (logoItem) {
        logoItem.classList.add('is-logo-enter')
        window.setTimeout(() => logoItem.classList.remove('is-logo-enter'), 800)
      }
      if (logoWrap) {
        anime.remove(logoWrap)
        logoWrap.style.removeProperty('transform')
        logoWrap.style.removeProperty('opacity')
        logoWrap.classList.add('is-logo-enter-spin')
        window.setTimeout(() => logoWrap.classList.remove('is-logo-enter-spin'), 1000)
      }

      const palette = this.getThemePalette()
      const entranceColors = this.isColorful
        ? [
            { value: palette[0] },
            { value: palette[2] || palette[0] },
            { value: palette[1] || palette[0] }
          ]
        : [
            { value: palette[0] },
            { value: palette[1] || palette[0] },
            { value: palette[0] }
          ]
      anime({
        targets: this.$el.querySelectorAll('.logo-char'),
        opacity: [0, 1],
        translateY: [12, 0],
        color: entranceColors,
        delay: anime.stagger(90, { start: 200 }),
        duration: 700,
        easing: 'easeOutExpo'
      })
    },

    // ---------- 自动循环动效 ----------
    startLogoFloat () {
      // 纯 CSS 浮动，避免 anime transform 干扰尺寸
      const logoWrap = this.$refs.logoWrap
      if (!logoWrap) return
      if (this._logoLoop) {
        this._logoLoop.pause()
        this._logoLoop = null
      }
      anime.remove(logoWrap)
      logoWrap.style.removeProperty('transform')
      logoWrap.classList.add('is-logo-float')
    },
    startAutoEffects () {
      if (this._reducedMotion) return
      this.startLogoFloat()
      // 仅彩色主题做 logo 彩虹色循环；其它主题跟随主题色
      this.applyThemeVisuals()
    },

    // ---------- Three.js 粒子场 ----------
    initThree () {
      const canvas = this.$refs.fxCanvas
      const banner = this.$refs.navBanner
      if (!canvas || !banner) return

      const width = banner.clientWidth || 800
      const height = banner.clientHeight || 64
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      const count = isMobile ? 36 : 90

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        100
      )
      camera.position.z = 10

      // 粒子
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const velocities = []
      const base = []

      const color = this._tmpColor || new THREE.Color()
      const palette = this.getThemePalette()
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * width
        const y = (Math.random() - 0.5) * height
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = 0
        base.push({ x, y })

        color.set(palette[i % palette.length])
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        sizes[i] = 2 + Math.random() * 4
        velocities.push({
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.25,
          phase: Math.random() * Math.PI * 2,
          amp: 4 + Math.random() * 10
        })
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() }
        },
        // vertexColors: true 时 Three 会注入 attribute vec3 color，勿再声明
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          uniform float uPixelRatio;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (1.0 + 0.15 * sin(position.x * 0.05));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.05, d) * 0.75;
            gl_FragColor = vec4(vColor, alpha);
          }
        `
      })

      const points = new THREE.Points(geometry, material)
      scene.add(points)

      // 连线（鼠标附近的粒子连成彩色网）
      const lineMax = isMobile ? 40 : 100
      const linePositions = new Float32Array(lineMax * 2 * 3)
      const lineColors = new Float32Array(lineMax * 2 * 3)
      const lineGeom = new THREE.BufferGeometry()
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
      lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
      const lines = new THREE.LineSegments(lineGeom, lineMat)
      scene.add(lines)

      this._three = {
        renderer,
        scene,
        camera,
        geometry,
        material,
        points,
        positions,
        colors,
        base,
        velocities,
        count,
        lineGeom,
        linePositions,
        lineColors,
        lineMax,
        lines,
        width,
        height,
        burst: 0
      }

      this._resizeObs = new ResizeObserver(() => this.resizeThree())
      this._resizeObs.observe(banner)

      const tick = (t) => {
        this._raf = requestAnimationFrame(tick)
        this.updateThree(t * 0.001)
      }
      this._raf = requestAnimationFrame(tick)
    },

    resizeThree () {
      const banner = this.$refs.navBanner
      const t = this._three
      if (!banner || !t) return
      const width = banner.clientWidth || 800
      const height = banner.clientHeight || 64
      t.width = width
      t.height = height
      t.renderer.setSize(width, height, false)
      t.camera.left = -width / 2
      t.camera.right = width / 2
      t.camera.top = height / 2
      t.camera.bottom = -height / 2
      t.camera.updateProjectionMatrix()
    },

    burstParticles (strength = 1) {
      if (!this._three) return
      this._three.burst = Math.min(2.5, (this._three.burst || 0) + strength)
    },

    updateThree (time) {
      const t = this._three
      if (!t) return

      // 平滑鼠标
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08

      const mx = (this.mouse.x - 0.5) * t.width
      const my = (0.5 - this.mouse.y) * t.height
      const pos = t.positions
      const col = t.colors
      const { base, velocities, count } = t

      if (t.burst > 0) t.burst *= 0.92

      let lineIdx = 0
      const maxDist = this.mouse.inside ? 90 : 55
      const maxDist2 = maxDist * maxDist

      for (let i = 0; i < count; i++) {
        const v = velocities[i]
        const b = base[i]

        // 漂移 + 正弦浮动
        b.x += v.vx
        b.y += v.vy + Math.sin(time * 1.2 + v.phase) * 0.04
        if (b.x < -t.width / 2) b.x = t.width / 2
        if (b.x > t.width / 2) b.x = -t.width / 2
        if (b.y < -t.height / 2) b.y = t.height / 2
        if (b.y > t.height / 2) b.y = -t.height / 2

        let x = b.x
        let y = b.y

        // 鼠标吸引 / 排斥
        const dx = mx - x
        const dy = my - y
        const dist2 = dx * dx + dy * dy
        if (this.mouse.inside && dist2 < 140 * 140) {
          const dist = Math.sqrt(dist2) || 1
          const force = (1 - dist / 140) * 18
          x += (dx / dist) * force * 0.15
          y += (dy / dist) * force * 0.15
        }

        // 点击/选择爆发
        if (t.burst > 0.05) {
          const ang = v.phase + time
          x += Math.cos(ang) * t.burst * 12
          y += Math.sin(ang * 1.3) * t.burst * 8
        }

        pos[i * 3] = x
        pos[i * 3 + 1] = y

        // 彩色主题：HSL 彩虹循环；其它主题：围绕 accent 明暗脉动
        if (this.isColorful) {
          const hueShift = (time * 0.15 + i * 0.07) % 1
          this._tmpColor.setHSL(
            (0.55 + hueShift * 0.45 + (this.mouse.inside ? this.mouse.x * 0.2 : 0)) % 1,
            0.85,
            0.62
          )
        } else {
          const pulse = 0.78 + 0.22 * Math.sin(time * 1.4 + v.phase)
          const ar = this._accentRgb.r
          const ag = this._accentRgb.g
          const ab = this._accentRgb.b
          // 向白提亮，保持主题色相
          this._tmpColor.setRGB(
            ar + (1 - ar) * (1 - pulse) * 0.35,
            ag + (1 - ag) * (1 - pulse) * 0.35,
            ab + (1 - ab) * (1 - pulse) * 0.35
          )
        }
        col[i * 3] = this._tmpColor.r
        col[i * 3 + 1] = this._tmpColor.g
        col[i * 3 + 2] = this._tmpColor.b

        // 连线：靠近鼠标的粒子连向光标
        if (lineIdx < t.lineMax && this.mouse.inside && dist2 < maxDist2) {
          const li = lineIdx * 6
          t.linePositions[li] = x
          t.linePositions[li + 1] = y
          t.linePositions[li + 2] = 0
          t.linePositions[li + 3] = mx
          t.linePositions[li + 4] = my
          t.linePositions[li + 5] = 0
          t.lineColors[li] = this._tmpColor.r
          t.lineColors[li + 1] = this._tmpColor.g
          t.lineColors[li + 2] = this._tmpColor.b
          // 连线另一端也用主题色/彩虹色
          t.lineColors[li + 3] = this.isColorful ? 1 : this._accentRgb.r
          t.lineColors[li + 4] = this.isColorful ? 0.5 : this._accentRgb.g
          t.lineColors[li + 5] = this.isColorful ? 0.9 : this._accentRgb.b
          lineIdx++
        }
      }

      // 清空未使用线段
      for (let i = lineIdx; i < t.lineMax; i++) {
        const li = i * 6
        for (let k = 0; k < 6; k++) t.linePositions[li + k] = 0
      }

      t.geometry.attributes.position.needsUpdate = true
      t.geometry.attributes.color.needsUpdate = true
      t.lineGeom.attributes.position.needsUpdate = true
      t.lineGeom.attributes.color.needsUpdate = true
      t.material.uniforms.uTime.value = time
      t.renderer.render(t.scene, t.camera)
    },

    disposeThree () {
      if (this._raf) cancelAnimationFrame(this._raf)
      this._raf = 0
      if (this._resizeObs) {
        this._resizeObs.disconnect()
        this._resizeObs = null
      }
      const t = this._three
      if (!t) return
      t.geometry?.dispose()
      t.material?.dispose()
      t.lineGeom?.dispose()
      t.lines?.material?.dispose()
      t.renderer?.dispose()
      this._three = null
    },

    disposeAnime () {
      if (this._logoLoop) {
        this._logoLoop.pause()
        this._logoLoop = null
      }
      if (this._colorCycle) {
        this._colorCycle.pause()
        this._colorCycle = null
      }
      window.clearTimeout(this._logoSpinTimer)
      const logoWrap = this.$refs.logoWrap
      if (logoWrap) {
        anime.remove(logoWrap)
        logoWrap.style.removeProperty('transform')
        logoWrap.classList.remove('is-logo-float', 'is-logo-spin', 'is-logo-enter-spin')
      }
      if (this.$el) {
        anime.remove(
          this.$el.querySelectorAll(
            '.logo-char, .nav-item-animated, .login-btn, .user-avatar, .avatar-ring, .nav-item-shine, .user-menu-container, .mobile-more-menu, .desktop-menu'
          )
        )
      }
    }
  },
  watch: {
    $route (to) {
      this.activeIndex = to.path
      this.burstParticles(0.8)
    }
  },
  mounted () {
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this._tmpColor = new THREE.Color()
    this.setupThemeObserver()
    this.$nextTick(() => {
      if (!this._reducedMotion) {
        this.initThree()
        this.playEntrance()
        this.startAutoEffects()
      }
    })
  },
  beforeUnmount () {
    this.disposeThemeObserver()
    this.disposeAnime()
    this.disposeThree()
    this._tmpColor = null
  }
}
</script>

<style scoped lang="scss">
.nav-banner {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(
      120% 180% at 10% 0%,
      color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 18%, transparent),
      transparent 45%
    ),
    radial-gradient(
      100% 160% at 90% 100%,
      color-mix(in srgb, var(--theme-primary-light-3, #51bef1) 16%, transparent),
      transparent 50%
    ),
    var(--header-bg);
  backdrop-filter: blur(14px) saturate(180%);
  border-bottom: 1px solid transparent;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 8px 28px rgba(15, 23, 42, 0.06);

  &.is-colorful {
    background:
      radial-gradient(120% 180% at 10% 0%, rgba(255, 107, 157, 0.14), transparent 45%),
      radial-gradient(100% 160% at 90% 100%, rgba(96, 165, 250, 0.14), transparent 50%),
      radial-gradient(80% 120% at 50% 50%, rgba(192, 132, 252, 0.1), transparent 55%),
      var(--header-bg);
  }
}

.nav-fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.9;
}

.nav-cursor-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  margin-left: -110px;
  margin-top: -110px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 45%, transparent) 0%,
    color-mix(in srgb, var(--theme-primary-light-3, #51bef1) 28%, transparent) 40%,
    transparent 70%
  );
  filter: blur(8px);
  transition: opacity 0.35s ease;
  mix-blend-mode: screen;

  .is-colorful & {
    background: radial-gradient(
      circle,
      rgba(255, 107, 157, 0.35) 0%,
      rgba(96, 165, 250, 0.22) 35%,
      rgba(52, 211, 153, 0.1) 55%,
      transparent 70%
    );
  }
}

.nav-gradient-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  z-index: 3;
  background: linear-gradient(
    90deg,
    var(--theme-primary-dark-2, #0b84ba),
    var(--theme-accent-color, #0ea5e9),
    var(--theme-primary-light-3, #51bef1),
    var(--theme-accent-color, #0ea5e9),
    var(--theme-primary-dark-2, #0b84ba)
  );
  background-size: 200% 100%;
  animation: accent-flow 5s linear infinite;
  box-shadow:
    0 0 10px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 55%, transparent),
    0 0 20px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 30%, transparent);

  .is-colorful & {
    background: linear-gradient(
      90deg,
      #ff6b9d,
      #c084fc,
      #60a5fa,
      #34d399,
      #fbbf24,
      #fb7185,
      #22d3ee,
      #ff6b9d
    );
    background-size: 300% 100%;
    animation: rainbow-flow 6s linear infinite;
    box-shadow:
      0 0 12px rgba(255, 107, 157, 0.55),
      0 0 24px rgba(96, 165, 250, 0.35);
  }
}

.nav-scan-light {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 28%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 45%,
    rgba(255, 255, 255, 0.14) 50%,
    rgba(255, 255, 255, 0.06) 55%,
    transparent 100%
  );
  animation: scan-sweep 7s ease-in-out infinite;
  mix-blend-mode: soft-light;
}

@keyframes accent-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes rainbow-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

@keyframes scan-sweep {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateX(400%);
    opacity: 0;
  }
}

.nav-el-menu {
  position: relative;
  z-index: 2;
  background-color: transparent !important;
  border-bottom: none !important;
  display: flex;
  align-items: center;
  height: 64px;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    position: relative;
    border-bottom: none !important;
    border-radius: 12px;
    margin: 0 2px;
    height: 48px;
    line-height: 48px;
    color: var(--text-color, #111827);
    transition:
      color 0.25s ease,
      background 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.25s ease;
    overflow: hidden;
  }

  :deep(.el-menu-item:hover:not(.is-active):not(.nav-logo-item)),
  :deep(.el-sub-menu__title:hover) {
    background: linear-gradient(
      135deg,
      var(--theme-primary-dark-2, #0b84ba),
      var(--theme-accent-color, #0ea5e9) 55%,
      var(--theme-primary-light-3, #51bef1)
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 28%, transparent),
      0 0 0 1px rgba(255, 255, 255, 0.16) inset;

    .el-icon,
    .menu-icon {
      color: #fff !important;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
    }
  }

  // 选中态：实心胶囊 + 白字，对比更强（排除 logo）
  :deep(.el-menu-item.is-active:not(.nav-logo-item)) {
    background: linear-gradient(
      135deg,
      var(--theme-primary-dark-2, #0b84ba),
      var(--theme-accent-color, #0ea5e9) 55%,
      var(--theme-primary-light-3, #51bef1)
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    font-weight: 700;
    letter-spacing: 0.02em;
    box-shadow:
      0 4px 14px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 38%, transparent),
      0 0 0 1px rgba(255, 255, 255, 0.18) inset;

    .el-icon,
    .menu-icon {
      color: #fff !important;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.35));
    }

    &::after {
      content: '';
      position: absolute;
      left: 22%;
      right: 22%;
      bottom: 5px;
      height: 2px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.55);
      animation: none;
    }
  }

  // logo 在首页激活时只加粗文字，保持透明底
  :deep(.el-menu-item.nav-logo-item.is-active) {
    background: transparent !important;
    color: var(--theme-primary-dark-2, #0b84ba) !important;
    -webkit-text-fill-color: var(--theme-primary-dark-2, #0b84ba) !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    font-weight: 800;

    &::after {
      display: none;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    background: linear-gradient(
      135deg,
      var(--theme-primary-dark-2, #0b84ba),
      var(--theme-accent-color, #0ea5e9) 55%,
      var(--theme-primary-light-3, #51bef1)
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    font-weight: 700;
    box-shadow:
      0 4px 14px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 38%, transparent),
      0 0 0 1px rgba(255, 255, 255, 0.18) inset;

    .el-icon,
    .menu-icon {
      color: #fff !important;
    }
  }
}

.is-colorful .nav-el-menu {
  :deep(.el-menu-item:hover:not(.is-active):not(.nav-logo-item)),
  :deep(.el-sub-menu__title:hover) {
    background: linear-gradient(
      135deg,
      #ff6b9d,
      #c084fc 45%,
      #60a5fa
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    box-shadow:
      0 4px 14px rgba(192, 132, 252, 0.32),
      0 0 0 1px rgba(255, 255, 255, 0.18) inset;

    .el-icon,
    .menu-icon {
      color: #fff !important;
    }
  }

  :deep(.el-menu-item.is-active:not(.nav-logo-item)) {
    background: linear-gradient(
      135deg,
      #ff6b9d,
      #c084fc 45%,
      #60a5fa
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    box-shadow:
      0 4px 16px rgba(192, 132, 252, 0.42),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;

    &::after {
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.55);
      animation: none;
    }
  }

  :deep(.el-menu-item.nav-logo-item.is-active) {
    color: #5f27cd !important;
    -webkit-text-fill-color: #5f27cd !important;
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title),
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    background: linear-gradient(
      135deg,
      #ff6b9d,
      #c084fc 45%,
      #60a5fa
    ) !important;
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    background-clip: border-box !important;
    -webkit-background-clip: border-box !important;
    font-weight: 700;
    box-shadow:
      0 4px 16px rgba(192, 132, 252, 0.42),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;

    .el-icon,
    .menu-icon {
      color: #fff !important;
    }
  }
}

.nav-item-shine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40%;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.45),
    transparent
  );
  transform: translateX(-120%);
  mix-blend-mode: soft-light;
}

.nav-logo-item {
  font-weight: 700 !important;
  letter-spacing: 0.04em;
  height: 64px !important;
  line-height: 64px !important;
  overflow: visible !important;
  display: flex !important;
  align-items: center !important;
  padding-left: 10px !important;
  padding-right: 12px !important;
  /* 避免 Element 默认图标宽 24px 影响 logo 区布局 */
  --el-menu-icon-width: 60px;
}

.logo-img-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  min-width: 60px;
  min-height: 60px;
  margin-right: 10px;
  flex-shrink: 0;
  transform-origin: center center;
  will-change: transform;
}

.nav-logo-text {
  display: inline-flex;
  gap: 1px;
}

.logo-char {
  display: inline-block;
  will-change: transform, color;
}

.mobile-more-menu {
  display: none;
}

@include mobile {
  .desktop-menu {
    display: none !important;
  }
  .mobile-more-menu {
    display: block !important;
  }
  .login-btn-text {
    display: none;
  }
  .nav-el-menu {
    height: 56px;
  }
  .nav-logo-item {
    height: 56px !important;
    line-height: 56px !important;
    --el-menu-icon-width: 48px;
  }
  .logo-img-wrap {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
  }
}

.flex-grow {
  flex-grow: 1;
}

.user-menu-container {
  margin-left: 12px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 6px;
  outline: none;

  @include pc {
    margin-right: 20px;
  }
}

.el-dropdown-link {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--theme-el-bg-color, #fff), var(--theme-el-bg-color, #fff)) padding-box,
    linear-gradient(
      135deg,
      var(--theme-primary-dark-2, #0b84ba),
      var(--theme-accent-color, #0ea5e9),
      var(--theme-primary-light-3, #51bef1)
    ) border-box;
  transition:
    border-color 0.3s ease,
    transform 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 40%, transparent);

  &:hover {
    box-shadow: 0 0 16px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 55%, transparent);
  }

  .is-colorful & {
    background:
      linear-gradient(var(--theme-el-bg-color, #fff), var(--theme-el-bg-color, #fff)) padding-box,
      linear-gradient(135deg, #ff6b9d, #c084fc, #60a5fa, #34d399) border-box;

    &:hover {
      box-shadow: 0 0 16px rgba(192, 132, 252, 0.55);
    }
  }
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px dashed transparent;
  border-top-color: var(--theme-accent-color, #0ea5e9);
  border-right-color: var(--theme-primary-light-3, #51bef1);
  border-bottom-color: var(--theme-primary-dark-2, #0b84ba);
  border-left-color: var(--theme-primary-light-5, #87d3f4);
  pointer-events: none;
  opacity: 0.85;

  .is-colorful & {
    border-top-color: #ff6b9d;
    border-right-color: #60a5fa;
    border-bottom-color: #34d399;
    border-left-color: #c084fc;
  }
}

.menu-icon {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  object-fit: contain;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 30%, transparent));
}

.nav-logo-img {
  width: 60px !important;
  height: 60px !important;
  min-width: 60px !important;
  min-height: 60px !important;
  max-width: 60px !important;
  max-height: 60px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  object-fit: contain !important;
  flex-shrink: 0 !important;
  display: block !important;
  box-sizing: border-box !important;
  /* 尺寸锁死，禁止任何 transform 缩放图片本身 */
  transform: none !important;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 45%, transparent));

  .is-colorful & {
    filter: drop-shadow(0 0 10px rgba(255, 107, 157, 0.45));
  }
}

/* 穿透 Element Plus / 其它全局样式对菜单内 img 的约束 */
.nav-el-menu :deep(.nav-logo-item .logo-img-wrap) {
  display: inline-flex !important;
  width: 60px !important;
  height: 60px !important;
  min-width: 60px !important;
  min-height: 60px !important;
  max-width: 60px !important;
  max-height: 60px !important;
  flex-shrink: 0 !important;
}

.nav-el-menu :deep(.nav-logo-item .nav-logo-img),
.nav-el-menu :deep(.nav-logo-item img.nav-logo-img) {
  width: 60px !important;
  height: 60px !important;
  min-width: 60px !important;
  min-height: 60px !important;
  max-width: 60px !important;
  max-height: 60px !important;
  transform: none !important;
}

.logo-img-wrap.is-logo-float {
  animation: logo-float 2.2s ease-in-out infinite alternate;
}

.logo-img-wrap.is-logo-spin {
  animation: logo-wiggle 0.65s ease-out 1;
}

.logo-img-wrap.is-logo-enter-spin {
  animation: logo-enter-spin 0.9s cubic-bezier(0.22, 1.4, 0.36, 1) 1;
}

.nav-logo-item.is-logo-enter {
  animation: logo-item-enter 0.65s ease-out 1;
}

@keyframes logo-float {
  from { transform: translateY(-2px); }
  to { transform: translateY(3px); }
}

@keyframes logo-wiggle {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-12deg); }
  60% { transform: rotate(12deg); }
  100% { transform: rotate(0deg); }
}

@keyframes logo-enter-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes logo-item-enter {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@include mobile {
  .menu-icon {
    width: 40px;
    height: 40px;
  }
  .nav-logo-img {
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
    min-height: 48px !important;
    max-width: 48px !important;
    max-height: 48px !important;
  }

  .nav-el-menu :deep(.nav-logo-item .logo-img-wrap),
  .nav-el-menu :deep(.nav-logo-item .nav-logo-img),
  .nav-el-menu :deep(.nav-logo-item img.nav-logo-img) {
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
    min-height: 48px !important;
    max-width: 48px !important;
    max-height: 48px !important;
  }
}

.login-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    var(--theme-primary-dark-2, #0b84ba),
    var(--theme-accent-color, #0ea5e9) 50%,
    var(--theme-primary-light-3, #51bef1)
  );
  background-size: 200% 200%;
  animation: login-gradient 4s ease infinite;
  box-shadow:
    0 4px 16px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 35%, transparent),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow:
      0 6px 22px color-mix(in srgb, var(--theme-accent-color, #0ea5e9) 45%, transparent),
      0 0 0 1px rgba(255, 255, 255, 0.25) inset;
  }

  &:active {
    transform: scale(0.97);
  }

  .is-colorful & {
    background: linear-gradient(135deg, #ff6b9d, #c084fc 40%, #60a5fa 75%, #34d399);
    background-size: 200% 200%;
    box-shadow:
      0 4px 16px rgba(192, 132, 252, 0.35),
      0 0 0 1px rgba(255, 255, 255, 0.15) inset;

    &:hover {
      box-shadow:
        0 6px 22px rgba(255, 107, 157, 0.45),
        0 0 0 1px rgba(255, 255, 255, 0.25) inset;
    }
  }
}

.login-btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  animation: login-shine 2.8s ease-in-out infinite;
}

.login-icon {
  color: #fff;
}

@keyframes login-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes login-shine {
  0%,
  40% {
    transform: translateX(-100%);
  }
  70%,
  100% {
    transform: translateX(100%);
  }
}

/* 工具箱下拉项描述 */
.tool-menu-item {
  height: auto !important;
  line-height: 1.3 !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  align-items: flex-start !important;
}

.tool-menu-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tool-title {
  font-size: 14px;
  font-weight: 600;
}

.tool-desc {
  font-size: 11px;
  color: var(--muted-text-color, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-gradient-line,
  .nav-scan-light,
  .login-btn,
  .login-btn-glow {
    animation: none !important;
  }
}
</style>

<style lang="scss">
/* 工具箱弹层 */
.nav-tools-popper {
  .el-menu {
    max-height: min(70vh, 520px);
    overflow-y: auto;
    padding: 8px 8px 30px 8px;
    border-radius: 2px !important;
    border: none !important;
    background: var(--theme-el-bg-color-overlay, #fff) !important;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
  }

  .el-menu-item {
    border-radius: 10px;
    margin: 2px 0;

    &:hover {
      background: color-mix(
        in srgb,
        var(--theme-accent-color, #0ea5e9) 12%,
        transparent
      ) !important;
    }
  }
}

[data-theme='colorful'] .nav-tools-popper {
  .el-menu {
    background: var(--theme-el-bg-color-overlay, #fff) !important;
  }

  .el-menu-item:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 107, 157, 0.12),
      rgba(96, 165, 250, 0.12)
    ) !important;
  }
}

.user-dropdown-popper {
  .el-dropdown-menu {
    padding: 6px;
    border-radius: 12px;
    border: 1px solid transparent;
    background:
      linear-gradient(var(--theme-el-bg-color-overlay, #ffffff), var(--theme-el-bg-color-overlay, #ffffff)) padding-box,
      linear-gradient(
        135deg,
        var(--theme-primary-dark-2, #0b84ba),
        var(--theme-accent-color, #0ea5e9),
        var(--theme-primary-light-3, #51bef1)
      ) border-box;
    backdrop-filter: blur(12px) saturate(180%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
    min-width: 160px;
  }

  .el-dropdown-menu__item {
    padding: 8px 16px;
    border-radius: 8px;
    margin: 2px 0;
    font-size: 14px;
    color: var(--text-color, #111827);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      font-size: 16px;
      color: var(--muted-text-color, #6b7280);
      transition: color 0.2s ease;
    }

    &:hover,
    &:focus {
      background: color-mix(
        in srgb,
        var(--theme-accent-color, #0ea5e9) 12%,
        transparent
      );
      color: var(--theme-accent-color, #0ea5e9);

      .el-icon {
        color: var(--theme-accent-color, #0ea5e9);
      }
    }

    &.is-disabled {
      opacity: 0.5;
    }
  }

  .el-dropdown-menu__item--divided {
    margin-top: 6px;
    border-top: 1px solid var(--theme-el-border-color-extra-light, #f2f6fc);
    padding-top: 10px;

    &::before {
      display: none;
    }
  }

  .el-popper__arrow {
    display: none;
  }
}

[data-theme='colorful'] .user-dropdown-popper {
  .el-dropdown-menu {
    background:
      linear-gradient(var(--theme-el-bg-color-overlay, #ffffff), var(--theme-el-bg-color-overlay, #ffffff)) padding-box,
      linear-gradient(135deg, #ff6b9d, #c084fc, #60a5fa) border-box;
  }

  .el-dropdown-menu__item:hover,
  .el-dropdown-menu__item:focus {
    background: linear-gradient(
      135deg,
      rgba(255, 107, 157, 0.12),
      rgba(96, 165, 250, 0.14)
    );
  }
}
</style>
