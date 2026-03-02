<template>
  <div ref="container" class="tag-cloud-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  }
})

const container = ref(null)
let scene; let camera; let renderer; let webglRenderer; let controls; let objects = []
let animationId
let isHovered = false
const worldPos = new THREE.Vector3()
const cameraWorldPos = new THREE.Vector3()

const init = () => {
  if (!container.value) return

  const width = container.value.clientWidth || 300
  const height = 300

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000)
  camera.position.z = 500

  // 1. 初始化 WebGL 渲染器 (用于绘制带材质和光照的球体)
  webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  webglRenderer.setSize(width, height)
  webglRenderer.setPixelRatio(window.devicePixelRatio)
  webglRenderer.domElement.style.position = 'absolute'
  webglRenderer.domElement.style.top = '0'
  webglRenderer.domElement.style.zIndex = '1'
  container.value.appendChild(webglRenderer.domElement)

  // 2. 初始化 CSS3D 渲染器 (用于渲染词云标签)
  renderer = new CSS3DRenderer()
  renderer.setSize(width, height)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.zIndex = '2'
  container.value.appendChild(renderer.domElement)

  // 3. 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 1.2)
  pointLight.position.set(500, 500, 500)
  scene.add(pointLight)

  // 4. 添加带材质的球体
  const sphereGeometry = new THREE.SphereGeometry(200, 64, 64)
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x39b4ff,
    metalness: 0.3,
    roughness: 0.4,
    transparent: false
  })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  scene.add(sphere)

  // 5. 添加线框球体以增强“弧度”视觉感
  const wireframe = new THREE.Mesh(
    new THREE.SphereGeometry(201, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x67c23a,
      wireframe: true,
      transparent: true,
      opacity: 0.05
    })
  )
  scene.add(wireframe)

  // 6. 初始化轨道控制器 (支持拖动和缩放)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.minDistance = 250
  controls.maxDistance = 1500
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.5

  // 绑定悬停事件
  container.value.addEventListener('mouseenter', () => { isHovered = true })
  container.value.addEventListener('mouseleave', () => { isHovered = false })

  createTags()
  animate()
}

const createTags = () => {
  // 清理旧对象
  objects.forEach(obj => scene.remove(obj))
  objects = []

  if (!props.tags || props.tags.length === 0) return

  const radius = 220 // 稍微增大一点半径
  const count = props.tags.length

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count)
    const theta = Math.sqrt(count * Math.PI) * phi

    const element = document.createElement('div')
    // 使用 element-plus 的原生 class
    element.className = 'el-tag el-tag--success pointer-style'
    element.style.cursor = 'pointer'
    element.textContent = props.tags[i]
    element.style.transition = 'transform 0.2s ease, background-color 0.2s ease, opacity 0.3s ease'

    const object = new CSS3DObject(element)
    object.position.x = radius * Math.sin(phi) * Math.cos(theta)
    object.position.y = radius * Math.sin(phi) * Math.sin(theta)
    object.position.z = radius * Math.cos(phi)

    // 让标签贴在球面上：面朝球心外侧
    const target = object.position.clone().multiplyScalar(2)
    object.lookAt(target)

    scene.add(object)
    objects.push(object)
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 更新控制器状态
  if (controls) {
    controls.autoRotate = !isHovered
    controls.update()
  }

  // 更新场景的世界矩阵，以便获取正确的物体世界坐标
  scene.updateMatrixWorld()

  // 获取相机世界坐标（用于计算相对朝向）
  camera.getWorldPosition(cameraWorldPos)
  // 获取指向相机的标准化方向向量
  cameraWorldPos.normalize()

  // 处理透明度
  objects.forEach(obj => {
    // 获取标签在世界坐标系中的位置
    obj.getWorldPosition(worldPos)

    // 标准化标签位置向量 (从球心 (0,0,0) 指向标签)
    // 注意: normalize() 会修改原向量，但本次循环后续不再使用原始坐标，故无妨
    worldPos.normalize()

    // 计算点积: 1.0 (正对相机) -> 0.0 (侧面) -> -1.0 (背面)
    const dot = worldPos.dot(cameraWorldPos)

    // 计算透明度:
    // 理论上标签半径(220)大于球体(200)，在 dot > -0.41 时都可见
    // 我们设定一个渐变区间，让正面的始终明亮 (dot >= 0 时 opacity=1)
    // 逐渐转到背面时淡出
    const opacity = (dot + 0.5) * 2.0

    obj.element.style.opacity = Math.max(0, Math.min(1, opacity))
  })

  renderer.render(scene, camera)
  if (webglRenderer) webglRenderer.render(scene, camera)
}

watch(() => props.tags, () => {
  if (scene) createTags()
}, { deep: true })

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer && renderer.domElement && container.value) {
    container.value.removeChild(renderer.domElement)
  }
  if (webglRenderer && webglRenderer.domElement && container.value) {
    container.value.removeChild(webglRenderer.domElement)
  }
  if (controls) controls.dispose()
})

const onResize = () => {
  if (!container.value || !camera || !renderer || !webglRenderer) return
  const width = container.value.clientWidth
  const height = 300 // 保持固定高度或者动态获取
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  webglRenderer.setSize(width, height)
}
</script>

<style scoped>
.tag-cloud-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 确保 CSS3DRenderer 生成的元素容器不会溢出卡片 */
:deep(.tag-cloud-container > div) {
  margin: 0 auto;
}

:deep(.el-tag) {
  transition: transform 0.2s ease, background-color 0.2s ease;
  user-select: none;
}

:deep(.el-tag:hover) {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
  z-index: 100;
}
</style>
