import moment from 'moment/moment'

export function stack_error (response) {
  if (typeof response.data === 'string') {
    toastr.error(response.status + ' ' + response.statusText)
  } else {
    let data = response.data.errors
    let content = ''

    Object.keys(data).map(function (key, index) {
      let value = data[key]

      content += '<span style="color: #e74c3c">' + value[0] + '</span><br>'
    })

    swal({
      title: 'Error Text!',
      type: 'error',
      html: content
    })
  }
}

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
 * @param per_page
 */
export function sync_url_paginate (page, per_page) {
  const params = new URLSearchParams(window.location.search)
  if (page) {
    params.set('page', page) // 修改参数
  }
  if (per_page) {
    params.set('per_page', per_page) // 修改参数
  }
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
}

/**
 * 修改url中的参数
 * @param object
 */
export function sync_url_params (object) {
  const params = new URLSearchParams(window.location.search)
  Object.keys(object).map(key => {
    if (object[key] === null || object[key] === '') {
      params.delete(key)
    } else {
      params.set(key, object[key])
    }
  })
  if (params.size > 0) {
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  } else {
    window.history.replaceState({}, '', `${window.location.pathname}`)
  }
}

/**
 * 获取url中的参数
 * @param object
 */
export function get_url_params () {
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

export function max_string (string, max_length = 20) {
  if (max_length <= 0) {
    max_length = 20
  }
  let result = string.slice(0, max_length)
  if (string.length > max_length) {
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
