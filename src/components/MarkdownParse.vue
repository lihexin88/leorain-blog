<template>
  <div>
    <div class="markdown" @click="handleEvent" ref="markdownContent" v-html="rawHtml"></div>
    <el-dialog show-footer :show="executor.show_exec_result" @cancel="executor.show_exec_result = false">
      <template v-slot:header>
        <div style="display: flex">
          <div>运行结果</div>
          <div style="display: flex;justify-content: end;align-items: center;font-size: .7em;padding-left: 20px">
            <i v-if="executor.cost_time">耗时:{{ executor.cost_time }}ms</i>
          </div>
        </div>
      </template>
      <div>
        <pre>
        <code style="color: #e83e8c">
{{ executor.result }}
        </code>
        </pre>
      </div>
      <template v-slot:footer>
        <div style="display: flex;justify-content: end">
          <div style="padding-right: 10px">
            <el-button type="success" @click="go_tool_exec">
              打开在线编辑器
            </el-button>
          </div>
          <div style="padding-right: 10px">
            <el-button @click="executor.show_exec_result = false">
              关闭
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
    <el-image
      v-if="currentImage"
      ref="elImage"
      class="markdown-preview-trigger"
      :src="currentImage"
      :preview-src-list="[currentImage]"
      :preview-teleport="true"
      @close="closePreview"
    >
    </el-image>
  </div>
</template>

<script>
import emojione from 'emojione'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { emojiToImage } from '@/services/customEmoji'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export default {
  components: {},
  props: {
    content: {
      type: String,
      default () {
        return null
      }
    }
  },
  data () {
    return {
      rawHtml: '',
      executor: {
        recordId: null,
        result: null,
        show_exec_result: false,
        code: null,
        executor_url: null,
        cost_time: 0
      },
      currentImage: null
    }
  },
  async created () {
    let html = await this.parse(this.content)
    html = DOMPurify.sanitize(html)
    this.rawHtml = html
    this.$nextTick(() => {
      this.addCopyButtonEvent()
    }) // 等待 DOM 渲染完成后添加复制按钮事件
  },
  beforeUnmount () {
    // 组件销毁时移除事件监听器
    if (this.$refs.markdownContainer) {
      this.$refs.markdownContainer.removeEventListener('click', this.handleEvent)
    }
  },
  methods: {
    handleEvent (event) {
      if (event.target.tagName === 'IMG') {
        this.currentImage = event.target.src
        this.$nextTick(() => {
          const elImage = this.$refs.elImage
          if (elImage) {
            const img = elImage.$el.querySelector('img')
            if (img) {
              img.click()
            }
          }
        })
      }
    },
    closePreview () {
      this.currentImage = ''
    },
    go_tool_exec () {
      if (this.executor.executor_url === null) {
        this.$message.error('打开失败')
        return false
      }
      const codeEncode = encodeURIComponent(this.executor.code)
      window.open(this.executor.executor_url + '?code=' + codeEncode)
    },
    // 添加唯一编码
    fn_Guid () {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
      }

      return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
      )
    },
    async parse (content) {
      if (!content) return ''

      marked.setOptions({
        highlight: (code, lang) => {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext'
          return hljs.highlight(code, { language }).value
        },
        langPrefix: 'hljs language-',
        sanitize: false
      })
      const renderer = new marked.Renderer()

      // 自定义标题渲染，生成 ID 并存入 toc
      renderer.heading = (text, level) => {
        const id = this.fn_Guid(text)
        return `<h${level} id="${id}">${text}</h${level}>`
      }

      let htmlContent = emojione.toImage(marked(content, { breaks: true, renderer }))
      try {
        htmlContent = await emojiToImage(htmlContent)
      } catch (error) {
        console.error('Error processing emoji:', error)
      }

      // 在每个代码块后添加复制按钮
      htmlContent = htmlContent.replace(/(<pre>.*?)/g, match => {
        return `${match}<button class="copy-button">复制</button>`
      })
      // 在每个代码块后添加复制按钮
      htmlContent = htmlContent.replace(/(<code class="hljs language-(php|java|go|cpp|c\+\+|c|python)">.*?)/g, match => {
        return `<button class="executor-button">运行</button>${match}`
      })
      return htmlContent
    },
    addCopyButtonEvent () {
      // 用于记录上一次点击的按钮
      let lastClickedButton = null
      // 查找所有复制按钮并添加点击事件
      const buttons = document.querySelectorAll('.copy-button')
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          // 获取按钮前面的 <code> 元素
          const codeElement = button.closest('pre').querySelector('code')
          if (codeElement) {
            const codeText = codeElement.innerText
            navigator.clipboard.writeText(codeText).then(() => {
              // 重置上一个按钮状态
              if (lastClickedButton && lastClickedButton !== button) {
                lastClickedButton.innerText = '复制'
              }

              // 设置当前按钮状态为“已复制”
              button.innerText = '已复制'
              lastClickedButton = button // 更新最近点击的按钮
              this.$message.success('已复制', '', {
                positionClass: 'toast-bottom-right', // 设置单个通知的位置
                timeOut: 1000
              })
            }).catch(() => {
              this.$message.warning('复制失败:', '')
            })
          } else {
            this.$message.warning('未找到代码元素', '')
          }
        })
      })
      const executors = document.querySelectorAll('.executor-button')
      executors.forEach(item => {
        item.addEventListener('click', () => {
          // 获取 code 里面的值
          const codeTag = item.nextElementSibling
          if (codeTag.tagName !== 'CODE') {
            return false
          }
          // 代码
          const code = codeTag.textContent
          // 获取语言
          const tagClass = codeTag.classList
          tagClass.forEach((item) => {
            console.log(item)
            switch (item) {
              case 'language-c':
                this.exec('c', code)
                break
              case 'language-php':
                this.exec('php', code)
                break
              case 'language-java':
                this.exec('java', code)
                break
              case 'language-cpp':
              case 'language-c++':
                this.exec('cpp', code)
                break
              case 'language-go':
                this.exec('go', code)
                break
              case 'language-python':
                this.exec('python', code)
                break
            }
          })
          console.log(tagClass)
        })
      })
    },
    exec (language, code) {
      this.executor.code = code
      this.executor.cost_time = null
      let api = ''
      let version = ''
      let executorUrl = ''
      switch (language) {
        case 'php':
          api = 'exec/php'
          executorUrl = 'tools/php'
          version = 74
          break
        case 'c':
          api = 'exec/clang'
          executorUrl = 'tools/clang'
          version = 11
          break
        case 'java':
          api = 'exec/java'
          executorUrl = 'tools/java'
          version = 17
          break
        case 'cpp':
          api = 'exec/cpp'
          executorUrl = 'tools/cpp'
          version = 11
          break
        case 'python':
          api = 'exec/python'
          executorUrl = 'tools/python'
          version = 38
          break
        case 'go':
          api = 'exec/golang'
          executorUrl = 'tools/golang'
          version = 120
          break
      }
      if (api === '') {
        this.$message.error('语言不支持')
        return false
      }
      this.executor.executor_url = executorUrl
      this.$http.post(api, {
        code,
        version
      }).then((response) => {
        if (response.status === 200) {
          this.executor.result = '运行中...'
          this.executor.recordId = response.data.record_id
          let time = 1
          const intervalId = setInterval(async () => {
            await this.$http.post('exec/get_result', {
              record_id: this.executor.recordId
            }).then((intervalResponse) => {
              let status = intervalResponse.data.data.status
              if (status === 3) {
                this.$message.success('执行成功')
                this.executor.result = intervalResponse.data.data.output
                if (intervalResponse.data.data.endTime !== 0) {
                  this.executor.cost_time = intervalResponse.data.data.endTime - intervalResponse.data.data.startTime
                }
                // this.executor.cost_time =
                clearInterval(intervalId)
              } else if (status === 4) {
                this.$message.error('运行失败')
                this.executor.result = ''
                clearInterval(intervalId)
              } else {
                time++
              }
              if (time > 30) {
                this.$message.error('运行超时')
                this.executor.result = ''
                clearInterval(intervalId)
              }
            })
          }, 1000)
        } else {
          this.executor.result = ''
          this.$message.error('运行失败')
        }
        this.executor.show_exec_result = true
      }).catch(() => {
        this.result = ''
        this.$message.error('运行失败')
      })
    }
  }
}
</script>

