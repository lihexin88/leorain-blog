<template>
  <div>
    <div class="markdown" @click="handleEvent" ref="markdownContent" v-html="rawHtml"></div>
    <el-dialog show-footer :show="executor.show_exec_result" @cancel="executor.show_exec_result = false">
      <div slot="title" style="display: flex">
        <div>运行结果</div>
        <div style="display: flex;justify-content: end;align-items: center;font-size: .7em;padding-left: 20px">
          <i v-if="executor.cost_time">耗时:{{ executor.cost_time }}ms</i>
        </div>
      </div>
      <div>
        <pre>
        <code style="color: #e83e8c">
{{ executor.result }}
        </code>
        </pre>
      </div>
      <div slot="footer" style="display: flex;justify-content: end">
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
    </el-dialog>
    <!-- 图片预览模态框 -->
    <el-dialog :show="showPreview" @cancel="closePreview">
      <div slot="header">预览图片·点击放大</div>
      <div class="modal-content" title="点击放大">
        <image-viewer :show="showPreview" title="点击放大" :image_src="currentImage" alt="Preview"></image-viewer>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import emojione from 'emojione'
import {marked} from "marked";
import DOMPurify from 'dompurify';
import Swal from "sweetalert2";
import {emojiToImage} from "../../emoji/custom/custom_emoji";

