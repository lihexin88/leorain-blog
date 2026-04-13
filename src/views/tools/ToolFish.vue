<script>
import fishApi from '@/apis/fish'
import * as THREE from 'three'

export default {
  name: 'ToolFish',
  data () {
    return {
      // 弹窗显示状态
      dialogVisible: false,
      // 移动按钮数据
      movingFishes: [],
      // 动画帧ID
      animationFrame: null,
      // 气泡数据
      bubbles: [],
      // 气泡动画帧ID
      bubbleAnimationFrame: null,
      // 鼠标位置
      mouseX: 0,
      mouseY: 0,
      // 鱼的躲避冷却时间记录
      fishCooldowns: {},
      // 抓取动作状态
      isGrabbing: false,
      // 当前帧率
      fps: 0,

      // 游戏状态
      fishing: false,
      // 进度条位置
      progress: 0,
      // 目标区域位置
      targetArea: 0,
      // 命中次数
      hits: 0,
      // 未命中次数
      misses: 0,
      // 消息
      message: '',
      // 移动方向，1为向右，-1为向左
      direction: 1,
      // 移动速度
      moveSpeed: 0.5,
      showItemDialog: false,
      itemObj: {
        cover_display: '',
        description: '',
        id: 0,
        name: '',
        price: 0
      }
    }
  },
  created () {
    // 初始化 Three.js 相关的非响应式属性
    this.scene = null
    this.camera = null
    this.renderer = null
    this.fishGroup = null
    this.bubbleGroup = null
    this.fishMeshes = []
    this.bubbleMeshes = []
    this.fishElements = []

    // 游戏相关的非响应式属性
    this.timer = null
    this.sceneFrame = null
    this.fpsLastTime = 0
    this.fpsFrameCount = 0
  },
  methods: {
    // 初始化 Three.js 场景
    initThreeScene () {
      // 创建场景
      this.scene = new THREE.Scene()

      // 创建相机
      this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        1000
      )
      this.camera.position.z = 10

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setClearColor(0x000000, 0) // 透明背景
      this.renderer.setPixelRatio(window.devicePixelRatio)

      // 创建鱼和气泡的组
      this.fishGroup = new THREE.Group()
      this.bubbleGroup = new THREE.Group()
      this.scene.add(this.fishGroup)
      this.scene.add(this.bubbleGroup)

      // 将渲染器添加到DOM
      const canvasContainer = document.createElement('div')
      canvasContainer.style.position = 'absolute'
      canvasContainer.style.top = '0'
      canvasContainer.style.left = '0'
      canvasContainer.style.width = '100%'
      canvasContainer.style.height = '100%'
      canvasContainer.style.pointerEvents = 'auto'
      canvasContainer.style.zIndex = '1'
      this.$el.appendChild(canvasContainer)
      canvasContainer.appendChild(this.renderer.domElement)

      // 添加点击事件监听器
      this.renderer.domElement.addEventListener('click', this.handleFishClick)

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleWindowResize)
    },

    // 处理窗口大小变化
    handleWindowResize () {
      if (!this.camera || !this.renderer) return

      this.camera.left = window.innerWidth / -2
      this.camera.right = window.innerWidth / 2
      this.camera.top = window.innerHeight / 2
      this.camera.bottom = window.innerHeight / -2
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(window.innerWidth, window.innerHeight)
    },

    // 创建气泡的网格
    createBubbleMesh (bubbleData) {
      // 创建圆形几何体
      const geometry = new THREE.CircleGeometry(bubbleData.size / 2, 16)

      // 提取 hsl 颜色而不包含 alpha 通道，因为 THREE.Color 不支持 alpha
      const hslColor = bubbleData.color1.replace('hsla', 'hsl').replace(/,[^,]+\)$/, ')')

      // 创建材质
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hslColor),
        transparent: true,
        opacity: bubbleData.opacity,
        side: THREE.DoubleSide
      })

      // 创建网格
      const mesh = new THREE.Mesh(geometry, material)

      // 设置初始位置
      mesh.position.set(
        bubbleData.x - window.innerWidth / 2,
        window.innerHeight / 2 - bubbleData.y,
        0
      )

      // 保存原始数据引用
      mesh.userData = bubbleData

      return mesh
    },
    // 初始化移动按钮
    initMovingButtons () {
      // 初始化 Three.js 场景（仅用于气泡）
      if (!this.scene) {
        this.initThreeScene()
      }

      const buttons = []
      for (let i = 0; i < 50; i++) { // 恢复为20条鱼
        const speedX = (Math.random() - 0.5) * 2 // -1 到 1 之间的随机速度
        const speedY = (Math.random() - 0.5) * 2
        // 计算初始角度（弧度转换为角度）
        const angle = Math.atan2(speedY, speedX) * (180 / Math.PI)

        // 为每条鱼生成固定的随机颜色
        const getRandomColor = () => {
          const hue = Math.floor(Math.random() * 360)
          const saturation = Math.floor(Math.random() * 50 + 50)
          const lightness = Math.floor(Math.random() * 40 + 40)
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`
        }

        const color1 = getRandomColor()
        const color2 = getRandomColor()
        const color3 = getRandomColor()

        const fishData = {
          id: i,
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 40),
          speedX,
          speedY,
          size: Math.random() * (40 - 20) + 40, // 60 到 100 之间的随机大小
          angle,
          // 初始化鱼的躲避冷却时间
          lastDodgeTime: 0,
          // 为每条鱼保存固定的随机颜色
          colors: { color1, color2, color3 }
        }

        buttons.push(fishData)
      }

      this.movingFishes = buttons
      this.initBubbles()
      this.createFishElements()
      this.startSceneLoop()
    },
    // 初始化气泡
    initBubbles () {
      const bubbles = []
      for (let i = 0; i < 25; i++) {
        // 生成随机的浅色调
        const hue = Math.random() * 360 // 色相范围 0-360
        const saturation = Math.random() * 30 + 40 // 饱和度范围 40-70%
        const lightness = Math.random() * 20 + 70 // 亮度范围 70-90%
        const color1 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`
        const color2 = `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.4)`

        const bubbleData = {
          id: i,
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + Math.random() * 200, // 初始位置在屏幕下方
          size: Math.random() * (30 - 10) + 10, // 10 到 30 之间的随机大小
          speed: Math.random() * (2 - 0.5) + 0.5, // 0.5 到 2 之间的随机速度
          opacity: Math.random() * (0.7 - 0.3) + 0.3, // 0.3 到 0.7 之间的随机透明度
          color1,
          color2
        }

        bubbles.push(bubbleData)

        // 创建 Three.js 气泡网格并添加到场景
        const bubbleMesh = this.createBubbleMesh(bubbleData)
        this.bubbleGroup.add(bubbleMesh)
        this.bubbleMeshes.push(bubbleMesh)
      }
      this.bubbles = bubbles
    },
    // 更新气泡位置
    updateBubbles () {
      for (let i = 0; i < this.bubbles.length; i++) {
        const bubble = this.bubbles[i]
        let newY = bubble.y - bubble.speed
        let newOpacity = bubble.opacity

        const positionRatio = newY / window.innerHeight
        if (positionRatio < 0.2) {
          newOpacity = bubble.opacity * positionRatio * 5
        }

        if (newY < -bubble.size) {
          newY = window.innerHeight + Math.random() * 200
          bubble.x = Math.random() * window.innerWidth
          newOpacity = Math.random() * (0.7 - 0.3) + 0.3
        }

        const mesh = this.bubbleMeshes[i]
        if (mesh) {
          mesh.position.set(
            bubble.x - window.innerWidth / 2,
            window.innerHeight / 2 - newY,
            0
          )
          mesh.material.opacity = newOpacity
        }

        bubble.y = newY
        bubble.opacity = newOpacity
      }
    },
    // 开始移动气泡和鱼的统一动画循环
    startSceneLoop () {
      const animate = (time) => {
        const currentTime = time || Date.now()

        this.updateBubbles()
        this.updateMovingFishes(currentTime)

        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera)
        }

        this.updateFps(currentTime)
        this.sceneFrame = requestAnimationFrame(animate)
      }

      if (this.sceneFrame) {
        cancelAnimationFrame(this.sceneFrame)
      }
      this.sceneFrame = requestAnimationFrame(animate)
    },
    // 更新鱼的位置
    updateMovingFishes (currentTime) {
      for (let i = 0; i < this.movingFishes.length; i++) {
        const fish = this.movingFishes[i]
        let newX = fish.x + fish.speedX
        let newY = fish.y + fish.speedY
        let newSpeedX = fish.speedX
        let newSpeedY = fish.speedY

        if (newX <= 0 || newX >= window.innerWidth - fish.size) {
          newSpeedX = -newSpeedX
          newX = newX <= 0 ? 0 : window.innerWidth - fish.size
        }

        if (newY <= 0 || newY >= window.innerHeight - 40) {
          newSpeedY = -newSpeedY
          newY = newY <= 0 ? 0 : window.innerHeight - 40
        }

        if (Math.random() < 0.001) {
          newSpeedX = (Math.random() - 0.5) * 2
          newSpeedY = (Math.random() - 0.5) * 2
        }

        const fishCenterX = fish.x + fish.size / 2
        const fishCenterY = fish.y + fish.size * 0.2
        const distance = Math.sqrt(
          Math.pow(fishCenterX - this.mouseX, 2) +
          Math.pow(fishCenterY - this.mouseY, 2)
        )

        if (distance < 80 && currentTime - fish.lastDodgeTime > 500) {
          const dx = fishCenterX - this.mouseX
          const dy = fishCenterY - this.mouseY
          const magnitude = Math.sqrt(dx * dx + dy * dy)
          if (magnitude > 0) {
            newSpeedX = (dx / magnitude) * 1.2
            newSpeedY = (dy / magnitude) * 1.2
            fish.lastDodgeTime = currentTime
          }
        }

        const angle = Math.atan2(newSpeedY, newSpeedX) * (180 / Math.PI)
        const fishEl = this.fishElements[i]
        if (fishEl) {
          fishEl.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${angle}deg)`
        }

        fish.x = newX
        fish.y = newY
        fish.speedX = newSpeedX
        fish.speedY = newSpeedY
        fish.angle = angle
      }
    },

    // 创建鱼的 DOM 元素
    createFishElements () {
      const fishContainer = this.$el

      this.movingFishes.forEach(fish => {
        const fishEl = document.createElement('div')
        fishEl.className = `moving-fishes fish-button fish-${fish.id}`
        fishEl.style.position = 'absolute'
        fishEl.style.left = '0'
        fishEl.style.top = '0'
        fishEl.style.width = `${fish.size}px`
        fishEl.style.height = `${fish.size}px`
        fishEl.style.zIndex = '5'
        fishEl.style.backgroundImage = `url('data:image/svg+xml,${encodeURIComponent(this.generateFishSVG(fish.colors, fish.id))}')`
        fishEl.style.backgroundSize = 'contain'
        fishEl.style.backgroundRepeat = 'no-repeat'
        fishEl.style.backgroundPosition = 'center'
        fishEl.style.transform = `translate3d(${fish.x}px, ${fish.y}px, 0) rotate(${fish.angle}deg)`
        fishEl.style.transformOrigin = 'center'
        fishEl.style.pointerEvents = 'auto'
        fishEl.style.willChange = 'transform'

        // 添加点击事件
        fishEl.addEventListener('click', (e) => {
          e.stopPropagation()
          this.openDialog()
        })

        fishContainer.appendChild(fishEl)
        this.fishElements.push(fishEl)
      })
    },
    // 更新 FPS 显示
    updateFps (currentTime) {
      if (!this.fpsLastTime) {
        this.fpsLastTime = currentTime
        this.fpsFrameCount = 0
        return
      }

      this.fpsFrameCount++
      const elapsed = currentTime - this.fpsLastTime
      if (elapsed >= 500) {
        this.fps = Math.round((this.fpsFrameCount * 1000) / elapsed)
        this.fpsFrameCount = 0
        this.fpsLastTime = currentTime
      }
    },
    // 打开弹窗并开始游戏
    openDialog () {
      this.dialogVisible = true
      this.startFishing()
    },
    // 开始钓鱼游戏
    startFishing () {
      this.fishing = true
      this.progress = 0
      this.direction = 1 // 初始方向为向右
      this.hits = 0
      this.misses = 0 // 重置未命中次数
      this.message = ''
      this.moveSpeed = 0.5 // 重置速度
      this.setTargetArea()
      this.moveProgressBar()
    },
    // 设置目标区域位置
    setTargetArea () {
      // 随机生成目标区域位置，范围在10%-90%之间
      this.targetArea = Math.floor(Math.random() * 80) + 10
    },
    // 移动进度条
    moveProgressBar () {
      if (!this.fishing) return

      // 清除之前的速度定时器（如果有）
      if (this.speedTimer) {
        clearInterval(this.speedTimer)
        this.speedTimer = null
      }

      // 设置定时器，每0.4秒随机改变一次移动速度
      this.speedTimer = setInterval(() => {
        // 随机生成速度
        this.moveSpeed = Math.random() * 2 + 0.5
      }, 400)

      // 使用requestAnimationFrame实现更连续的动画
      const animate = () => {
        if (!this.fishing) return
        // 根据方向和当前速度移动进度条
        this.progress += this.moveSpeed * this.direction

        // 到达右边界时改变方向
        if (this.progress >= 100) {
          this.progress = 100
          this.direction = -1 // 改为向左移动
        } else if (this.progress <= 0) {
          // 到达左边界时改变方向
          this.progress = 0
          this.direction = 1 // 改为向右移动
          this.setTargetArea() // 只在到达左边界时重置目标区域
        }

        // 继续下一帧动画
        this.timer = requestAnimationFrame(animate)
      }

      // 开始动画
      this.timer = requestAnimationFrame(animate)
    },
    // 击中目标
    hitTarget () {
      // 增加命中判定区域，从±5改为±10
      if (this.progress > this.targetArea - 10 && this.progress < this.targetArea + 10) {
        this.hits++
        this.message = '命中！'
        this.setTargetArea()

        // 每次命中都调用后端接口
        this.fishing = false // 先暂停动画，等待请求结果
        fishApi.takeItem()
          .then((response) => {
            const data = response || {}
            if (data.status === 'granted') {
              this.itemObj = data.item
              this.showItemDialog = true
              this.dialogVisible = false
              this.message = ''
            } else if (data.status === 'pending') {
              const left = data.attempts_left || 0
              if (left > 0) {
                this.$message.info(`命中成功！还需再命中 ${left} 次`)
                // 继续游戏
                this.startFishingAfterHit()
              } else {
                // 理论上不会走到这里，因为 left=0 时 status 应该是 granted
                this.startFishingAfterHit()
              }
            } else if (data.status === 'out_of_stock') {
              this.$message.error('很遗憾，物资已发完')
              setTimeout(() => {
                this.dialogVisible = false
              }, 1200)
              this.message = ''
            } else {
              this.$message.info('已记录本次命中，请继续加油~')
              this.startFishingAfterHit()
            }
          })
          .catch(() => {
            this.$message.error('请求失败，请稍后再试')
            this.fishing = true
            this.moveProgressBar()
          })
      } else {
        this.misses++
        this.message = '未命中！'
        if (this.misses >= 5) {
          this.fishing = false
          this.$message.error('鱼跑了！未命中次数过多。')
          setTimeout(() => {
            this.dialogVisible = false
          }, 1500)
          this.message = ''
        }
      }
    },
    // 命中后的继续游戏（不重置hits）
    startFishingAfterHit () {
      this.fishing = true
      this.progress = 0
      this.direction = 1
      this.message = ''
      this.moveSpeed = 0.5 // 重置速度
      this.setTargetArea()
      this.moveProgressBar()
    },
    // 键盘事件处理
    onKeyDown (event) {
      // 只在游戏进行中且弹窗打开时响应空格键
      if (event.key === ' ' && this.fishing && this.dialogVisible) {
        event.preventDefault() // 防止空格键滚动页面
        this.hitTarget()
      }
    },
    // 更新鼠标位置
    updateMousePosition (event) {
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    },
    // 处理点击抓取动作
    handleGrabClick () {
      this.isGrabbing = true
      // 200ms后恢复抓取状态
      setTimeout(() => {
        this.isGrabbing = false
      }, 200)
    },

    // 处理鱼的点击事件
    handleFishClick (event) {
      // 将鼠标坐标转换为 Three.js 坐标系
      const mouse = new THREE.Vector2()
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      // 创建射线投射器
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, this.camera)

      // 检测与鱼的交点
      const intersects = raycaster.intersectObjects(this.fishMeshes)

      // 如果点击到了鱼
      if (intersects.length > 0) {
        // 阻止事件冒泡
        event.stopPropagation()
        // 打开钓鱼游戏对话框
        this.openDialog()
      }
    },

    // 关闭弹窗
    handleClose (done) {
      this.fishing = false
      if (this.timer) {
        cancelAnimationFrame(this.timer)
      }
      done() // 调用done()关闭弹窗
    },
    // 生成带有渐变色的鱼形 SVG
    generateFishSVG (colors, id) {
      // 使用传入的颜色参数
      const { color1, color2, color3 } = colors

      // 创建SVG
      return `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="50px" height="50px" style="shape-rendering:auto; text-rendering:auto; image-rendering:auto; fill-rule:evenodd; clip-rule:evenodd" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs>
            <linearGradient id="fishGradient${id}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${color2};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${color3};stop-opacity:1" />
            </linearGradient>
          </defs>
          <g><path style="opacity:0.651" fill="url(#fishGradient${id})" d="M 14.5,7.5 C 24.5737,5.47386 33.0737,8.14053 40,15.5C 41.569,19.072 43.9024,22.072 47,24.5C 47.6667,25.8333 47.6667,27.1667 47,28.5C 37.3963,40.4452 25.2297,44.1119 10.5,39.5C 10.1918,36.2501 10.0252,32.9167 10,29.5C 8.11699,30.6526 7.28366,32.3193 7.5,34.5C 2.83826,33.5597 0.838264,30.5597 1.5,25.5C 0.838264,20.4403 2.83826,17.4403 7.5,16.5C 8.32091,21.9067 9.98758,22.4067 12.5,18C 8.15534,13.5278 8.82201,10.0278 14.5,7.5 Z M 15.5,10.5 C 18.1873,10.3359 20.854,10.5026 23.5,11C 20.2744,12.198 17.4411,14.0314 15,16.5C 13.1878,14.0793 13.3545,12.0793 15.5,10.5 Z M 28.5,12.5 C 32.9951,12.9122 36.3284,15.0789 38.5,19C 34.7066,20.0538 32.3733,22.5538 31.5,26.5C 33.8939,29.0652 34.8939,31.8985 34.5,35C 30.6251,36.5204 26.6251,36.8538 22.5,36C 18.8683,33.3702 15.535,30.3702 12.5,27C 9.36365,25.9595 6.86365,26.7928 5,29.5C 4.33333,26.8333 4.33333,24.1667 5,21.5C 6.86365,24.2072 9.36365,25.0405 12.5,24C 16.6723,18.295 22.0057,14.4616 28.5,12.5 Z M 40.5,23.5 C 41.9616,24.4577 43.2949,25.6244 44.5,27C 42.6667,28.8333 40.8333,30.6667 39,32.5C 35.7048,29.5315 35.2048,26.3649 37.5,23C 38.7494,22.2599 39.7494,22.4265 40.5,23.5 Z M 13.5,33.5 C 15.34,35.168 17.34,36.668 19.5,38C 17.0288,38.7063 14.6954,38.373 12.5,37C 13.3366,35.9887 13.67,34.8221 13.5,33.5 Z"/></g>
          <g><path style="opacity:0.766" fill="url(#fishGradient${id})" d="M 40.5,23.5 C 40.3605,25.337 39.6939,25.6704 38.5,24.5C 38.9569,23.7025 39.6236,23.3691 40.5,23.5 Z"/></g>
        </svg>
      `
    },
    goUserProfile () {
      this.$router.push({
        name: 'UserProfile'
      })
    }

  },
  mounted () {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('mousemove', this.updateMousePosition)
    this.initMovingButtons()
  },
  beforeUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('mousemove', this.updateMousePosition)
    window.removeEventListener('resize', this.handleWindowResize)

    if (this.timer) {
      cancelAnimationFrame(this.timer)
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    if (this.bubbleAnimationFrame) {
      cancelAnimationFrame(this.bubbleAnimationFrame)
    }
    if (this.sceneFrame) {
      cancelAnimationFrame(this.sceneFrame)
    }

    // 清理鱼的 DOM 元素
    this.fishElements.forEach((fishEl) => {
      if (fishEl && fishEl.parentNode) {
        fishEl.parentNode.removeChild(fishEl)
      }
    })

    // 清理 Three.js 资源
    if (this.renderer) {
      // 移除事件监听器
      this.renderer.domElement.removeEventListener('click', this.openDialog)

      // 从父元素中移除渲染器 DOM 元素
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }

      // 释放渲染器资源
      this.renderer.dispose()
    }

    // 清理几何体和材质
    this.bubbleMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) mesh.material.dispose()
    })

    // 清空数组
    this.bubbleMeshes = []
    this.fishElements = []
  }
}
</script>

<template>
  <div class="fish-container" :class="{ 'grabbing': isGrabbing }" @click="handleGrabClick">
    <div class="fps-badge">FPS {{ fps }}</div>
    <!-- Three.js 渲染器将通过 JavaScript 动态添加 -->
    <!-- 鱼的 DOM 元素将通过 JavaScript 动态添加 -->

    <el-dialog
        v-model="dialogVisible"
        title="钓鱼小游戏"
        width="30%"
        max-width="600px"
        :before-close="handleClose"
        center
        :close-on-click-modal="false"
    >
      <div v-if="fishing" class="game-container">
        <div class="stats">
          <p>命中次数: {{ hits }}/3 | 未命中次数: {{ misses }}/5</p>
          <p class="message" :class="{ 'hit': message === '命中！', 'miss': message === '未命中！' }">{{ message }}</p>
        </div>

        <div class="progress-container">
          <!-- 只显示中间滑动的部分，不显示左侧进度条 -->
          <div class="progress-track"></div>
          <div class="progress-indicator" :style="{ left: progress + '%' }"></div>
          <!-- 增加目标区域宽度 -->
          <div class="target-area" :style="{ left: (targetArea - 10) + '%', width: '20%' }"></div>
        </div>

        <div class="instructions">
          <p>按空格键或点击下方按钮击中目标区域！</p>
          <p>累计命中3次即可获得物资！未命中5次鱼会跑掉！</p>
        </div>

        <div class="action-button-container">
          <el-button type="primary" size="medium" @click="hitTarget" class="fish-button">拉线</el-button>
        </div>
      </div>
    </el-dialog>
    <el-dialog v-model="showItemDialog" :close-on-click-modal="false" width="420px" center>
      <div class="item-dialog">
        <div class="item-dialog__title">恭喜获得{{ itemObj.name }}</div>
        <el-image v-if="itemObj.cover_display" class="item-dialog__image" :src="itemObj.cover_display" fit="contain" />
        <div class="item-dialog__description">{{ itemObj.description }}</div>
        <div class="item-dialog__price">市场估值 {{ itemObj.price }}</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showItemDialog = false">
          开心收下
        </el-button>
        <el-button @click="goUserProfile">我的物资</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.item-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 4px;
}

.fps-badge {
  position: fixed;
  top: 72px;
  right: 12px;
  z-index: 20;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  backdrop-filter: blur(4px);
}

.item-dialog__title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.item-dialog__image {
  width: 180px;
  height: 180px;
  margin-bottom: 16px;
}

.item-dialog__description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.item-dialog__price {
  font-size: 14px;
  color: #909399;
}

.fish-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.fish-container.grabbing {
  cursor: grab;
}

.fish-container.grabbing:active {
  cursor: grabbing;
}

.main-button {
  position: relative;
  z-index: 10;
}

.moving-fishes {
  position: absolute;
  z-index: 5;
  transition: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  /* 背景颜色现在通过内联样式动态设置 */
  border: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 1;
  pointer-events: none; // 确保气泡不会阻挡点击事件
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.stats {
  margin-bottom: 20px;
  text-align: center;

  .message {
    font-weight: bold;
    margin-top: 10px;

    &.hit {
      color: #67c23a;
    }

    &.miss {
      color: #f56c6c;
    }
  }
}

.progress-container {
  width: 90%;
  max-width: 500px;
  height: 30px;
  position: relative;
  margin-bottom: 20px;
}

.progress-track {
  width: 100%;
  height: 100%;
  background-color: #ebeef5;
  border-radius: 15px;
}

.progress-indicator {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  background-color: #409eff;
  border-radius: 3px;
  transform: translateX(-3px);
  z-index: 2;
}

.target-area {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: rgba(103, 194, 58, 0.3);
  border-left: 2px solid #67c23a;
  border-right: 2px solid #67c23a;
  border-radius: 15px;
}

.instructions {
  text-align: center;
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
}

.action-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;

  .fish-button {
    padding: 12px 30px;
    font-size: 16px;
  }
}

// 响应式对话框宽度
@media (max-width: 768px) {
  ::v-deep .el-dialog {
    width: 90% !important;
  }
}
</style>
