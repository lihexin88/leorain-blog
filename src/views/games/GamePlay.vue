<template>
  <div class="box">
    22{{ gameUrl }}
    <nes-vue
        v-if="gameUrl"
        ref="nes"
        :url="gameUrl"
        label="Click to Start"
        :width="width"
        :height="height"
        debugger
        @fps="getFps"
        @success="onSuccess"
        @error="onError"
        @saved="onSaved"
        @loaded="onLoaded"
    />
    11
    <div class="show-fps">
      FPS:{{ currentFPS }}
    </div>
  </div>
  <div class="btns">
    <button @click="resetGame">
      Reset
    </button>
    <button @click="stopGame">
      Stop
    </button>
    <button
        :disabled="saveable"
        @click="save"
    >
      Save
    </button>
    <button
        :disabled="saveable"
        @click="load"
    >
      Load
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import api from '@/apis/base'
import type { EmitErrorObj, SavedOrLoaded } from 'nes-vue'
import { NesVue } from 'nes-vue'

export default defineComponent({
  name: 'GamePlay',
  components: {
    NesVue
  },
  data () {
    return {
      gameUrl: '',
      currentFPS: '0',
      saveable: true,
      gameName: '',
      width: 960,
      height: 800
    }
  },
  mounted () {
    this.fetchGameDetail()
  },
  methods: {
    async fetchGameDetail () {
      const slug = this.$route.params.slug
      try {
        const response = await api.get(`/games/${slug}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as any
        // 假设返回的数据包含 rom_url 和 name
        this.gameUrl = data.url || data.rom_url
        this.gameName = data.name
      } catch (error) {
        console.error('Failed to fetch game detail:', error)
      }
    },
    getFps (fps: number) {
      this.currentFPS = fps.toFixed(2)
    },
    resetGame () {
      if (this.$refs.nes) {
        // (this.$refs.nes as any).gameReset()
      }
    },
    stopGame () {
      this.saveable = true
      this.currentFPS = '0'
      if (this.$refs.nes) {
        // (this.$refs.nes as any).gameStop()
      }
    },
    save () {
      if (this.$refs.nes) {
        // (this.$refs.nes as any).save(this.gameUrl)
      }
    },
    load () {
      if (this.$refs.nes) {
        // (this.$refs.nes as any).load(this.gameUrl)
      }
    },
    onSuccess () {
      this.saveable = false
      console.log('Load successful')
    },
    onError (error: EmitErrorObj) {
      console.log(error)
    },
    onSaved ({ id }: SavedOrLoaded) {
      console.log(id + ' saved')
    },
    onLoaded ({ id }: SavedOrLoaded) {
      console.log(id + ' loaded')
    }
  }
})
</script>
<style>
.box {
  position: relative;
  display: inline-block;
}

.show-fps {
  position: absolute;
  color: #fffef9;
  text-shadow: 0 0 5px #1e131d;
  top: 5px;
  left: 5px;
}

button {
  margin: 0 10px;
  color: #646cff;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  transition: border-color 0.25s;
}

button:not(:disabled):hover {
  cursor: pointer;
  border-color: #646cff;
}
</style>
