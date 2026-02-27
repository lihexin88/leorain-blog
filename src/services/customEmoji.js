import customEmojiApi from '@/apis/customEmoji'

let customEmojiMap = {}
export let customEmoji = []

export async function getEmojiData () {
  const response = await customEmojiApi.getEmojiData()
  const result = response.data.map(item => {
    if (item.image_url.match(/\.(png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)$/)) {
      let url = new URL(item.image_url)
      url.searchParams.set('x-oss-process', 'style/emoji')
      item.image_url = url.href
    }

    // 转换为short name 和 imageUrl 的映射，方便进行表情和地址的替换
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
  })
  customEmoji = result
  return result
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
  if (Object.keys(customEmojiMap).length === 0) {
    await getEmojiData()
  }
  return text.replace(/:([a-z0-9_+-]+):/g, (match, emoji) => {
    if (!customEmojiMap[emoji]) {
      return match
    } else {
      return '<img class="emoji-image" width="64" alt="emoji:' + emoji + '" src="' + customEmojiMap[emoji] + '" />'
    }
  })
}
