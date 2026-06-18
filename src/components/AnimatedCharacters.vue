<template>
  <div class="animated-characters" ref="containerRef" @mousemove="handleMouseMove">
    <div class="characters-stage" ref="stageRef" :style="stageStyle">
      <!-- Purple tall rectangle character - Back layer -->
      <div
        ref="purpleRef"
        class="character character-purple"
        :style="purpleStyle"
      >
        <div class="eyes-container" :style="purpleEyesStyle">
          <EyeBall
            :size="18"
            :pupil-size="7"
            :max-distance="5"
            eye-color="white"
            pupil-color="#2D2D2D"
            :is-blinking="isPurpleBlinking"
            :mouse-x="mouseX"
            :mouse-y="mouseY"
            :force-look-x="purpleForceLookX"
            :force-look-y="purpleForceLookY"
          />
          <EyeBall
            :size="18"
            :pupil-size="7"
            :max-distance="5"
            eye-color="white"
            pupil-color="#2D2D2D"
            :is-blinking="isPurpleBlinking"
            :mouse-x="mouseX"
            :mouse-y="mouseY"
            :force-look-x="purpleForceLookX"
            :force-look-y="purpleForceLookY"
          />
        </div>
      </div>

      <!-- Black tall rectangle character - Middle layer -->
      <div
        ref="blackRef"
        class="character character-black"
        :style="blackStyle"
      >
        <div class="eyes-container eyes-black" :style="blackEyesStyle">
          <EyeBall
            :size="16"
            :pupil-size="6"
            :max-distance="4"
            eye-color="white"
            pupil-color="#2D2D2D"
            :is-blinking="isBlackBlinking"
            :mouse-x="mouseX"
            :mouse-y="mouseY"
            :force-look-x="blackForceLookX"
            :force-look-y="blackForceLookY"
          />
          <EyeBall
            :size="16"
            :pupil-size="6"
            :max-distance="4"
            eye-color="white"
            pupil-color="#2D2D2D"
            :is-blinking="isBlackBlinking"
            :mouse-x="mouseX"
            :mouse-y="mouseY"
            :force-look-x="blackForceLookX"
            :force-look-y="blackForceLookY"
          />
        </div>
      </div>

      <!-- Orange semi-circle character - Front left -->
      <div
        ref="orangeRef"
        class="character character-orange"
        :style="orangeStyle"
      >
        <div class="pupils-container" :style="orangeEyesStyle">
          <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :mouse-x="mouseX" :mouse-y="mouseY" :force-look-x="orangeForceLookX" :force-look-y="orangeForceLookY" />
          <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :mouse-x="mouseX" :mouse-y="mouseY" :force-look-x="orangeForceLookX" :force-look-y="orangeForceLookY" />
        </div>
      </div>

      <!-- Yellow tall rectangle character - Front right -->
      <div
        ref="yellowRef"
        class="character character-yellow"
        :style="yellowStyle"
      >
        <div class="pupils-container pupils-yellow" :style="yellowEyesStyle">
          <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :mouse-x="mouseX" :mouse-y="mouseY" :force-look-x="yellowForceLookX" :force-look-y="yellowForceLookY" />
          <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :mouse-x="mouseX" :mouse-y="mouseY" :force-look-x="yellowForceLookX" :force-look-y="yellowForceLookY" />
        </div>
        <!-- Mouth -->
        <div class="yellow-mouth" :style="yellowMouthStyle" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue'

const Pupil = {
  name: 'Pupil',
  props: {
    size: { type: Number, default: 12 },
    maxDistance: { type: Number, default: 5 },
    pupilColor: { type: String, default: 'black' },
    mouseX: { type: Number, default: 0 },
    mouseY: { type: Number, default: 0 },
    forceLookX: { type: Number, default: undefined },
    forceLookY: { type: Number, default: undefined }
  },
  setup (props) {
    const pupilRef = ref(null)

    const pupilPosition = computed(() => {
      if (!pupilRef.value) return { x: 0, y: 0 }
      if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
        return { x: props.forceLookX, y: props.forceLookY }
      }
      const rect = pupilRef.value.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = props.mouseX - cx
      const dy = props.mouseY - cy
      const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), props.maxDistance)
      const angle = Math.atan2(dy, dx)
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
    })

    const style = computed(() => ({
      width: `${props.size}px`,
      height: `${props.size}px`,
      backgroundColor: props.pupilColor,
      borderRadius: '50%',
      transform: `translate(${pupilPosition.value.x}px, ${pupilPosition.value.y}px)`,
      transition: 'transform 0.1s ease-out'
    }))

    return { pupilRef, style }
  },
  render () {
    return h('div', { ref: this.pupilRef, style: this.style })
  }
}

