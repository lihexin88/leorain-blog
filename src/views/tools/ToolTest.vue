<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import TestSchulte from '@/views/tools/particals/TestSchulte.vue'
import TestReaction from '@/views/tools/particals/TestReaction.vue'
import TestColorVision from '@/views/tools/particals/TestColorVision.vue'
import TestNumberMemory from '@/views/tools/particals/TestNumberMemory.vue'
import TestSart from '@/views/tools/particals/TestSart.vue'
import TestColorRight from '@/views/tools/particals/TestColorRight.vue'
import TestGuessWord from '@/views/tools/particals/TestGuessWord.vue'

const HEADER_OFFSET = 76
const activeStep = ref(0)
const navEl = ref<HTMLElement | null>(null)
const navButtonEls = ref<(HTMLButtonElement | null)[]>([])
const showUnauthorized = ref(false)
const dialogWidth = ref('30%')
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
const testSteps = [
  {
    id: 'test-schulte-section',
    title: '舒尔特',
    description: '专注力'
  },
  {
    id: 'test-reaction-section',
    title: '反应',
    description: '反应时'
  },
  {
    id: 'test-color-vision-section',
    title: '色觉',
    description: '辨色'
  },
  {
    id: 'test-number-memory-section',
    title: '数字记忆',
    description: '瞬时记忆'
  },
  {
    id: 'test-sart-section',
    title: '注意力',
    description: 'SART'
  },
  {
    id: 'test-color-right-section',
    title: '颜色匹配',
    description: '名色一致'
  },
  {
    id: 'test-guess-word-section',
    title: '猜词语',
    description: '语义相似'
  }
]

let scrollFrame: number | null = null

function setNavButtonRef (el: Element | null, index: number) {
  navButtonEls.value[index] = el instanceof HTMLButtonElement ? el : null
}

function isMobileNav () {
  return window.matchMedia('(max-aspect-ratio: 1/1)').matches
}

function scrollActiveNavIntoView () {
  if (!isMobileNav()) return

  const container = navEl.value
  const button = navButtonEls.value[activeStep.value]
  if (!container || !button) return

  const containerRect = container.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  const delta =
    buttonRect.left - containerRect.left - (container.clientWidth - buttonRect.width) / 2

  container.scrollBy({
    left: delta,
    behavior: 'smooth'
  })
}

function scrollToTest (index: number) {
  const target = document.getElementById(testSteps[index].id)
  if (!target) return

  activeStep.value = index
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
}

function updateActiveStep () {
  scrollFrame = null
  const activationLine = HEADER_OFFSET + Math.min(window.innerHeight * 0.22, 160)
  let currentIndex = 0

  testSteps.forEach((step, index) => {
    const section = document.getElementById(step.id)
    if (section && section.getBoundingClientRect().top <= activationLine) {
      currentIndex = index
    }
  })

  activeStep.value = currentIndex
}

function onScroll () {
  if (scrollFrame !== null) return
  scrollFrame = window.requestAnimationFrame(updateActiveStep)
}

function checkLogin () {
  if (!isLoggedIn.value) {
    showUnauthorized.value = true
  }
}

function gotoLogin () {
  showUnauthorized.value = false
  userStore.setShowLoginDialog(true)
}

watch(activeStep, () => {
  nextTick(scrollActiveNavIntoView)
})

onMounted(() => {
  nextTick(() => {
    updateActiveStep()
    scrollActiveNavIntoView()
  })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  if (window.matchMedia('(max-aspect-ratio: 1/1)').matches) {
    dialogWidth.value = '100%'
  }
  checkLogin()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (scrollFrame !== null) {
    window.cancelAnimationFrame(scrollFrame)
  }
})
</script>

