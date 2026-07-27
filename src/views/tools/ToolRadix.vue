<template>
  <div class="radix-converter-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>进制转换工具</span>
        </div>
      </template>

      <div class="info-section">
        <p>
          在数学中，进制是一种记数方式，亦称进位制或进位计数法。最常用的是十进制，它使用10个数字（0-9）。在计算机科学中，二进制（0-1）、八进制（0-7）和十六进制（0-9, A-F）非常重要。
        </p>
      </div>

      <div class="radix-sections">
        <!-- 常用进制转换 -->
        <div class="section-box">
          <div class="section-title">常用进制转换</div>
          <el-form ref="form" :model="radixData" label-width="100px">
            <el-form-item v-for="radix in commonRadixes" :key="radix.base" :label="radix.label">
              <el-input
                  v-model="radixData['r' + radix.base]"
                  @input="updateFrom(radix.base)"
                  :placeholder="radix.placeholder"
              >
                <template #append>
                  <el-button @click="copyValue(radixData['r' + radix.base])" title="复制">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <div class="button-group">
            <el-button type="danger" @click="clearAll">清空</el-button>
            <el-button type="primary" @click="saveToHistory">保存到历史记录</el-button>
          </div>
        </div>

        <!-- 自定义进制转换 -->
        <div class="section-box">
          <div class="section-title">自定义进制转换</div>
          <el-form label-width="100px">
            <el-form-item label="数值">
              <el-input v-model="customRadix.number" placeholder="输入要转换的数值"></el-input>
            </el-form-item>
            <el-form-item label="原进制">
              <el-input-number v-model="customRadix.from" :min="2" :max="36"></el-input-number>
            </el-form-item>
            <div class="swap-button-container">
              <el-button @click="swapCustomRadix" type="primary" circle>⇅</el-button>
            </div>
            <el-form-item label="目标进制">
              <el-input-number v-model="customRadix.to" :min="2" :max="36"></el-input-number>
            </el-form-item>
            <el-form-item label="结果">
              <el-input :value="customRadixResult" readonly placeholder="转换结果">
                <template #append>
                  <el-button @click="copyValue(customRadixResult)" title="复制">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="button-group">
              <el-button type="primary" @click="saveCustomToHistory">保存到历史记录</el-button>
            </div>
          </el-form>
        </div>

        <!-- 进制计算 -->
        <div class="section-box">
          <div class="section-title">进制计算</div>
          <el-form label-width="100px">
            <el-form-item label="数值1">
              <el-input v-model="calc.number1" placeholder="第一个数值"></el-input>
            </el-form-item>
            <el-form-item label="进制">
              <el-input-number v-model="calc.radix" :min="2" :max="36"></el-input-number>
            </el-form-item>
            <el-form-item label="运算符">
              <el-radio-group v-model="calc.operator">
                <el-radio-button label="+">加</el-radio-button>
                <el-radio-button label="-">减</el-radio-button>
                <el-radio-button label="*">乘</el-radio-button>
                <el-radio-button label="/">除</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="数值2">
              <el-input v-model="calc.number2" placeholder="第二个数值"></el-input>
            </el-form-item>
            <el-form-item label="结果">
              <el-input :value="calcResult" readonly placeholder="计算结果">
                <template #append>
                  <el-button @click="copyValue(calcResult)" title="复制">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="button-group">
              <el-button type="primary" @click="saveCalcToHistory">保存到历史记录</el-button>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 历史记录 -->
      <div class="history-section">
        <div class="history-header">
          <span class="section-title">历史记录</span>
          <el-button type="primary" link @click="clearHistory">清空历史</el-button>
        </div>
        <div class="history-list">
          <div v-if="historyList.length === 0" class="empty-history">
            暂无历史记录
          </div>
          <div v-for="(item, index) in historyList" :key="'history-'+index" class="history-item">
            <div class="history-content">{{ item.content }}</div>
            <div class="history-time">{{ item.time }}</div>
            <div class="history-actions">
              <el-button type="primary" link size="small" @click="copyValue(item.content)">复制</el-button>
              <el-button type="danger" link size="small" @click="deleteHistoryItem(index)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  tdk: {
    title: '在线进制转换工具',
    description: '在线进行二进制、八进制、十进制、十六进制等多种进制之间的相互转换。',
    keywords: '进制转换, 二进制, 八进制, 十进制, 十六进制, 在线工具'
  },
  data () {
    return {
      radixData: {
        r2: '',
        r8: '',
        r10: '',
        r16: ''
      },
      updating: false,
      customRadix: {
        number: '',
        from: 10,
        to: 2
      },
      calc: {
        number1: '',
        number2: '',
        radix: 10,
        operator: '+'
      },
      historyList: [],
      commonRadixes: [
        { base: 2, label: '二进制 (2)', placeholder: '例如: 1010' },
        { base: 8, label: '八进制 (8)', placeholder: '例如: 12' },
        { base: 10, label: '十进制 (10)', placeholder: '例如: 10' },
        { base: 16, label: '十六进制 (16)', placeholder: '例如: A' }
      ]
    }
  },
  computed: {
    customRadixResult () {
      if (this.customRadix.number.trim() === '') {
        return ''
      }
      const num = parseInt(this.customRadix.number, this.customRadix.from)
      if (isNaN(num)) {
        return '无效数字'
      }
      return num.toString(this.customRadix.to).toUpperCase()
    },
    calcResult () {
      if (!this.calc.number1 || !this.calc.number2) {
        return ''
      }
      const num1 = parseInt(this.calc.number1, this.calc.radix)
      const num2 = parseInt(this.calc.number2, this.calc.radix)
      if (isNaN(num1) || isNaN(num2)) {
        return '无效数字'
      }
      let result
      switch (this.calc.operator) {
        case '+':
          result = num1 + num2
          break
        case '-':
          result = num1 - num2
          break
        case '*':
          result = num1 * num2
          break
        case '/':
          if (num2 === 0) {
            return '除数不能为零'
          }
          result = num1 / num2
          break
        default:
          return ''
      }
      return result.toString(this.calc.radix).toUpperCase()
    }
  },
  methods: {
    updateFrom (radix) {
      if (this.updating) return
      this.updating = true

      const value = this.radixData['r' + radix]

      if (value.trim() === '') {
        this.clearAll()
        this.updating = false
        return
      }

      const num = parseInt(value, radix)

      if (isNaN(num)) {
        this.$message.error('无效的输入')
        this.$nextTick(() => {
          this.updating = false
        })
        return
      }

      this.commonRadixes.forEach(r => {
        if (r.base !== radix) {
          this.radixData['r' + r.base] = num.toString(r.base).toUpperCase()
        }
      })

      this.$nextTick(() => {
        this.updating = false
      })
    },
    clearAll () {
      for (const key in this.radixData) {
        this.radixData[key] = ''
      }
    },
    swapCustomRadix () {
      [this.customRadix.from, this.customRadix.to] = [this.customRadix.to, this.customRadix.from]
    },
    copyValue (value) {
      if (!value) return
      const textarea = document.createElement('textarea')
      textarea.value = value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      this.$message.success('复制成功')
    },
    saveToHistory () {
      const content = `十进制: ${this.radixData.r10} | 二进制: ${this.radixData.r2} | 八进制: ${this.radixData.r8} | 十六进制: ${this.radixData.r16}`
      if (this.radixData.r10.trim() === '') {
        this.$message.warning('请先输入数值')
        return
      }
      this.historyList.unshift({
        content,
        time: new Date().toLocaleString()
      })
      this.$message.success('已保存到历史记录')
    },
    saveCustomToHistory () {
      if (!this.customRadix.number) {
        this.$message.warning('请先输入数值')
        return
      }
      const content = `${this.customRadix.number} (${this.customRadix.from}进制) → ${this.customRadixResult} (${this.customRadix.to}进制)`
      this.historyList.unshift({
        content,
        time: new Date().toLocaleString()
      })
      this.$message.success('已保存到历史记录')
    },
    saveCalcToHistory () {
      if (!this.calcResult) {
        this.$message.warning('请先完成计算')
        return
      }
      const content = `${this.calc.number1} ${this.calc.operator} ${this.calc.number2} = ${this.calcResult} (${this.calc.radix}进制)`
      this.historyList.unshift({
        content,
        time: new Date().toLocaleString()
      })
      this.$message.success('已保存到历史记录')
    },
    clearHistory () {
      this.$confirm('确定要清空所有历史记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.historyList = []
        this.$message.success('已清空历史记录')
      }).catch(() => {
      })
    },
    deleteHistoryItem (index) {
      this.historyList.splice(index, 1)
      this.$message.success('已删除')
    }
  }
}
</script>

