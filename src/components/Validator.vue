<script>

import captchaApi from '@/apis/captcha'

export default {
  mounted () {
    this.getImageData()
  },
  data () {
    return {
      imageData: null,
      validateResult: '',
      validateKey: null,
      timeRemain: null,
      timer: null
    }
  },
  methods: {
    getImageData () {
      captchaApi.getMathCaptcha().then((res) => {
        this.imageData = res.data.img
        this.validateKey = res.data.key
        this.validateResult = ''
        this.ttl = res.data.ttl
        this.startCountDown(this.ttl)
      })
    },
    startCountDown (timeRemain) {
      if (this.timer) {
        clearTimeout(this.timer)
      }
      this.timeRemain = timeRemain
      this.timer = setInterval(() => {
        this.timeRemain--
        if (this.timeRemain <= 0) {
          clearInterval(this.timer)
          this.timeRemain = 0
        }
      }, 1000)
    },
    concatResult (index) {
      this.validateResult = parseInt(String(this.validateResult) + String(index))
    }

  },
  props: {
    capture: {
      type: String,
      default: 'validator',
      required: false
    },
    trigger: {
      type: String,
      default: 'validator-trigger',
      required: false
    }
  }
}
</script>

<template>
  <div>

    <div style="display: flex">
      <div class="validator-item">
        <!--      display area-->
        <el-image v-if="imageData" style="cursor: pointer" @dbclick="getImageData" :src="imageData"></el-image>
      </div>
      <div class="validator-item">
        <!--      refresh area-->
        <el-button @click="getImageData"><i class="el-icon-refresh"></i></el-button>
      </div>
      <div class="validator-item">
        <!--      result input area-->
        <el-input style="width: 60px;font-size: 16px" :disabled="!timeRemain" type="text" v-model="validateResult"
                  name="validate_result"></el-input>
      </div>
      <div class="validator-item" v-if="timer">
        剩余 {{ timeRemain }} s
      </div>
      <div>
        <!--      validate date area-->
        <el-input type="hidden" name="validate_key" :value="validateKey"></el-input>
      </div>
    </div>
    <div style="padding-top: 10px">
      <div style="display: grid;grid-template-columns: repeat(10, 1fr);grid-gap: 5px;justify-content: center">
        <el-tag v-for="(i,index) in 10" style="cursor: pointer" @click="concatResult(index)" :key="index">{{ index }}</el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.validator-item {
  display: flex;
  align-items: center;
  padding-right: 5px;
}
</style>
