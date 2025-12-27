import moment from 'moment'

// 获取友好的日期格式
export function getFriendlyDate (date) {
  return moment(date).fromNow()
}

// 判断媒体类型
export function mediaType (url) {
  if (!url) return 'unknown'

  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoTypes = ['mp4', 'webm', 'ogg', 'avi', 'mov']

  const extension = url.split('.').pop().toLowerCase()

  if (imageTypes.includes(extension)) {
    return 'image'
  } else if (videoTypes.includes(extension)) {
    return 'video'
  }

  return 'unknown'
}

// 分页布局
export function paginateLayouts () {
  const windowWidth = window.innerWidth
  let smallWindowSize = false
  let layout = 'prev, pager, next'

  if (windowWidth < 768) {
    smallWindowSize = true
    layout = 'prev, next'
  }

  return { smallWindowSize, layout }
}

// 同步URL分页参数
export function sync_url_paginate (page, per_page) {
  const url = new URL(window.location)
  url.searchParams.set('page', page)
  url.searchParams.set('per_page', per_page)
  window.history.replaceState({}, '', url)
}

// 同步URL参数
export function sync_url_params (params) {
  const url = new URL(window.location)

  Object.keys(params).forEach(key => {
    if (params[key] === null) {
      url.searchParams.delete(key)
    } else {
      url.searchParams.set(key, params[key])
    }
  })

  window.history.replaceState({}, '', url)
}
