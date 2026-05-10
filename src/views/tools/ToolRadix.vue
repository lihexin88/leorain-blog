<template>
  <div class="radix-converter-container">
    <el-card class="box-card info-card">
      <template v-slot:header>
        <div class="clearfix">
          <i class="el-icon-info"></i>
          <span>进制介绍</span>
        </div>
      </template>
      <p>在数学中，进制是一种记数方式，亦称进位制或进位计数法。最常用的是十进制，它使用10个数字（0-9）。在计算机科学中，二进制（0-1）、八进制（0-7）和十六进制（0-9,
        A-F）非常重要。</p>
    </el-card>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <!-- 常用进制转换 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="box-card">
          <template v-slot:header>
            <div class="clearfix">
              <span>常用进制转换</span>
            </div>
          </template>
          <el-form ref="form" :model="radixData" label-width="100px">
            <el-form-item v-for="radix in commonRadixes" :key="radix.base" :label="radix.label">
              <el-input v-model="radixData['r' + radix.base]" @input="updateFrom(radix.base)"
                        :placeholder="radix.placeholder">
                <template v-slot:append>
                  <el-button icon="el-icon-document-copy" @click="copyValue(radixData['r' + radix.base])"
                             title="复制"></el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <div class="button-group">
            <el-button type="danger" @click="clearAll" icon="el-icon-delete">清空</el-button>
            <el-button type="primary" @click="saveToHistory" icon="el-icon-plus">保存到历史记录</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 自定义进制转换 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="box-card">
          <template v-slot:header>
            <div class="clearfix">
              <span>自定义进制转换</span>
            </div>
          </template>
          <el-form label-width="100px">
            <el-form-item label="数值">
              <el-input v-model="customRadix.number" placeholder="输入要转换的数值"></el-input>
            </el-form-item>
            <el-form-item label="原进制">
              <el-input-number v-model="customRadix.from" :min="2" :max="36"></el-input-number>
            </el-form-item>
            <div class="swap-button-container">
              <el-button @click="swapCustomRadix" icon="el-icon-sort" type="primary" circle></el-button>
            </div>
            <el-form-item label="目标进制">
              <el-input-number v-model="customRadix.to" :min="2" :max="36"></el-input-number>
            </el-form-item>
            <el-form-item label="结果">
              <el-input :value="customRadixResult" readonly placeholder="转换结果">
                <template v-slot:append>
                  <el-button icon="el-icon-document-copy" @click="copyValue(customRadixResult)"
                             title="复制"></el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="button-group">
              <el-button type="primary" @click="saveCustomToHistory" icon="el-icon-plus">保存到历史记录</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 进制计算 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="box-card">
          <template v-slot:header>
            <div class="clearfix">
              <span>进制计算</span>
            </div>
          </template>
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
                <template v-slot:append>
                  <el-button icon="el-icon-document-copy" @click="copyValue(calcResult)"
                             title="复制"></el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="button-group">
              <el-button type="primary" @click="saveCalcToHistory" icon="el-icon-plus">保存到历史记录</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史记录 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="box-card">
          <template v-slot:header>
            <div class="clearfix">
              <span>历史记录</span>
              <el-button style="float: right; padding: 3px 0" type="text" @click="clearHistory" icon="el-icon-delete">
                清空历史
              </el-button>
            </div>
          </template>
          <div class="history-list">
            <div v-if="historyList.length === 0" class="empty-history">
              暂无历史记录
            </div>
            <div v-for="(item, index) in historyList" :key="index" class="history-item">
              <div class="history-content">{{ item.content }}</div>
              <div class="history-time">{{ item.time }}</div>
              <div class="history-actions">
                <el-button type="text" size="small" @click="copyValue(item.content)" icon="el-icon-document-copy">复制
                </el-button>
                <el-button type="text" size="small" @click="deleteHistoryItem(index)" icon="el-icon-delete">删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
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
  padding: 20px;
}

.function-card {
  margin-bottom: 20px;
}

.box-card {
  border-radius: 10px;
  transition: all 0.3s;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.info-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #abecd6 0%, #fbed96 100%);
  color: #333;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both
}

.swap-button-container {
  display: flex;
  justify-content: center;
  margin: -10px 0 10px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.history-header {
  margin-bottom: 15px;
}

.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.empty-history {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.history-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.history-content {
  font-size: 14px;
  margin-bottom: 8px;
  word-break: break-all;
}

.history-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.history-actions {
  display: flex;
  gap: 10px;
}

@include mobile {
  .card-col {
    margin-bottom: 20px;
  }
}
</style>