export default {
  components: {},
  props: {
    content: {
      type: String,
      default() {
        return null
      }
    }
  },
  data() {
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
      showPreview: false,
      currentImage: null,
    }
  },
  created() {
    let html = this.parse(this.content)
    html = DOMPurify.sanitize(html)
    this.rawHtml = html
    this.$nextTick(this.addCopyButtonEvent)  // 等待 DOM 渲染完成后添加复制按钮事件
  },
  beforeDestroy() {
    // 组件销毁时移除事件监听器
    if (this.$refs.markdownContainer) {
      this.$refs.markdownContainer.removeEventListener('click', this.handleEvent);
    }
  },
  methods: {
    handleEvent(event){
      if (event.target.tagName === 'IMG'){
        this.showPreview = true
        this.currentImage = event.target.src
      }
    },
    closePreview() {
      this.showPreview = false
      this.currentImage = ''
    },
    go_tool_exec() {
      if (this.executor.executor_url === null) {
        toastr.error("打开失败")
        return false
      }
      const code_encode = encodeURIComponent(this.executor.code)
      window.open(this.executor.executor_url + "?code=" + code_encode)
    },
    // 添加唯一编码
     fn_Guid() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return (s4() +s4() +"-" +s4() +"-" +s4() +"-" + s4() +"-" +s4() +s4() +s4()
        );
    },
    parse(content) {
      marked.setOptions({
        highlight: (code, lang) => {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, {language}).value;
        },
        langPrefix: 'hljs language-',
        sanitize: false,
      })
      const renderer = new marked.Renderer();

      // 自定义标题渲染，生成 ID 并存入 toc
      renderer.heading = (text, level) => {
        const id = this.fn_Guid(text);
        return `<h${level} id="${id}">${text}</h${level}>`;
      };

      let htmlContent = emojione.toImage(marked(content, {breaks: true,renderer: renderer}))
      htmlContent = emojiToImage(htmlContent)

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
    addCopyButtonEvent() {
      // 用于记录上一次点击的按钮
      let lastClickedButton = null;
      // 查找所有复制按钮并添加点击事件
      const buttons = document.querySelectorAll('.copy-button')
      buttons.forEach(button => {
        button.addEventListener('click', (event) => {
          // 获取按钮前面的 <code> 元素
          const codeElement = button.closest('pre').querySelector('code')
          if (codeElement) {
            const codeText = codeElement.innerText
            navigator.clipboard.writeText(codeText).then(() => {
              // 重置上一个按钮状态
              if (lastClickedButton && lastClickedButton !== button) {
                lastClickedButton.innerText = '复制';
              }

              // 设置当前按钮状态为“已复制”
              button.innerText = '已复制';
              lastClickedButton = button; // 更新最近点击的按钮
              toastr.success('已复制', '', {
                positionClass: 'toast-bottom-right', // 设置单个通知的位置
                timeOut: 1000
              });
            }).catch(err => {
              toastr.warning('复制失败:', '')
            })
          } else {
            toastr.warning('未找到代码元素', '')
          }
        })
      })
      const executors = document.querySelectorAll('.executor-button')
      executors.forEach(item => {
        item.addEventListener('click', (event) => {
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
                break;
              case 'language-php':
                this.exec('php', code)
                break;
              case 'language-java':
                this.exec('java', code)
                break;
              case 'language-cpp':
              case 'language-c++':
                this.exec('cpp', code)
                break;
              case 'language-go':
                this.exec('go', code)
                break;
              case 'language-python':
                this.exec('python', code)
                break;
            }
          })
          console.log(tagClass)
        })
      })
    },
    exec(language, code) {
      this.executor.code = code
      this.executor.cost_time = null
      let api = ''
      let version = ''
      let executor_url = ''
      switch (language) {
        case 'php':
          api = 'exec/php'
          executor_url = 'tools/php'
          version = 74
          break;
        case 'c':
          api = 'exec/clang'
          executor_url = 'tools/clang'
          version = 11
          break;
        case 'java':
          api = 'exec/java'
          executor_url = 'tools/java'
          version = 17
          break;
        case 'cpp':
          api = 'exec/cpp'
          executor_url = 'tools/cpp'
          version = 11
          break;
        case 'python':
          api = 'exec/python'
          executor_url = 'tools/python'
          version = 38
          break;
        case 'go':
          api = 'exec/golang'
          executor_url = 'tools/golang'
          version = 120
          break;
      }
      if (api === '') {
        toastr.error('语言不支持')
        return false
      }
      this.executor.executor_url = executor_url
      this.$http.post(api, {
        code: code,
        version: version
      }).then((response) => {
        if (response.status === 200) {
          this.executor.result = "运行中..."
          this.executor.recordId = response.data.record_id
          let time = 1
          const intervalId = setInterval(async () => {
            await this.$http.post('exec/get_result', {
              record_id: this.executor.recordId
            }).then((intervalResponse) => {
              let status = intervalResponse.data.data.status
              if (status === 3) {
                toastr.success("执行成功")
                this.executor.result = intervalResponse.data.data.output
                if (intervalResponse.data.data.endTime !== 0) {
                  this.executor.cost_time = intervalResponse.data.data.endTime - intervalResponse.data.data.startTime
                }
                // this.executor.cost_time =
                clearInterval(intervalId)
              } else if (status === 4) {
                toastr.error("运行失败")
                this.executor.result = ''
                clearInterval(intervalId)
              } else {
                time++
              }
              if (time > 30) {
                toastr.error("运行超时")
                this.executor.result = ''
                clearInterval(intervalId)
              }
            })
          }, 1000)

        } else {
          this.executor.result = ''
          toastr.error("运行失败")
        }
        this.executor.show_exec_result = true

      }).catch((e) => {
        if (e.status === 401) {
          Swal.fire({
            title: "auth.unauthorized",
            text: "auth.unauthorized",
            icon: 'error',
            confirmButtonText: '确定',
            cancelButtonText: "取消",
            animation: true
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/login'
            }
          });
        }
        this.result = ''
        toastr.error("运行失败")
      })
    }
  },
}
</script>

<style>
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
  border-radius: 4px; /* 圆角边框 */
  transition: box-shadow 0.1s ease; /* 光晕效果渐变 */
}

.markdown pre code {
  overflow-wrap: break-word;
  white-space: pre-wrap; /* 自动换行 */
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
}

.executor-button:hover {
  background-color: #46a1f1;
}
</style>
