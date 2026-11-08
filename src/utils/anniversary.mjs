export const types = { elapsed: '距今时长', plan: '未来计划', anniversary: '纪念日' }
export const repeats = { week: '每周', month: '每月', year: '每年' }
export const parse = value => new Date(`${value}T00:00:00Z`)
export const format = date => date.toISOString().slice(0, 10)
export const addDays = (value, days) => format(new Date(+parse(value) + days * 86400000))
export const daysBetween = (from, to) => Math.round((parse(to) - parse(from)) / 86400000)
export function today () {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = type => parts.find(p => p.type === type).value
  return `${part('year')}-${part('month')}-${part('day')}`
}
function clamped (year, month, day) {
  return format(new Date(Date.UTC(year, month, Math.min(day, new Date(Date.UTC(year, month + 1, 0)).getUTCDate()))))
}
export function occursOn (item, date) {
  if (date < item.date) return false
  if (item.type !== 'anniversary') return date === item.date
  const start = parse(item.date)
  const target = parse(date)
  if (item.repeat === 'week') return daysBetween(item.date, date) % 7 === 0
  if (item.repeat === 'year' && start.getUTCMonth() !== target.getUTCMonth()) return false
  return date === clamped(target.getUTCFullYear(), target.getUTCMonth(), start.getUTCDate())
}
export function nextOccurrence (item, now) {
  if (item.type !== 'anniversary' || now <= item.date) return item.date
  const start = parse(item.date)
  const current = parse(now)
  if (item.repeat === 'week') return addDays(item.date, Math.ceil(daysBetween(item.date, now) / 7) * 7)
  const year = current.getUTCFullYear()
  const month = item.repeat === 'year' ? start.getUTCMonth() : current.getUTCMonth()
  const candidate = clamped(year, month, start.getUTCDate())
  if (candidate >= now) return candidate
  return item.repeat === 'year' ? clamped(year + 1, month, start.getUTCDate()) : clamped(year, month + 1, start.getUTCDate())
}
export function status (item, now) {
  if (item.type === 'elapsed') return `已经 ${daysBetween(item.date, now)} 天`
  const days = daysBetween(now, nextOccurrence(item, now))
  if (days === 0) return item.type === 'plan' ? '今天已到达' : '今天就是纪念日'
  return days > 0 ? `还有 ${days} 天` : `已过去 ${-days} 天`
}
export function monthCells (month) {
  const first = `${month}-01`
  const offset = (parse(first).getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset))
}

const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai'
})
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
export function lunarDate (date) {
  const parts = lunarFormatter.formatToParts(parse(date))
  const month = parts.find(part => part.type === 'month').value
  const day = Number(parts.find(part => part.type === 'day').value)
  return { label: day === 1 ? month : lunarDays[day - 1], full: `${month}${lunarDays[day - 1]}` }
}
