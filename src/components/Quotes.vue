<template>
  <div style="width: 100%">
    <el-tooltip placement="top">
      <template v-slot:content>
<div class="quota-popup" >{{ text_tips }}</div>
</template>
      <div @dblclick="get_quotes" style="cursor: pointer;color: grey">
        <div style="color: #2c3e50;font-size: 13px;">
          <div style="display: flex;justify-content: center;align-items:flex-end;height: 70px;overflow-y: hidden">{{ quote_comment }}</div>
          <div style="display: flex;justify-content: flex-end">{{ quote_author }}</div>
          <div style="display: flex;justify-content: flex-end">{{ quote_song_name }}</div>
        </div>
        <div v-if="false">
          <audio style="opacity: .5;height: 30px;width: 100%;max-width: 570px"
                 controls loop :src="song_src"></audio>
        </div>
      </div>
    </el-tooltip>
  </div>
</template>

<script>

export default {
  data () {
    return {
      quote_comment: null,
      quote_author: null,
      song_src: null,
      quote_song_name: null,
      source: null,
      text_tips: ''
    }
  },
  props: {
    quotes_base_url: {
      type: String,
      default: null
    }
  },
  methods: {
    get_quotes () {
      if (this.source !== null) {
        this.source.close()
      }
      this.quote_comment = null
      this.text_tips = ''
      this.source = new EventSource(this.quotes_base_url)
      this.source.addEventListener('open', function (event) {
        // 添加 typing 数据缓存
        // sessionStorage.setItem("quotes_typing", "true")
      })
      this.source.addEventListener('author', (event) => {
        // 写入作者
        this.quote_author = event.data
      }, false)
      this.source.addEventListener('song_name', (event) => {
        // 歌曲名称
        this.quote_song_name = event.data
      }, false)
      this.source.addEventListener('song_id', (event) => {
        // 写入音频
        this.song_src = 'https://music.163.com/song/media/outer/url?id=' + event.data + '.mp3'
      }, false)
      let length = 0
      this.source.addEventListener('typing', (event) => {
        // 写入评论
        let data = event.data
        data = data.replace('\\n', ' ')
        data = data.replace(/"/g, '')
        this.text_tips += data
        if (length++ > 100) {
          data = '.'
        }
        if (length > 104) {
          return
        }
        if (this.quote_comment === null) {
          this.quote_comment = data
        } else {
          this.quote_comment += data
        }
      }, false)
      this.source.addEventListener('close', (event) => {
        // 关闭连接
        this.source.close()
        // 删除光标
        // sessionStorage.removeItem("quotes_typing")
      })
    }
  },
  mounted () {
    this.get_quotes()
  }
}
</script>
<style scoped lang="scss">
.quota-popup{
  max-width: 500px;
}
</style>
