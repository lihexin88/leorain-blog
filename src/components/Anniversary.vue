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
      <section v-if="counters.length" class="timeline-section" aria-labelledby="counter-timeline-title">
        <h3 id="counter-timeline-title" class="timeline-title">距今时长</h3>
        <ul class="timeline" aria-label="距今时长与未来计划">
          <li v-for="item in counters" :key="item.id" class="timeline-item">
            <span class="timeline-node" aria-hidden="true"></span>
            <div class="timeline-card">
              <span class="timeline-kind">{{ item.type === 'elapsed' ? '距今时长' : '未来计划' }}</span>
              <p>
                <template v-if="item.type === 'elapsed'">{{ item.title }}已经 <strong>{{ item.days }}天</strong></template>
                <template v-else-if="item.days > 0">距离{{ item.title }}还有 <strong>{{ item.days }}天</strong></template>
                <template v-else-if="item.days === 0">{{ item.title }} <strong>就是今天</strong></template>
                <template v-else>{{ item.title }}已过去 <strong>{{ -item.days }}天</strong></template>
              </p>
              <time :datetime="item.date">{{ item.date }}</time>
            </div>
          </li>
        </ul>
      </section>
      <p v-if="!counters.length" class="empty">暂无公开的距今时长或未来计划</p>
      <section v-if="holidays.length" class="timeline-section holidays" aria-labelledby="holiday-timeline-title">
        <h3 id="holiday-timeline-title" class="timeline-title">未来节假日</h3>
        <ul class="timeline" aria-label="未来三个节假日">
          <li v-for="holiday in holidays" :key="holiday.date + holiday.title" class="timeline-item">
            <span class="timeline-node" aria-hidden="true"></span>
            <div class="timeline-card">
              <span class="timeline-kind">节假日</span>
              <p>距离{{ holiday.title }}还有 <strong>{{ holiday.days }}天</strong></p>
              <time :datetime="holiday.date">{{ holiday.date }}</time>
            </div>
          </li>
        </ul>
      </section>
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
.timeline-section { margin-top: 18px; }
.timeline-section.holidays { border-top: 1px solid var(--el-border-color-lighter); padding-top: 16px; }
.timeline-title { margin: 0 0 10px; font-size: 14px; font-weight: 600; }
.timeline { position: relative; list-style: none; padding: 2px 0 2px 22px; margin: 0; overflow-wrap: anywhere; }
.timeline::before { position: absolute; top: 8px; bottom: 8px; left: 6px; width: 2px; border-radius: 2px; background: var(--el-color-primary-light-7); box-shadow: 0 0 5px var(--el-color-primary-light-5); content: ''; }
.timeline::after { position: absolute; top: 8px; bottom: 8px; left: 5px; width: 4px; border-radius: 4px; background: linear-gradient(180deg, transparent 0%, var(--el-color-primary-light-5) 28%, rgb(255 255 255 / 95%) 50%, var(--el-color-primary) 72%, transparent 100%); background-repeat: no-repeat; background-position: 0 -100%; background-size: 100% 45%; filter: drop-shadow(0 0 4px var(--el-color-primary)); content: ''; pointer-events: none; animation: timeline-flow 2s linear infinite; }
.timeline-item { position: relative; padding: 0 0 12px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-node { position: absolute; top: 14px; left: -20px; z-index: 1; width: 10px; height: 10px; border: 2px solid var(--el-bg-color); border-radius: 50%; background: var(--el-color-primary); box-shadow: 0 0 0 3px var(--el-color-primary-light-8); animation: timeline-pulse 2s ease-in-out infinite; }
.timeline-card { padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.timeline-card:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 5px 14px rgb(0 0 0 / 6%); transform: translateX(3px); }
.timeline-card p { margin: 4px 0; font-size: 13px; line-height: 1.6; }
.timeline-card strong { color: var(--el-color-primary); white-space: nowrap; }
.timeline-card time { color: var(--el-text-color-secondary); font-size: 11px; }
.timeline-kind { color: var(--el-color-primary); font-size: 11px; }
.empty { color: var(--el-text-color-secondary); font-size: 12px; }
@keyframes timeline-flow {
  from { background-position: 0 -100%; }
  to { background-position: 0 200%; }
}
@keyframes timeline-pulse { 50% { box-shadow: 0 0 0 6px transparent; } }
@media (prefers-reduced-motion: reduce) {
  .timeline::after, .timeline-node { animation: none; }
  .timeline::after { background-position: 0 50%; }
  .timeline-card { transition: none; }
}
</style>
