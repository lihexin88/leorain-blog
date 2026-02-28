import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/main.scss'
import 'particles.js'
import VueParticles from 'vue-particles'
import { tdkMixin } from '@/utils/tdk'

// Fix particles.js strict mode issue
Object.deepExtend = function (destination, source) {
  for (const property in source) {
    if (source[property] && source[property].constructor &&
      source[property].constructor === Object) {
      destination[property] = destination[property] || {}
      Object.deepExtend(destination[property], source[property])
    } else {
      destination[property] = source[property]
    }
  }
  return destination
}

const app = createApp(App)
window.require = (name) => {
  if (name === 'particles.js') return window.particlesJS
  throw new Error(`Cannot require ${name}`)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(VueParticles)
app.mixin(tdkMixin)

app.mount('#app')
