<template>
  <div class="tool-coder">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>开发工具箱 (ToolCoder)</span>
        </div>
      </template>

      <div class="input-section">
        <div class="label-row">
          <label>输入内容：</label>
          <el-button size="small" type="danger" link @click="inputText = ''">清空输入</el-button>
        </div>
        <el-input
            v-model="inputText"
            type="textarea"
            :rows="6"
            placeholder="在此处输入需要处理的字符串..."
        />
        <div class="stats-row">
          <span>
            字符数: {{ inputText.length }} |
            词数: {{ wordCount }}
          </span>
        </div>
      </div>

      <div class="button-grid">
        <!-- HTML 文本提取 -->
        <el-button type="primary" @click="extractHtmlText">提取 HTML 文本</el-button>
        <!-- URL 编码/解码 -->
        <el-button-group>
          <el-button type="primary" @click="urlEncode">URL Encode</el-button>
          <el-button type="primary" @click="urlDecode">URL Decode</el-button>
        </el-button-group>

        <!-- Base64 编码/解码 -->
        <el-button-group>
          <el-button type="success" @click="base64Encode">Base64 Encode</el-button>
          <el-button type="success" @click="base64Decode">Base64 Decode</el-button>
        </el-button-group>

        <!-- Unicode/中文互转 -->
        <el-button-group>
          <el-button type="warning" @click="unicodeToChinese">Unicode → 中文</el-button>
          <el-button type="warning" @click="chineseToUnicode">中文 → Unicode</el-button>
        </el-button-group>

        <!-- 大小写转换 -->
        <el-button-group>
          <el-button type="info" @click="toUpperCase">TO UPPERCASE</el-button>
          <el-button type="info" @click="toLowerCase">to lowercase</el-button>
        </el-button-group>

        <!-- MD5 哈希 -->
        <el-button type="danger" @click="generateMd5">MD5 Hash</el-button>
      </div>
      <div class="extra-tools">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="tool-item">
              <label>指定子串：</label>
              <el-input v-model="subString" placeholder="统计此串出现次数" size="small">
                <template #append>
                  <el-button @click="countOccurrence">统计</el-button>
                </template>
              </el-input>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="tool-item">
              <label>生成密码：</label>
              <div class="password-options">
                <el-input-number v-model="passLength" :min="1" :max="100" size="small" />
                <el-checkbox-group v-model="passOptions" size="small">
                  <el-checkbox label="digits">数字</el-checkbox>
                  <el-checkbox label="letters">字母</el-checkbox>
                  <el-checkbox label="symbols">符号</el-checkbox>
                </el-checkbox-group>
                <el-button type="success" size="small" @click="generatePassword">生成</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="output-section">
        <div class="label-row">
          <label>输出结果：</label>
          <el-button size="small" type="primary" link @click="copyToClipboard">复制结果</el-button>
        </div>
        <el-input
            v-model="outputText"
            type="textarea"
            :rows="6"
            readonly
            placeholder="处理后的结果将在这里显示..."
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const outputText = ref('')
const subString = ref('')
const passLength = ref(16)
const passOptions = ref(['digits', 'letters'])

const wordCount = computed(() => {
  if (!inputText.value) return 0
  return inputText.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

// URL 编解码
const urlEncode = () => {
  if (!inputText.value) return
  try {
    outputText.value = encodeURIComponent(inputText.value)
  } catch (e) {
    ElMessage.error('URL 编码失败: ' + e.message)
  }
}

const urlDecode = () => {
  if (!inputText.value) return
  try {
    outputText.value = decodeURIComponent(inputText.value)
  } catch (e) {
    ElMessage.error('URL 解码失败: ' + e.message)
  }
}

// Base64 编解码 (使用 CryptoJS 更好地处理中文)
const base64Encode = () => {
  if (!inputText.value) return
  try {
    const words = CryptoJS.enc.Utf8.parse(inputText.value)
    outputText.value = CryptoJS.enc.Base64.stringify(words)
  } catch (e) {
    ElMessage.error('Base64 编码失败: ' + e.message)
  }
}

const base64Decode = () => {
  if (!inputText.value) return
  try {
    const words = CryptoJS.enc.Base64.parse(inputText.value)
    outputText.value = words.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    ElMessage.error('Base64 解码失败: ' + e.message)
  }
}

// MD5
const generateMd5 = () => {
  if (!inputText.value) return
  try {
    outputText.value = CryptoJS.MD5(inputText.value).toString()
  } catch (e) {
    ElMessage.error('MD5 生成失败: ' + e.message)
  }
}

// Unicode / 中文 互转
const unicodeToChinese = () => {
  if (!inputText.value) return
  try {
    // 处理 \uXXXX 格式
    outputText.value = inputText.value.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16))
    })
  } catch (e) {
    ElMessage.error('Unicode 转中文失败: ' + e.message)
  }
}

