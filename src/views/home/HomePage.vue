<template>
  <div class="home-container" :class="{ 'home-container--ready': contentVisible }">
    <transition name="home-splash-fade">
      <div
        v-if="showSplash"
        class="home-splash"
        aria-hidden="true"
      >
        <div class="home-splash-backdrop"></div>
        <div class="home-splash-orb home-splash-orb--left"></div>
        <div class="home-splash-orb home-splash-orb--right"></div>
        <div class="home-splash-grid"></div>
        <div class="home-splash-content">
          <div class="home-splash-panel">
            <p class="home-splash-kicker">WELCOME TO</p>
            <h1 class="home-splash-title">{{ splashTitle }}</h1>
            <p class="home-splash-description">{{ splashDescription }}</p>
            <div class="home-splash-line"></div>
          </div>
        </div>
      </div>
    </transition>

    <div class="container home-layout">
      <div class="main-content home-hero-main">
        <ArticleList />
      </div>
      <div class="sidebar home-hero-sidebar">
        <HomeInfo />
      </div>
    </div>
  </div>
</template>

<script>
import anime from 'animejs'
import { useConfigStore } from '@/store/config'
import ArticleList from './ArticleList.vue'
import HomeInfo from './HomeInfo.vue'

const HOME_SPLASH_SESSION_KEY = 'home-splash-played'

export default {
  name: 'HomePage',
  components: {
    ArticleList,
    HomeInfo
  },
  setup () {
    const configStore = useConfigStore()
    return {
      configStore
    }
  },
  data () {
    return {
      showSplash: false,
      contentVisible: false,
      prefersReducedMotion: false
    }
  },
  computed: {
    splashTitle () {
      return this.configStore.title || 'Leorain'
    },
    splashDescription () {
      return this.configStore.description || '探索文章、项目与灵感'
    }
  },
  methods: {
    shouldPlaySplash () {
      if (this.prefersReducedMotion || typeof window === 'undefined') {
        return false
      }
      return window.sessionStorage.getItem(HOME_SPLASH_SESSION_KEY) !== '1'
    },
    markSplashPlayed () {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(HOME_SPLASH_SESSION_KEY, '1')
      }
    },
    runContentEntrance () {
      this.contentVisible = true
      this.$nextTick(() => {
        anime.remove('.home-hero-main, .home-hero-sidebar')
        anime({
          targets: '.home-hero-main',
          opacity: [0, 1],
          translateY: [26, 0],
          scale: [0.988, 1],
          duration: 820,
          easing: 'easeOutCubic'
        })
        anime({
          targets: '.home-hero-sidebar',
          opacity: [0, 1],
          translateY: [34, 0],
          scale: [0.986, 1],
          delay: 120,
          duration: 780,
          easing: 'easeOutCubic'
        })
      })
    },
    runSplashAnimation () {
      this.showSplash = true
      this.contentVisible = false
      this.$nextTick(() => {
        anime.remove('.home-splash-content, .home-splash-kicker, .home-splash-title, .home-splash-description, .home-splash-line, .home-splash-orb, .home-splash-grid')
        anime.timeline({
          easing: 'easeOutExpo'
        })
          .add({
            targets: '.home-splash-orb',
            opacity: [0, 0.72],
            scale: [0.94, 1.02],
            duration: 300,
            delay: anime.stagger(140)
          })
          .add({
            targets: '.home-splash-panel',
            opacity: [0, 1],
            translateY: [18, 0],
            scale: [0.985, 1],
            duration: 820
          }, '-=920')
          .add({
            targets: '.home-splash-kicker',
            opacity: [0, 1],
            translateY: [16, 0],
            letterSpacing: ['0.62em', '0.42em'],
            duration: 480
          }, '-=620')
          .add({
            targets: '.home-splash-title',
            opacity: [0, 1],
            translateY: [32, 0],
            scale: [0.97, 1],
            duration: 720
          }, '-=240')
          .add({
            targets: '.home-splash-description',
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 520
          }, '-=420')
          .add({
            targets: '.home-splash-line',
            opacity: [0, 1],
            scaleX: [0.72, 1],
            duration: 560
          }, '-=280')
          .add({
            targets: '.home-splash-grid',
            opacity: [0.04, 0.1, 0.05],
            duration: 520
          }, '-=640')
          .add({
            targets: '.home-splash',
            opacity: [1, 0],
            scale: [1, 1.015],
            translateY: [0, -16],
            duration: 160,
            easing: 'easeInOutSine',
            complete: () => {
              this.showSplash = false
              this.markSplashPlayed()
              this.runContentEntrance()
            }
          }, '+=320')
      })
    }
  },
  mounted () {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    if (this.shouldPlaySplash()) {
      this.runSplashAnimation()
      return
    }

    this.runContentEntrance()
  }
}
</script>

