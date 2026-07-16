import customEmojiApi from '@/apis/customEmoji'

let customEmojiMap = {}
export let customEmoji = []

// 合并并发请求：多个组件同时调用时只发一次网络请求
let emojiDataPromise = null
let emojiDataLoaded = false

function normalizeEmojiItem (item) {
  if (item.image_url.match(/\.(png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)$/)) {
    const url = new URL(item.image_url)
    url.searchParams.set('x-oss-process', 'style/emoji')
    item.image_url = url.href
  }

  // short name -> imageUrl，供表情文本替换
  customEmojiMap[item.short_names[0]] = item.image_url
  return {
    id: item.short_names[0],
    name: item.name,
    short_names: item.short_names,
    text: item.text,
    emoticons: item.emoticons,
    keywords: item.keywords,
    skins: [{ src: item.image_url }]
  }
}

export async function getEmojiData () {
  // 已加载成功则直接返回缓存，避免重复请求
  if (emojiDataLoaded) {
    return customEmoji
  }

  // 已有进行中的请求则复用同一 Promise
  if (emojiDataPromise) {
    return emojiDataPromise
  }

  emojiDataPromise = (async () => {
    try {
      const response = await customEmojiApi.getEmojiData()
      const list = Array.isArray(response?.data) ? response.data : []
      customEmojiMap = {}
      const result = list.map(normalizeEmojiItem)
      customEmoji = result
      emojiDataLoaded = true
      return result
    } catch (error) {
      // 失败时清空 promise，允许后续重试
      emojiDataPromise = null
      throw error
    }
  })()

  return emojiDataPromise
}

export const emojiI18n = {
  search: '搜索...',
  notfound: '无结果，换个词试试',
  categories: {
    search: '搜索结果',
    recent: '常用',
    people: '表情与人物',
    nature: '动物与自然',
    foods: '食物与饮料',
    activity: '活动',
    places: '旅行与地点',
    objects: '物品',
    symbols: '符号',
    flags: '旗帜',
    custom: '自定义'
  },
  skins: {
    choose: '选择肤色',
    1: '默认',
    2: '浅色',
    3: '中等浅色',
    4: '中等肤色',
    5: '中等深色',
    6: '深色'
  }
}

export async function emojiToImage (text) {
  if (!emojiDataLoaded) {
    try {
      await getEmojiData()
    } catch (error) {
      // 拉取失败时保持原文，不阻塞渲染
      console.error('Failed to load custom emoji data:', error)
      return text
    }
  }

  return text.replace(/:([a-z0-9_+-]+):/g, (match, emoji) => {
    if (!customEmojiMap[emoji]) {
      return match
    }
    return '<img class="emoji-image" width="64" alt="emoji:' + emoji + '" src="' + customEmojiMap[emoji] + '" />'
  })
}
