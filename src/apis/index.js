import articleApi from './article'
import tagApi from './tag'
import categoryApi from './categories'
import gitLogApi from './gitLog'
import configApi from './config'
import systemInfoApi from './systemInfo'
import visitorMapApi from './visitorMap'
import customEmojiApi from './customEmoji'
import commentApi from './comment'
import linkApi from './link'
import guestbookApi from './guestbook'
import topicApi from './topic'
import clipboardApi from './clipboard'

export default {
  articleApi,
  tagApi,
  categoryApi,
  gitLogApi,
  configApi,
  systemInfoApi,
  visitorMapApi,
  customEmojiApi,
  commentApi,
  linkApi,
  guestbookApi,
  topicApi,
  clipboardApi
}

// 也可以单独导出各个模块
export {
  articleApi,
  tagApi,
  categoryApi,
  gitLogApi,
  configApi,
  systemInfoApi,
  visitorMapApi,
  customEmojiApi,
  commentApi,
  linkApi,
  guestbookApi,
  topicApi,
  clipboardApi
}