<template>
  <div class="test-page">
    <aside ref="navEl" class="test-navigation" aria-label="测试导航">
      <div class="nav-label">测试</div>
      <nav class="test-nav-list">
        <button
          v-for="(step, index) in testSteps"
          :key="step.id"
          :ref="el => setNavButtonRef(el as Element | null, index)"
          type="button"
          :class="['test-nav-item', { 'is-active': index === activeStep }]"
          @click="scrollToTest(index)"
        >
          <span class="nav-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="nav-text">
            <span class="nav-title">{{ step.title }}</span>
            <span class="nav-desc">{{ step.description }}</span>
          </span>
        </button>
      </nav>
    </aside>

    <main class="test-content">
      <section id="test-schulte-section" class="test-section">
        <test-schulte />
      </section>
      <section id="test-reaction-section" class="test-section">
        <test-reaction />
      </section>
      <section id="test-color-vision-section" class="test-section">
        <test-color-vision />
      </section>
      <section id="test-number-memory-section" class="test-section">
        <test-number-memory />
      </section>
      <section id="test-sart-section" class="test-section">
        <test-sart />
      </section>
      <section id="test-color-right-section" class="test-section">
        <test-color-right />
      </section>
      <section id="test-guess-word-section" class="test-section">
        <test-guess-word />
      </section>
    </main>

    <el-dialog
      v-model="showUnauthorized"
      title="确认登录？"
      :width="dialogWidth"
      class="unauthorized-dialog"
    >
      <span>登录后可以参与排名，确认登录吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUnauthorized = false">取 消</el-button>
          <el-button type="primary" @click="gotoLogin">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.test-page {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 8px 12px 28px 0;
  box-sizing: border-box;
}

.test-navigation {
  position: sticky;
  top: 76px;
  z-index: 10;
  flex: 0 0 128px;
  height: fit-content;
  max-height: calc(100vh - 92px);
  padding: 10px 8px;
  overflow-y: auto;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-fill-color-blank) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.nav-label {
  padding: 2px 8px 10px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.test-nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.test-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }

  &.is-active {
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    color: var(--el-color-primary);
    box-shadow: inset 3px 0 0 var(--el-color-primary);

    .nav-index {
      background: var(--el-color-primary);
      color: #fff;
    }
  }
}

.nav-index {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.nav-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.nav-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.nav-desc {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.2;
}

.test-nav-item.is-active .nav-desc {
  color: color-mix(in srgb, var(--el-color-primary) 72%, var(--el-text-color-secondary));
}

.test-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.test-section {
  scroll-margin-top: 76px;
  border-radius: 12px;
  overflow: clip;

  :deep(.main-box) {
    padding-top: 0;
    padding-bottom: 0;
  }

  :deep(.el-card) {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  :deep(.el-card__header) {
    padding: 12px 16px;
  }

  :deep(.el-card__body) {
    padding: 12px 16px 14px;
  }
}

@media screen and (max-aspect-ratio: 1/1) {
  .test-page {
    display: block;
    padding: 0 0 24px;
  }

  .test-navigation {
    position: sticky;
    top: 60px;
    z-index: 20;
    display: block;
    width: auto;
    max-height: none;
    margin: 0;
    padding: 10px 0 10px;
    overflow-x: auto;
    overflow-y: hidden;
    border: 0;
    border-radius: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 80%, transparent);
    background: color-mix(in srgb, var(--body-bg, #fff) 82%, transparent);
    box-shadow: 0 8px 20px rgb(15 23 42 / 4%);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    scrollbar-width: none;
    -ms-overflow-style: none;
    mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 16px,
      #000 calc(100% - 16px),
      transparent 100%
    );

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .nav-label {
    display: none;
  }

  .test-nav-list {
    display: flex;
    flex-direction: row;
    gap: 8px;
    width: max-content;
    min-width: 100%;
    padding: 0 14px;
    box-sizing: border-box;
  }

  .test-nav-item {
    position: relative;
    flex: 0 0 auto;
    gap: 6px;
    min-width: 0;
    padding: 8px 12px 8px 8px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    box-shadow: inset 0 0 0 1px var(--el-border-color-extra-light);
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-color-primary);
    }

    &:active {
      transform: scale(0.97);
    }

    &.is-active {
      background: var(--el-color-primary);
      display: flex;
      justify-content: center;
      color: #fff;
      box-shadow:
        0 6px 14px color-mix(in srgb, var(--el-color-primary) 28%, transparent),
        inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 40%, transparent);

      .nav-index {
        background: rgb(255 255 255 / 22%);
        color: #fff;
      }

      .nav-desc {
        color: rgb(255 255 255 / 78%);
      }
    }
  }

  .nav-index {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    font-size: 10px;
  }

  .nav-text {
    gap: 0;
  }

  .nav-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .nav-desc {
    display: none;
  }

  .test-content {
    gap: 10px;
    padding: 10px 10px 0;
  }

  .test-section {
    scroll-margin-top: 128px;

    :deep(.el-card) {
      border-radius: 14px;
    }

    :deep(.el-card__header) {
      padding: 12px 14px;
    }

    :deep(.el-card__body) {
      padding: 10px 12px 12px;
    }
  }
}
</style>
