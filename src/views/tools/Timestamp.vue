<template>
  <div class="timestamp-container">
    <h1 class="main-title">时间工具</h1>
    <el-row :gutter="20">
      <!-- Row 1: Three smaller cards -->
      <el-col :xs="24" :sm="12" :md="8" class="card-col">
        <el-card class="box-card" header-class="header-blue">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-time"></i> 当前时间与时区</span>
          </div>
          <div class="card-content">
            <p><strong>当前时间:</strong> {{ currentTime }}</p>
            <p><strong>时区:</strong> {{ currentTimezone }}</p>
            <el-divider></el-divider>
            <div class="timestamp-line">
              <span><strong>时间戳(秒):</strong> {{ currentTimestampS }}</span>
              <el-button type="primary" icon="el-icon-document-copy" size="mini" circle @click="copyToClipboard(currentTimestampS)"></el-button>
            </div>
            <div class="timestamp-line">
              <span><strong>时间戳(毫秒):</strong> {{ currentTimestampMs }}</span>
              <el-button type="primary" icon="el-icon-document-copy" size="mini" circle @click="copyToClipboard(currentTimestampMs)"></el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="card-col">
        <el-card class="box-card" header-class="header-orange">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-stopwatch"></i> 时间差计算器</span>
          </div>
          <el-form label-position="top">
            <el-form-item label="开始时间">
              <el-date-picker v-model="timeDiffStart" type="datetime" placeholder="选择开始时间" @change="calculateTimeDiff" style="width: 100%;"></el-date-picker>
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="timeDiffEnd" type="datetime" placeholder="选择结束时间" @change="calculateTimeDiff" style="width: 100%;"></el-date-picker>
            </el-form-item>
            <el-alert :title="'时间差: ' + timeDiffResult" type="success" :closable="false" v-if="timeDiffResult"></el-alert>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="card-col">
        <el-card class="box-card" header-class="header-red">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-alarm-clock"></i> 倒计时</span>
          </div>
          <el-form label-position="top">
            <el-form-item label="目标时间">
              <el-date-picker v-model="countdownTarget" type="datetime" placeholder="选择目标时间" style="width: 100%;"></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button-group style="width: 100%; display: flex;">
                <el-button style="flex: 1;" @click="startCountdownWithDuration(10, 'seconds')">10秒</el-button>
                <el-button style="flex: 1;" @click="startCountdownWithDuration(15, 'seconds')">15秒</el-button>
                <el-button style="flex: 1;" @click="startCountdownWithDuration(30, 'seconds')">30秒</el-button>
                <el-button style="flex: 1;" @click="startCountdownWithDuration(1, 'minutes')">1分钟</el-button>
              </el-button-group>
            </el-form-item>
            <el-button v-if="!isCountdownRunning" type="success" @click="startCountdown" style="width: 100%;">开始倒计时</el-button>
            <el-button v-else type="danger" @click="stopCountdown" style="width: 100%;">停止</el-button>
            <div v-if="countdownResult" style="margin-top: 15px;">
              <el-alert :title="'剩余时间: ' + countdownResult" type="success" :closable="false" v-if="!countdownFinished"></el-alert>
              <el-alert title="时间到!" type="error" :closable="false" v-else></el-alert>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- Row 2: Two larger cards -->
      <el-col :xs="24" :sm="12" class="card-col">
        <el-card class="box-card" header-class="header-green">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-refresh"></i> 时间戳与日期时间转换</span>
          </div>
          <el-form label-position="top">
            <el-form-item label="时间戳 (秒或毫秒)">
              <el-input v-model="timestampInput" placeholder="例如, 1678886400" @input="convertTimestampToDatetime">
                <template slot="append">转换</template>
              </el-input>
              <el-alert :title="'日期时间: ' + translatedDatetime" type="info" :closable="false" v-if="translatedDatetime"></el-alert>
            </el-form-item>
            <el-form-item label="日期时间">
              <el-date-picker v-model="datetimeInput" type="datetime" placeholder="选择日期时间" @change="convertDatetimeToTimestamp" style="width: 100%;"></el-date-picker>
              <el-alert :title="'时间戳: ' + translatedTimestamp" type="info" :closable="false" v-if="translatedTimestamp"></el-alert>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" class="card-col">
        <el-card class="box-card" header-class="header-purple">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-location-outline"></i> 时区转换器</span>
          </div>
          <el-form label-position="top">
            <el-form-item label="源时间">
              <el-date-picker v-model="tzConvertTime" type="datetime" placeholder="选择源时间" @change="convertTimezone" style="width: 100%;"></el-date-picker>
            </el-form-item>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="源时区">
                  <el-select v-model="tzFrom" filterable placeholder="选择源时区" @change="convertTimezone" style="width: 100%;">
                    <el-option v-for="tz in timezones" :key="tz" :label="tz" :value="tz"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="目标时区">
                  <el-select v-model="tzTo" filterable placeholder="选择目标时区" @change="convertTimezone" style="width: 100%;">
                    <el-option v-for="tz in timezones" :key="tz" :label="tz" :value="tz"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-alert :title="'转换后时间: ' + tzResult" type="success" :closable="false" v-if="tzResult"></el-alert>
          </el-form>
        </el-card>
      </el-col>

      <!-- Row 3: Full-width card -->
      <el-col :span="24" class="card-col">
        <el-card class="box-card" header-class="header-teal">
          <div slot="header" class="clearfix">
            <span><i class="el-icon-date"></i> 日期计算器</span>
          </div>
          <el-form label-position="top">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="8">
                <el-form-item label="基准日期">
                  <el-date-picker v-model="dateCalcBase" type="datetime" placeholder="选择基准日期" style="width: 100%;"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="16">
                <el-form-item label="加减时间量">
                  <el-row :gutter="5">
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcYears" :min="0" placeholder="年" style="width: 100%;"></el-input-number></el-col>
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcMonths" :min="0" placeholder="月" style="width: 100%;"></el-input-number></el-col>
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcDays" :min="0" placeholder="日" style="width: 100%;"></el-input-number></el-col>
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcHours" :min="0" placeholder="时" style="width: 100%;"></el-input-number></el-col>
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcMinutes" :min="0" placeholder="分" style="width: 100%;"></el-input-number></el-col>
                    <el-col :xs="12" :sm="8" :md="4"><el-input-number v-model="dateCalcSeconds" :min="0" placeholder="秒" style="width: 100%;"></el-input-number></el-col>
                  </el-row>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item style="margin-top: 15px;">
              <el-button-group>
                <el-button type="primary" icon="el-icon-plus" @click="calculateDate('add')">增加</el-button>
                <el-button type="warning" icon="el-icon-minus" @click="calculateDate('subtract')">减少</el-button>
              </el-button-group>
            </el-form-item>
            <el-alert :title="'计算结果: ' + dateCalcResult" type="success" :closable="false" v-if="dateCalcResult"></el-alert>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import moment from 'moment-timezone'