<style scoped lang="scss">
.home-container {
  padding: 20px 0;
  position: relative;
}

.home-layout {
  display: flex;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.home-hero-main,
.home-hero-sidebar {
  opacity: 0;
}

.home-container--ready {
  .home-hero-main,
  .home-hero-sidebar {
    will-change: transform, opacity;
  }
}

.home-splash {
  position: fixed;
  inset: 0;
  z-index: 1200;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.2), transparent 34%),
    radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.08), transparent 28%),
    linear-gradient(145deg, rgba(243, 247, 252, 0.9), rgba(224, 233, 246, 0.84) 52%, rgba(236, 228, 239, 0.82));
  backdrop-filter: blur(22px) saturate(120%);
}

.home-splash-backdrop,
.home-splash-grid,
.home-splash-orb {
  position: absolute;
  inset: 0;
}

.home-splash-backdrop {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.08)),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.28), transparent 62%);
}

.home-splash-grid {
  inset: -10%;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.72), transparent 82%);
  opacity: 0.05;
}

.home-splash-orb {
  filter: blur(42px);
  opacity: 0;
}

.home-splash-orb--left {
  background: radial-gradient(circle at 30% 50%, rgba(191, 219, 254, 0.46), transparent 36%);
  transform: translate(-10%, -4%);
}

.home-splash-orb--right {
  background: radial-gradient(circle at 70% 50%, rgba(244, 114, 182, 0.14), transparent 34%);
  transform: translate(10%, 6%);
}

.home-splash-content {
  position: relative;
  z-index: 1;
  max-width: min(860px, calc(100vw - 48px));
  padding: 32px 24px;
  text-align: center;
  color: #1f2937;
}

.home-splash-panel {
  margin: 0 auto;
  max-width: 720px;
  padding: 34px 30px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 30px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.24));
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px);
}

.home-splash-kicker {
  margin: 0 0 16px;
  font-size: 0.84rem;
  letter-spacing: 0.42em;
  color: rgba(71, 85, 105, 0.68);
}

.home-splash-title {
  margin: 0;
  font-size: clamp(3rem, 8vw, 6rem);
  line-height: 1.04;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #111827;
  text-shadow: 0 10px 28px rgba(255, 255, 255, 0.24);
}

.home-splash-description {
  margin: 20px auto 0;
  max-width: 560px;
  font-size: clamp(1rem, 2vw, 1.14rem);
  line-height: 1.85;
  color: rgba(51, 65, 85, 0.82);
}

.home-splash-line {
  width: min(180px, 40vw);
  height: 1px;
  margin: 24px auto 0;
  transform-origin: center;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.78), transparent);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.28);
}

.home-splash-fade-leave-active {
  transition: opacity 0.25s ease;
}

.home-splash-fade-leave-to {
  opacity: 0;
}

.main-content {
  width: 70%;

  @media screen and (max-width: 992px) {
    width: 100%;
  }
}

.sidebar {
  width: 30%;
  padding-left: 20px;
  padding-right: 100px;

  @media screen and (max-width: 992px) {
    width: 100%;
    padding-left: 0;
    padding-right: 0;
    margin-top: 10px;
  }
}

@media screen and (max-width: 992px) {
  .home-splash-content {
    padding: 24px 20px;
  }

  .home-splash-kicker {
    margin-bottom: 14px;
    letter-spacing: 0.32em;
  }

  .home-splash-description {
    margin-top: 18px;
    line-height: 1.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero-main,
  .home-hero-sidebar {
    opacity: 1;
  }

  .home-splash {
    display: none;
  }
}
</style>
