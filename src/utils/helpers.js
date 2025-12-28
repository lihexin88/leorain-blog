import moment from 'moment/moment'

export function mediaType (fileName) {
  if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
    return 'image'
  } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv)$/)) {
    return 'video'
  } else if (fileName.match(/\.(mp3|wav|ogg)$/)) {
    return 'audio'
  } else {
    return 'file'
  }
}

/**
 * 修改url中的分页参数
 * @param page
 * @param perPage
 */
export function syncUrlPaginate (page, perPage) {
  const params = new URLSearchParams(window.location.search)
  if (page) {
    params.set('page', page) // 修改参数
  }
  if (perPage) {
    params.set('per_page', perPage) // 修改参数
  }
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
}

/**
 * 获取url中的参数
 * @param object
 */
export function getUrlParams () {
  const urlParams = new URLSearchParams(window.location.search)
  let urlParamsObject = {}
  urlParams.forEach((value, key) => {
    urlParamsObject[key] = value
  })
  return urlParamsObject
}

/**
 * 分页样式
 * @returns {{smallWindowSize: boolean, layout: string}}
 */
export function paginateLayouts () {
  if (window.matchMedia('(orientation: portrait)').matches) {
    return {
      smallWindowSize: true,
      layout: 'prev, pager, next'
    }
  } else {
    return {
      smallWindowSize: false,
      layout: 'prev, pager, next, sizes, total'
    }
  }
}

export function maxString (string, maxLength = 20) {
  if (maxLength <= 0) {
    maxLength = 20
  }
  let result = string.slice(0, maxLength)
  if (string.length > maxLength) {
    result += '...'
  }
  return result
}

function parseDate (input) {
  const [datePart, timePart] = input.split(' ')
  const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10))
  const [hours, minutes, seconds] = timePart.split(':').map(num => parseInt(num, 10))
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

function getYearDifference (date1, date2) {
  let yearDiff = date2.getFullYear() - date1.getFullYear()
  const date1Month = date1.getMonth()
  const date2Month = date2.getMonth()
  if (date2Month < date1Month || (date2Month === date1Month && date2.getDate() < date1.getDate())) {
    yearDiff--
  }
  return yearDiff
}

function getMonthDifference (date1, date2) {
  let monthDiff = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth())
  if (date2.getDate() < date1.getDate()) {
    monthDiff--
  }
  return monthDiff < 0 ? 0 : monthDiff
}

function getDayDifference (date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  const diffTime = d2.getTime() - d1.getTime()
  return Math.floor(diffTime / (1000 * 3600 * 24))
}

export function getFriendlyDate (targetStr) {
  const targetDate = parseDate(targetStr)
  const now = new Date()

  const yearDiff = getYearDifference(targetDate, now)
  if (yearDiff > 0) {
    return `${yearDiff}年前`
  }

  const monthDiff = getMonthDifference(targetDate, now)
  if (monthDiff > 0) {
    return `${monthDiff}个月前`
  }

  const dayDiff = getDayDifference(targetDate, now)
  if (dayDiff > 0) {
    return `${dayDiff}天前`
  }

  const delta = now.getTime() - targetDate.getTime()
  const hours = Math.floor(delta / (1000 * 60 * 60))
  if (hours > 0) {
    return `${hours}小时前`
  }

  const minutes = Math.floor(delta / (1000 * 60))
  if (minutes > 0) {
    return `${minutes}分钟前`
  }

  const seconds = Math.floor(delta / 1000)
  return seconds > 0 ? `${seconds}秒前` : '刚刚'
}
export function getHumanReadableDate (inputDuration) {
  const duration = moment.duration(inputDuration)

  // 获取人类友好的时间格式
  const years = Math.floor(duration.asYears()) // 获取完整天数
  const days = Math.floor(duration.days()) // 获取天数
  const month = duration.months() // 获取小时数（去除天数部分）
  const hours = duration.hours() // 获取小时数（去除天数部分）
  const minutes = duration.minutes() // 获取分钟数
  const seconds = duration.seconds() // 获取秒数
  let dateDisplay = ''
  dateDisplay = `${years} 年 `
  if (month === 0) {
    dateDisplay += '零'
  } else {
    dateDisplay += ` ${month} 月 `
  }
  if (days === 0) {
    dateDisplay += '零'
  } else {
    dateDisplay += ` ${days} 天`
  }
  dateDisplay += ` ${hours} 小时 ${minutes} 分 ${seconds} 秒`
  return dateDisplay
}
/**
 * Converts a data URL (base64 string) to a Blob object.
 *
 * @param {string} dataURL - The data URL to be converted, including the base64-encoded data and MIME type.
 * @return {Blob} A Blob object created from the data URL.
 */
export function dataURLToBlob (dataURL) {
  const byteString = atob(dataURL.split(',')[1])
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}

/**
 * 更新url中的参数
 * @param paramName
 * @param paramValue
 */
export function updateURLParameter (paramName, paramValue) {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.search)

  // 如果参数已存在，则更新其值；否则，添加新参数
  if (params.has(paramName)) {
    params.set(paramName, paramValue)
  } else {
    params.append(paramName, paramValue)
  }

  // 使用 pushState() 更新 URL，避免页面刷新
  const newUrl = `${url.origin}${url.pathname}?${params.toString()}${url.hash}`
  window.history.pushState({ path: newUrl }, '', newUrl)
}
