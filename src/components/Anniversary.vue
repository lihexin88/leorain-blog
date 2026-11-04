<template>
  <el-card shadow="hover" class="anniversary">
    <div class="calendar-toolbar">
      <button type="button" aria-label="上个月" @click="changeMonth(-1)">‹</button>
      <strong>{{ month.replace('-', '年') }}月</strong>
      <button type="button" aria-label="下个月" @click="changeMonth(1)">›</button>
      <button type="button" @click="month = currentDay.slice(0, 7)">今天</button>
    </div>
    <p v-if="loading" role="status">正在加载纪念日…</p>
    <p v-else-if="error" role="alert">加载失败 <button type="button" @click="load">重试</button></p>
    <div class="calendar" aria-label="纪念日日历">
      <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
      <div
        v-for="cell in cells" :key="cell.date" class="calendar-day"
        :class="{ muted: !cell.date.startsWith(month), today: cell.date === currentDay }"
        :aria-label="`${cell.date} 农历${cell.lunar.full}`"
      >
        <time :datetime="cell.date">{{ Number(cell.date.slice(-2)) }}</time>
        <span class="lunar-date" :title="`农历${cell.lunar.full}`">{{ cell.lunar.label }}</span>
        <span v-for="item in cell.events" :key="item.id" class="event" :title="item.title">
          {{ item.title }}
        </span>
      </div>
    </div>
    <template v-if="loaded && !error">
      <ul class="countdowns" aria-label="距今时长与未来计划">
        <li v-for="item in counters" :key="item.id">
          <template v-if="item.type === 'elapsed'">{{ item.title }} <strong>{{ item.days }}天</strong></template>
          <template v-else-if="item.days > 0">距离{{ item.title }}还有 <strong>{{ item.days }}天</strong></template>
          <template v-else-if="item.days === 0">{{ item.title }} <strong>就是今天</strong></template>
          <template v-else>{{ item.title }}已过去 <strong>{{ -item.days }}天</strong></template>
        </li>
      </ul>
      <p v-if="!counters.length" class="empty">暂无公开的距今时长或未来计划</p>
      <ul class="countdowns holidays" aria-label="未来三个节假日">
        <li v-for="holiday in holidays" :key="holiday.date + holiday.title">
          距离{{ holiday.title }}还有 <strong>{{ holiday.days }}天</strong>
        </li>
      </ul>
    </template>
  </el-card>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getAnniversaries } from '@/apis/anniversary'
import { format, lunarDate, monthCells, occursOn, today } from '@/utils/anniversary.mjs'

defineOptions({ name: 'AnniversaryCalendar' })

const currentDay = ref(today())
const month = ref(currentDay.value.slice(0, 7))
const records = ref([])
const holidays = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref(false)
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const counters = computed(() => records.value.filter(item => ['elapsed', 'plan'].includes(item.type)))
const cells = computed(() => monthCells(month.value).map(date => ({
  date,
  lunar: lunarDate(date),
  events: records.value.filter(item => occursOn(item, date))
})))
function changeMonth (offset) {
  const [year, value] = month.value.split('-').map(Number)
  const next = format(new Date(Date.UTC(year, value - 1 + offset, 1))).slice(0, 7)
  if (next >= '1900-01' && next <= '2100-12') month.value = next
}
async function load () {
  if (loading.value) return
  loading.value = true
  error.value = false
  try {
    const data = await getAnniversaries()
    currentDay.value = data.today
    records.value = data.anniversaries
    holidays.value = data.holidays
    loaded.value = true
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
let timer
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (today() !== currentDay.value) load()
  }, 60000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.anniversary { color: var(--el-text-color-primary); }
.calendar-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.calendar-toolbar strong { flex: 1; text-align: center; }
button { cursor: pointer; color: var(--el-text-color-primary); background: var(--el-fill-color-light); border: 1px solid var(--el-border-color); border-radius: 5px; padding: 4px 9px; }
button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
.weekday { text-align: center; font-size: 12px; padding-bottom: 6px; color: var(--el-text-color-secondary); }
.calendar-day { min-height: 50px; min-width: 0; padding: 3px; border-radius: 5px; background: var(--el-fill-color-light); font-size: 12px; text-align: center; }
.calendar-day.muted { opacity: 0.45; }
.calendar-day.today { box-shadow: inset 0 0 0 1px var(--el-color-primary); color: var(--el-color-primary); }
.lunar-date { display: block; margin-top: 3px; font-size: 10px; line-height: 1.3; color: var(--el-text-color-secondary); overflow-wrap: anywhere; }
.event { display: block; overflow-wrap: anywhere; margin-top: 3px; font-size: 10px; line-height: 1.3; color: var(--el-color-primary); }
.countdowns { list-style: none; padding: 0; margin: 14px 0 0; font-size: 13px; line-height: 1.9; overflow-wrap: anywhere; }
.countdowns strong { color: var(--el-color-primary); white-space: nowrap; }
.holidays { border-top: 1px solid var(--el-border-color-lighter); padding-top: 10px; }
.empty { color: var(--el-text-color-secondary); font-size: 12px; }
</style>