const chineseToUnicode = () => {
  if (!inputText.value) return
  try {
    let res = ''
    for (let i = 0; i < inputText.value.length; i++) {
      const charCode = inputText.value.charCodeAt(i)
      // 非 ASCII 字符转 Unicode
      if (charCode > 127) {
        res += '\\u' + charCode.toString(16).padStart(4, '0')
      } else {
        res += inputText.value[i]
      }
    }
    outputText.value = res
  } catch (e) {
    ElMessage.error('中文转 Unicode 失败: ' + e.message)
  }
}

// 大小写转换
const toUpperCase = () => {
  if (!inputText.value) return
  outputText.value = inputText.value.toUpperCase()
}

const toLowerCase = () => {
  if (!inputText.value) return
  outputText.value = inputText.value.toLowerCase()
}

// 提取 HTML 中的文本
const extractHtmlText = () => {
  if (!inputText.value) return
  try {
    const doc = new DOMParser().parseFromString(inputText.value, 'text/html')
    outputText.value = doc.body.innerText || doc.body.textContent || ''
  } catch (e) {
    ElMessage.error('HTML 提取失败: ' + e.message)
  }
}

// 统计指定字符串出现次数
const countOccurrence = () => {
  if (!inputText.value || !subString.value) {
    ElMessage.warning('请输入内容和要统计的子串')
    return
  }
  const regex = new RegExp(subString.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  const matches = inputText.value.match(regex)
  const count = matches ? matches.length : 0
  ElMessage.success(`子串 "${subString.value}" 出现了 ${count} 次`)
}

// 密码生成器
const generatePassword = () => {
  const digits = '0123456789'
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charSet = ''
  if (passOptions.value.includes('digits')) charSet += digits
  if (passOptions.value.includes('letters')) charSet += letters
  if (passOptions.value.includes('symbols')) charSet += symbols

  if (!charSet) {
    ElMessage.warning('请至少选择一类字符')
    return
  }

  let result = ''
  for (let i = 0; i < passLength.value; i++) {
    result += charSet.charAt(Math.floor(Math.random() * charSet.length))
  }
  outputText.value = result
}

// 复制到剪贴板
const copyToClipboard = () => {
  if (!outputText.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  navigator.clipboard.writeText(outputText.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped lang="scss">
.tool-coder {
  max-width: 1000px;
  margin: 10px auto 0 auto;
  padding: 0 10px;

  .card-header {
    font-weight: bold;
    font-size: 1.2rem;
  }

  .input-section, .output-section {
    margin-bottom: 15px;

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      label {
        font-weight: 500;
        color: #606266;
      }
    }

    .stats-row {
      margin-top: 5px;
      font-size: 0.9rem;
      color: #909399;
      text-align: right;
    }
  }

  .extra-tools {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;

    .tool-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.9rem;
        color: #606266;
      }

      .password-options {
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
      }
    }
  }

  .button-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    justify-content: center;

    .el-button-group {
      margin-right: 8px;
    }
  }
}

/* 适配移动端 */
@media (max-width: 768px) {
  .button-grid {
    flex-direction: column;
    align-items: stretch;

    .el-button-group {
      display: flex;
      width: 100%;
      margin-right: 0;
      margin-bottom: 8px;

      .el-button {
        flex: 1;
      }
    }

    .el-button {
      width: 100%;
    }
  }
}
</style>