<style scoped lang="scss">
.radix-converter-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;

  .card-header {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .info-section {
    margin-bottom: 16px;
    padding: 12px 14px;
    background: var(--el-fill-color-light);
    border-radius: 8px;

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: var(--el-text-color-regular);
    }
  }

  .radix-sections {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .section-box {
    padding: 14px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    min-width: 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }

  .swap-button-container {
    display: flex;
    justify-content: center;
    margin: -6px 0 10px;
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
  }

  .history-section {
    padding-top: 4px;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .section-title {
      margin-bottom: 0;
    }
  }

  .history-list {
    max-height: 320px;
    overflow-y: auto;
  }

  .empty-history {
    text-align: center;
    color: var(--el-text-color-placeholder);
    padding: 28px 0;
    font-size: 14px;
  }

  .history-item {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .history-content {
    font-size: 14px;
    margin-bottom: 6px;
    word-break: break-all;
    color: var(--el-text-color-primary);
  }

  .history-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  .history-actions {
    display: flex;
    gap: 8px;
  }
}

@include tablet {
  .radix-converter-container {
    .radix-sections {
      grid-template-columns: 1fr;
    }
  }
}

@include mobile {
  .radix-converter-container {
    .radix-sections {
      grid-template-columns: 1fr;
    }

    :deep(.el-form-item__label) {
      width: 90px !important;
    }
  }
}
</style>