const EyeBall = {
  name: 'EyeBall',
  props: {
    size: { type: Number, default: 48 },
    pupilSize: { type: Number, default: 16 },
    maxDistance: { type: Number, default: 10 },
    eyeColor: { type: String, default: 'white' },
    pupilColor: { type: String, default: 'black' },
    isBlinking: { type: Boolean, default: false },
    mouseX: { type: Number, default: 0 },
    mouseY: { type: Number, default: 0 },
    forceLookX: { type: Number, default: undefined },
    forceLookY: { type: Number, default: undefined }
  },
  setup (props) {
    const eyeRef = ref(null)

    const pupilPosition = computed(() => {
      if (!eyeRef.value) return { x: 0, y: 0 }
      if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
        return { x: props.forceLookX, y: props.forceLookY }
      }
      const rect = eyeRef.value.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = props.mouseX - cx
      const dy = props.mouseY - cy
      const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), props.maxDistance)
      const angle = Math.atan2(dy, dx)
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
    })

    const eyeStyle = computed(() => ({
      width: `${props.size}px`,
      height: props.isBlinking ? '2px' : `${props.size}px`,
      backgroundColor: props.eyeColor,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'height 0.15s ease'
    }))

    const pupilStyle = computed(() => ({
      width: `${props.pupilSize}px`,
      height: `${props.pupilSize}px`,
      backgroundColor: props.pupilColor,
      borderRadius: '50%',
      transform: `translate(${pupilPosition.value.x}px, ${pupilPosition.value.y}px)`,
      transition: 'transform 0.1s ease-out'
    }))

    return { eyeRef, eyeStyle, pupilStyle }
  },
  render () {
    const children = this.isBlinking ? [] : [h('div', { style: this.pupilStyle })]
    return h('div', { ref: this.eyeRef, style: this.eyeStyle }, children)
  }
}