import 'moment/locale/zh-cn'
moment.locale('zh-cn')

export default {
  data () {
    return {
      // Current Time
      currentTime: '',
      currentTimezone: '',
      currentTimestampS: 0,
      currentTimestampMs: 0,
      timer: null,

      // Translator
      timestampInput: '',
      datetimeInput: null,
      translatedDatetime: '',
      translatedTimestamp: '',

      // Time Diff
      timeDiffStart: null,
      timeDiffEnd: null,
      timeDiffResult: '',

      // Timezone Converter
      tzConvertTime: null,
      tzFrom: moment.tz.guess(),
      tzTo: 'UTC',
      tzResult: '',
      timezones: [],

      // Date Calculator
      dateCalcBase: null,
      dateCalcYears: undefined,
      dateCalcMonths: undefined,
      dateCalcDays: undefined,
      dateCalcHours: undefined,
      dateCalcMinutes: undefined,
      dateCalcSeconds: undefined,
      dateCalcResult: '',

      // Countdown
      countdownTarget: null,
      countdownResult: '',
      countdownTimer: null,
      countdownFinished: false,
      isCountdownRunning: false
    }
  },
  mounted () {
    this.updateCurrentTime()
    this.timer = setInterval(this.updateCurrentTime, 1000)
    this.timezones = moment.tz.names()
  },
  beforeUnmount () {
    clearInterval(this.timer)
    clearInterval(this.countdownTimer)
  },
  methods: {
    updateCurrentTime () {
      const now = moment()
      this.currentTime = now.format('YYYY-MM-DD HH:mm:ss')
      this.currentTimezone = now.format('Z (z)')
      this.currentTimestampS = now.unix()
      this.currentTimestampMs = now.valueOf()
    },
    copyToClipboard (text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('复制成功!')
        }).catch(err => {
          this.$message.error('复制失败: ' + err)
        })
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          this.$message.success('复制成功!')
        } catch (err) {
          this.$message.error('复制失败: ' + err)
        }
        document.body.removeChild(textArea)
      }
    },
    convertTimestampToDatetime () {
      if (!this.timestampInput) {
        this.translatedDatetime = ''
        return
      }
      const ts = parseInt(this.timestampInput)
      if (isNaN(ts)) {
        this.translatedDatetime = '无效的时间戳'
        return
      }
      const len = this.timestampInput.length
      if (len === 10) {
        this.translatedDatetime = moment.unix(ts).format('YYYY-MM-DD HH:mm:ss')
      } else if (len === 13) {
        this.translatedDatetime = moment(ts).format('YYYY-MM-DD HH:mm:ss')
      } else {
        this.translatedDatetime = '请输入10位或13位时间戳'
      }
    },
    convertDatetimeToTimestamp () {
      if (!this.datetimeInput) {
        this.translatedTimestamp = ''
        return
      }
      const m = moment(this.datetimeInput)
      this.translatedTimestamp = m.isValid() ? m.unix() : '无效的日期格式'
    },
    calculateTimeDiff () {
      if (this.timeDiffStart && this.timeDiffEnd) {
        const start = moment(this.timeDiffStart)
        const end = moment(this.timeDiffEnd)
        if (start.isValid() && end.isValid()) {
          this.timeDiffResult = moment.duration(end.diff(start)).humanize(true)
        } else {
          this.timeDiffResult = '无效的日期'
        }
      }
    },
    convertTimezone () {
      if (this.tzConvertTime && this.tzFrom && this.tzTo) {
        const sourceTime = moment.tz(this.tzConvertTime, this.tzFrom)
        this.tzResult = sourceTime.clone().tz(this.tzTo).format('YYYY-MM-DD HH:mm:ss Z')
      }
    },
    calculateDate (operation) {
      if (!this.dateCalcBase) {
        this.dateCalcResult = '请输入基准日期'
        return
      }
      const base = moment(this.dateCalcBase)
      const duration = {
        years: this.dateCalcYears || 0,
        months: this.dateCalcMonths || 0,
        days: this.dateCalcDays || 0,
        hours: this.dateCalcHours || 0,
        minutes: this.dateCalcMinutes || 0,
        seconds: this.dateCalcSeconds || 0
      }
      const result = operation === 'add' ? base.add(duration) : base.subtract(duration)
      this.dateCalcResult = result.format('YYYY-MM-DD HH:mm:ss')
    },
    startCountdownWithDuration (amount, unit) {
      this.countdownTarget = moment().add(amount, unit).toDate()
      this.startCountdown()
    },
    startCountdown () {
      if (!this.countdownTarget) {
        this.countdownResult = '请输入目标时间'
        return
      }
      this.countdownFinished = false
      this.isCountdownRunning = true
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
      }
      this.updateCountdown()
      this.countdownTimer = setInterval(this.updateCountdown, 1000)
    },
    stopCountdown () {
      clearInterval(this.countdownTimer)
      this.isCountdownRunning = false
      this.countdownResult = ''
    },
    updateCountdown () {
      const target = moment(this.countdownTarget)
      const now = moment()
      if (target.isBefore(now)) {
        this.countdownResult = '目标时间已过'
        this.countdownFinished = true
        this.isCountdownRunning = false
        clearInterval(this.countdownTimer)
        return
      }
      const diff = moment.duration(target.diff(now))
      const days = Math.floor(diff.asDays())
      const hours = diff.hours()
      const minutes = diff.minutes()
      const seconds = diff.seconds()
      this.countdownResult = `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`
    }
  }
}
</script>

