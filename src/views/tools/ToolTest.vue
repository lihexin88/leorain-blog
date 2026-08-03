<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import TestSchulte from '@/views/tools/particals/TestSchulte.vue'
import TestReaction from '@/views/tools/particals/TestReaction.vue'
import TestColorVision from '@/views/tools/particals/TestColorVision.vue'
import TestNumberMemory from '@/views/tools/particals/TestNumberMemory.vue'

const HEADER_OFFSET = 76
const activeStep = ref(0)
const testSteps = [
  {
    id: 'test-schulte-section',
    title: '舒尔特方格',
    description: '专注力与视觉广度'
  },
  {
    id: 'test-reaction-section',
    title: '反应速度',
    description: '测试点击反应时间'
  },
  {
    id: 'test-color-vision-section',
    title: '色觉测试',
    description: '测试颜色辨识能力'
  },
  {
    id: 'test-number-memory-section',
    title: '数字记忆',
    description: '测试瞬时数字记忆'
  }
]

let scrollFrame: number | null = null

function scrollToTest (index: number) {
  const target = document.getElementById(testSteps[index].id)
  if (!target) return

  activeStep.value = index
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
}

function updateActiveStep () {
  scrollFrame = null
  const activationLine = HEADER_OFFSET + Math.min(window.innerHeight * 0.28, 220)
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

onMounted(() => {
  nextTick(updateActiveStep)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
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
    <aside class="test-navigation" aria-label="测试导航">
      <el-steps :active="activeStep" direction="vertical" class="test-steps">
        <el-step
          v-for="(step, index) in testSteps"
          :key="step.id"
          :title="step.title"
          :description="step.description"
          :status="index === activeStep ? 'process' : 'wait'"
          class="test-step"
          @click="scrollToTest(index)"
        />
      </el-steps>
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
    </main>
  </div>
</template>

<style scoped lang="scss">
.test-page {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.test-navigation {
  position: sticky;
  top: 76px;
  z-index: 10;
  flex: 0 0 210px;
  height: fit-content;
  max-height: calc(100vh - 96px);
  padding: 28px 16px 28px 24px;
  overflow-y: auto;
  background-color: var(--body-bg);
}

.test-steps {
  height: 260px;
}

.test-step {
  cursor: pointer;

  :deep(.el-step__title),
  :deep(.el-step__description),
  :deep(.el-step__icon) {
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  &:hover {
    :deep(.el-step__title),
    :deep(.el-step__description) {
      color: var(--el-color-primary);
    }

    :deep(.el-step__icon) {
      transform: scale(1.08);
    }
  }
}

.test-content {
  flex: 1;
  min-width: 0;
}

.test-section {
  scroll-margin-top: 76px;
}

@media screen and (max-aspect-ratio: 1/1) {
  .test-page {
    display: block;
  }

  .test-navigation {
    position: sticky;
    top: 60px;
    z-index: 20;
    width: 100%;
    max-height: none;
    padding: 10px 12px;
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--body-bg);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .test-steps {
    min-width: 640px;
    height: auto;
  }

  .test-navigation :deep(.el-steps) {
    flex-direction: row;
  }

  .test-navigation :deep(.el-step) {
    flex-basis: 25% !important;
  }

  .test-navigation :deep(.el-step__head) {
    width: auto;
  }

  .test-navigation :deep(.el-step__main) {
    padding-left: 8px;
  }

  .test-navigation :deep(.el-step__line) {
    display: none;
  }

  .test-navigation :deep(.el-step__description) {
    display: none;
  }

  .test-section {
    scroll-margin-top: 120px;
  }
}
</style>