export default {
  name: 'AnimatedCharacters',
  components: { Pupil, EyeBall },
  props: {
    isTyping: { type: Boolean, default: false },
    passwordVisible: { type: Boolean, default: false },
    passwordLength: { type: Number, default: 0 }
  },
  setup (props) {
    const mouseX = ref(0)
    const mouseY = ref(0)
    const isPurpleBlinking = ref(false)
    const isBlackBlinking = ref(false)
    const isLookingAtEachOther = ref(false)
    const isPurplePeeking = ref(false)
    const isPurpleLookingAtMouse = ref(false)

    const purpleRef = ref(null)
    const blackRef = ref(null)
    const orangeRef = ref(null)
    const yellowRef = ref(null)
    const stageRef = ref(null)
    const containerRef = ref(null)
    const stageScale = ref(1)

    const STAGE_BASE_WIDTH = 480
    const STAGE_BASE_HEIGHT = 360

    let purpleBlinkTimer = null
    let blackBlinkTimer = null
    let peekTimer = null
    let lookAtMouseTimer = null
    let resizeObserver = null

    const handleMouseMove = (e) => {
      mouseX.value = e.clientX
      mouseY.value = e.clientY
    }

    // Also listen globally so eyes track outside the component
    const globalMouseMove = (e) => {
      mouseX.value = e.clientX
      mouseY.value = e.clientY
    }

    const calcPos = (el) => {
      if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 }
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 3
      const dx = mouseX.value - cx
      const dy = mouseY.value - cy
      return {
        faceX: Math.max(-15, Math.min(15, dx / 20)),
        faceY: Math.max(-10, Math.min(10, dy / 30)),
        bodySkew: Math.max(-6, Math.min(6, -dx / 120))
      }
    }

    const purplePos = computed(() => calcPos(purpleRef.value))
    const blackPos = computed(() => calcPos(blackRef.value))
    const orangePos = computed(() => calcPos(orangeRef.value))
    const yellowPos = computed(() => calcPos(yellowRef.value))

    const passwordHidden = computed(() => props.passwordLength > 0 && !props.passwordVisible)
    const passwordShown = computed(() => props.passwordLength > 0 && props.passwordVisible)

    // Purple character style
    const purpleStyle = computed(() => {
      const typing = props.isTyping || passwordHidden.value
      let transform
      if (passwordShown.value) {
        transform = 'skewX(0deg)'
      } else if (typing) {
        transform = `skewX(${(purplePos.value.bodySkew || 0) - 12}deg) translateX(40px)`
      } else {
        transform = `skewX(${purplePos.value.bodySkew || 0}deg)`
      }
      return {
        height: typing ? '440px' : '400px',
        transform,
        transformOrigin: 'bottom center'
      }
    })

    const purpleEyesStyle = computed(() => {
      if (passwordShown.value) {
        if (isPurpleLookingAtMouse.value) {
          return {
            left: `${45 + purplePos.value.faceX}px`,
            top: `${40 + purplePos.value.faceY}px`
          }
        }
        return { left: '20px', top: '35px' }
      }
      if (isLookingAtEachOther.value) {
        return { left: '55px', top: '65px' }
      }
      return {
        left: `${45 + purplePos.value.faceX}px`,
        top: `${40 + purplePos.value.faceY}px`
      }
    })

    const purpleForceLookX = computed(() => {
      if (passwordShown.value) {
        if (isPurpleLookingAtMouse.value) return undefined
        return isPurplePeeking.value ? 4 : -4
      }
      if (isLookingAtEachOther.value) return 3
      return undefined
    })
    const purpleForceLookY = computed(() => {
      if (passwordShown.value) {
        if (isPurpleLookingAtMouse.value) return undefined
        return isPurplePeeking.value ? 5 : -4
      }
      if (isLookingAtEachOther.value) return 4
      return undefined
    })

    // Black character style
    const blackStyle = computed(() => {
      let transform
      if (passwordShown.value) {
        transform = 'skewX(0deg)'
      } else if (isLookingAtEachOther.value) {
        transform = `skewX(${(blackPos.value.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
      } else if (props.isTyping || passwordHidden.value) {
        transform = `skewX(${(blackPos.value.bodySkew || 0) * 1.5}deg)`
      } else {
        transform = `skewX(${blackPos.value.bodySkew || 0}deg)`
      }
      return { transform, transformOrigin: 'bottom center' }
    })

    const blackEyesStyle = computed(() => {
      if (passwordShown.value) return { left: '10px', top: '28px' }
      if (isLookingAtEachOther.value) return { left: '32px', top: '12px' }
      return {
        left: `${26 + blackPos.value.faceX}px`,
        top: `${32 + blackPos.value.faceY}px`
      }
    })

    const blackForceLookX = computed(() => {
      if (passwordShown.value) return -4
      if (isLookingAtEachOther.value) return 0
      return undefined
    })
    const blackForceLookY = computed(() => {
      if (passwordShown.value) return -4
      if (isLookingAtEachOther.value) return -4
      return undefined
    })

    // Orange character style
    const orangeStyle = computed(() => ({
      transform: passwordShown.value ? 'skewX(0deg)' : `skewX(${orangePos.value.bodySkew || 0}deg)`,
      transformOrigin: 'bottom center'
    }))

    const orangeEyesStyle = computed(() => {
      if (passwordShown.value) return { left: '50px', top: '85px' }
      return {
        left: `${82 + (orangePos.value.faceX || 0)}px`,
        top: `${90 + (orangePos.value.faceY || 0)}px`
      }
    })

    const orangeForceLookX = computed(() => passwordShown.value ? -5 : undefined)
    const orangeForceLookY = computed(() => passwordShown.value ? -4 : undefined)

    // Yellow character style
    const yellowStyle = computed(() => ({
      transform: passwordShown.value ? 'skewX(0deg)' : `skewX(${yellowPos.value.bodySkew || 0}deg)`,
      transformOrigin: 'bottom center'
    }))

    const yellowEyesStyle = computed(() => {
      if (passwordShown.value) return { left: '20px', top: '35px' }
      return {
        left: `${52 + (yellowPos.value.faceX || 0)}px`,
        top: `${40 + (yellowPos.value.faceY || 0)}px`
      }
    })

    const yellowForceLookX = computed(() => passwordShown.value ? -5 : undefined)
    const yellowForceLookY = computed(() => passwordShown.value ? -4 : undefined)

    const yellowMouthStyle = computed(() => {
      if (passwordShown.value) return { left: '10px', top: '88px' }
      return {
        left: `${40 + (yellowPos.value.faceX || 0)}px`,
        top: `${88 + (yellowPos.value.faceY || 0)}px`
      }
    })

    // Blinking
    const scheduleBlink = (setter) => {
      const interval = Math.random() * 4000 + 3000
      const timer = setTimeout(() => {
        setter(true)
        setTimeout(() => {
          setter(false)
          scheduleBlink(setter)
        }, 150)
      }, interval)
      return timer
    }

    // Looking at each other when typing
    watch(() => props.isTyping, (val) => {
      if (val) {
        isLookingAtEachOther.value = true
        setTimeout(() => { isLookingAtEachOther.value = false }, 800)
      } else {
        isLookingAtEachOther.value = false
      }
    })

    // Purple peeking when password visible
    watch([() => props.passwordLength, () => props.passwordVisible, isPurplePeeking], () => {
      clearTimeout(peekTimer)
      if (props.passwordLength > 0 && props.passwordVisible) {
        peekTimer = setTimeout(() => {
          isPurplePeeking.value = true
          setTimeout(() => { isPurplePeeking.value = false }, 800)
        }, Math.random() * 3000 + 2000)
      } else {
        isPurplePeeking.value = false
      }
    })

    // Purple randomly looks at mouse when password visible
    const scheduleLookAtMouse = () => {
      clearTimeout(lookAtMouseTimer)
      const delay = Math.random() * 7000 + 3000 // 3~10s
      lookAtMouseTimer = setTimeout(() => {
        if (passwordShown.value) {
          isPurpleLookingAtMouse.value = true
          lookAtMouseTimer = setTimeout(() => {
            isPurpleLookingAtMouse.value = false
            if (passwordShown.value) scheduleLookAtMouse()
          }, 1000)
        }
      }, delay)
    }

    watch(passwordShown, (val) => {
      clearTimeout(lookAtMouseTimer)
      isPurpleLookingAtMouse.value = false
      if (val) scheduleLookAtMouse()
    })

    const stageStyle = computed(() => {
      const s = stageScale.value
      return {
        transform: `scale(${s})`,
        transformOrigin: 'bottom center',
        width: STAGE_BASE_WIDTH + 'px',
        height: STAGE_BASE_HEIGHT + 'px'
      }
    })

    const updateScale = () => {
      if (!containerRef.value) return
      const containerWidth = containerRef.value.clientWidth
      stageScale.value = Math.min(1, containerWidth / STAGE_BASE_WIDTH)
    }

    onMounted(() => {
      window.addEventListener('mousemove', globalMouseMove)
      purpleBlinkTimer = scheduleBlink((v) => { isPurpleBlinking.value = v })
      blackBlinkTimer = scheduleBlink((v) => { isBlackBlinking.value = v })
      updateScale()
      resizeObserver = new ResizeObserver(updateScale)
      if (containerRef.value) resizeObserver.observe(containerRef.value)
    })

    onUnmounted(() => {
      window.removeEventListener('mousemove', globalMouseMove)
      clearTimeout(purpleBlinkTimer)
      clearTimeout(blackBlinkTimer)
      clearTimeout(peekTimer)
      clearTimeout(lookAtMouseTimer)
      if (resizeObserver) resizeObserver.disconnect()
    })

    return {
      mouseX,
      mouseY,
      handleMouseMove,
      containerRef,
      stageRef,
      stageStyle,
      purpleRef,
      blackRef,
      orangeRef,
      yellowRef,
      isPurpleBlinking,
      isBlackBlinking,
      purpleStyle,
      purpleEyesStyle,
      purpleForceLookX,
      purpleForceLookY,
      blackStyle,
      blackEyesStyle,
      blackForceLookX,
      blackForceLookY,
      orangeStyle,
      orangeEyesStyle,
      orangeForceLookX,
      orangeForceLookY,
      yellowStyle,
      yellowEyesStyle,
      yellowForceLookX,
      yellowForceLookY,
      yellowMouthStyle
    }
  }
}
</script>

<style scoped lang="scss">
.animated-characters {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.characters-stage {
  position: relative;
}

.character {
  position: absolute;
  bottom: 0;
  transition: transform 0.7s ease-in-out;
}

.character-purple {
  left: 60px;
  width: 150px;
  height: 400px;
  background-color: #6C3FF5;
  border-radius: 10px 10px 0 0;
  z-index: 1;
}

.character-black {
  left: 200px;
  width: 100px;
  height: 260px;
  background-color: #2D2D2D;
  border-radius: 8px 8px 0 0;
  z-index: 2;
}

.character-orange {
  left: 0;
  width: 200px;
  height: 170px;
  background-color: #FF9B6B;
  border-radius: 100px 100px 0 0;
  z-index: 3;
}

.character-yellow {
  left: 260px;
  width: 120px;
  height: 195px;
  background-color: #E8D754;
  border-radius: 60px 60px 0 0;
  z-index: 4;
}

.eyes-container {
  position: absolute;
  display: flex;
  gap: 32px;
  transition: left 0.7s ease-in-out, top 0.7s ease-in-out;
}

.eyes-black {
  gap: 24px;
}

.pupils-container {
  position: absolute;
  display: flex;
  gap: 32px;
  transition: left 0.2s ease-out, top 0.2s ease-out;
}

.pupils-yellow {
  gap: 24px;
}

.yellow-mouth {
  position: absolute;
  width: 68px;
  height: 4px;
  background-color: #2D2D2D;
  border-radius: 9999px;
  transition: left 0.2s ease-out, top 0.2s ease-out;
}

</style>