<style scoped lang="scss">
.markdown-preview-trigger {
  position: fixed;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.markdown-preview-trigger :deep(.el-image__inner) {
  display: block;
  width: 0;
  height: 0;
}

.copy-button {
  cursor: pointer;
  background-color: #4d5155;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  text-align: center;
  opacity: .8;
  float: right;
}

.copy-button:hover {
  background-color: #a8bbd5;
}

pre:hover .copy-button {
  opacity: .7;
}

.markdown pre {
  padding: 10px; /* 添加内边距 */
  border: 1px solid var(--article-border, rgba(0, 0, 0, 0.06));
  border-radius: 4px; /* 圆角边框 */
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
  color: var(--card-text-color, #111827);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.1s ease, color 0.3s ease; /* 光晕效果渐变 */
}

.markdown pre code {
  overflow-wrap: break-word;
  white-space: pre-wrap; /* 自动换行 */
}

.markdown .hljs {
  background-color: transparent;
  color: var(--card-text-color, #111827);
}

.markdown code:not(.hljs) {
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
  color: var(--card-text-color, #111827);
}

.markdown pre:hover {
  box-shadow: 0 0 10px rgba(168, 187, 213, 1), 0 0 40px rgba(168, 187, 213, 0.8); /* 发光效果 */
}

.executor-button {
  cursor: pointer;
  margin-right: 10px;
  background-color: #0062fb;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  text-align: center;
  opacity: .8;
  float: right;
}

.markdown {
  padding-left: 10px;
  padding-right: 10px;
  background-color: var(--article-item-bg, rgba(255, 255, 255, 0.81));
  color: var(--card-text-color, #111827);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.markdown p,
.markdown li,
.markdown h1,
.markdown h2,
.markdown h3,
.markdown h4,
.markdown h5,
.markdown h6,
.markdown blockquote,
.markdown table,
.markdown th,
.markdown td {
  color: var(--card-text-color, #111827);
}

.markdown a,
.markdown strong {
  color: var(--theme-accent-color, #7c3aed);
}

.executor-button:hover {
  background-color: #46a1f1;
}
</style>