<style scoped lang="scss">
.timestamp-container {
  margin: 20px auto;
  padding: 20px;
  background-color: #f4f7f6;
}

.main-title {
  text-align: center;
  color: #fff;
  background: linear-gradient(45deg, #409EFF, #67C23A);
  padding: 15px 0;
  border-radius: 8px;
  margin-bottom: 25px;
  font-size: 2em;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card-col {
  margin-bottom: 20px;
}

.box-card {
  height: 100%;
  border-radius: 8px;
  border: 1px solid #e6ebf5;
  transition: box-shadow 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  .el-card__header {
    color: #fff;
    font-weight: bold;
    padding: 12px 20px;
    border-bottom: none;
  }
}

.header-blue .el-card__header { background-color: #409EFF; }
.header-green .el-card__header { background-color: #67C23A; }
.header-orange .el-card__header { background-color: #E6A23C; }
.header-purple .el-card__header { background-color: #909399; }
.header-teal .el-card__header { background-color: #20c997; }
.header-red .el-card__header { background-color: #F56C6C; }

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}

.card-content p {
  margin: 0 0 10px;
  font-size: 16px;
}

.timestamp-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 16px;
}

.el-form-item {
  margin-bottom: 12px;
}

.el-alert {
  margin-top: 10px;
  padding: 8px 16px;
}
</style>
