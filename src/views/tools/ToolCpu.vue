<template>
  <div class="cpu-simulator-container">
    <el-card>
      <template v-slot:header>
        <div class="card-header">
          <span>CPU 十位全加器物理电路模拟器</span>
          <el-button
              type="text"
              icon="el-icon-info"
              @click="showIntroDialog = true"
              class="intro-btn"
          >
            全加器简介
          </el-button>
        </div>
      </template>

      <!-- 输入区域 -->
      <div class="input-section">
        <el-input
            v-model.number="input1"
            type="number"
            placeholder="输入1"
            class="input-field"
            :min="-1023"
            :max="1023"
            @keyup.enter="startCalculation"
            clearable
        />
        <el-select
            v-model="operator"
            class="operator-select"
            @keyup.enter="startCalculation"
        >
          <el-option label="+" value="+"></el-option>
          <el-option label="-" value="-"></el-option>
        </el-select>
        <el-input
            v-model.number="input2"
            type="number"
            placeholder="输入2"
            class="input-field"
            :min="-1023"
            :max="1023"
            @keyup.enter="startCalculation"
            clearable
        />
        <span class="equals-sign">=</span>
        <el-input
            :value="result"
            placeholder="结果"
            class="input-field result-field"
            disabled
        />
        <el-button
            type="primary"
            @click="startCalculation"
            :loading="calculating"
            :disabled="calculating"
            class="calculate-btn"
        >
          {{ calculating ? '计算中...' : '开始计算' }}
        </el-button>
      </div>

      <!-- 全加器简介对话框 -->
      <el-dialog
          title="全加器简介"
          v-model:visible="showIntroDialog"
          width="70%"
          :close-on-click-modal="false"
          class="intro-dialog"
      >
        <div class="intro-content">
          <h3>什么是全加器？</h3>
          <p>全加器（Full
            Adder）是数字电路中的基本运算单元，用于执行两个二进制位和一个进位输入的加法运算。它是构成多位加法器的基本组件。</p>

          <h3>全加器的输入输出</h3>
          <ul>
            <li><strong>输入A</strong>：第一个二进制位（0或1）</li>
            <li><strong>输入B</strong>：第二个二进制位（0或1）</li>
            <li><strong>进位输入Cin</strong>：来自低位的进位信号（0或1）</li>
            <li><strong>输出S</strong>：当前位的和（Sum），计算公式：S = A ⊕ B ⊕ Cin</li>
            <li><strong>进位输出Cout</strong>：向高位的进位信号，计算公式：Cout = (A ∧ B) ∨ (Cin ∧ (A ⊕ B))</li>
          </ul>

          <h3>十位全加器的工作原理</h3>
          <p>十位全加器由10个全加器级联组成，从最低位（FA0）到最高位（FA9）依次排列：</p>
          <ol>
            <li><strong>数据输入</strong>：两个10位二进制数通过并行总线输入到各个全加器</li>
            <li><strong>逐位计算</strong>：从最低位开始，每个全加器接收A、B和来自低位的进位Cin</li>
            <li><strong>进位传递</strong>：每个全加器计算出的进位Cout传递给下一个高位全加器作为Cin</li>
            <li><strong>结果输出</strong>：每个全加器输出的S组成最终的和，最高位的Cout表示溢出</li>
          </ol>

          <h3>减法运算的实现</h3>
          <p>减法通过补码加法实现：A - B = A + (-B)。其中-B通过将B的每一位取反后加1得到（补码）。</p>

          <h3>数据流转过程</h3>
          <p>在运算过程中，数据按照以下顺序流动：</p>
          <ol>
            <li>输入数据通过总线到达各个全加器的A和B端口</li>
            <li>进位信号从低位向高位依次传递（通过垂直的进位线）</li>
            <li>每个全加器内部进行逻辑运算</li>
            <li>运算结果S通过输出总线输出，进位Cout传递给下一个全加-器</li>
          </ol>
        </div>
        <template v-slot:footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="showIntroDialog = false">我知道了</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 二进制转换显示 -->
      <div v-if="binaryInput1 || binaryInput2" class="binary-section">
        <el-divider>二进制转换</el-divider>
        <div class="binary-display">
          <div class="binary-item">
            <span class="binary-label">输入1 ({{ input1 }})：</span>
            <span class="binary-value">{{ binaryInput1 }}</span>
          </div>
          <div class="binary-item">
            <span class="binary-label">输入2 ({{ input2 }})：</span>
            <span class="binary-value">{{ binaryInput2 }}</span>
          </div>
          <div v-if="operator === '-'" class="binary-item">
            <span class="binary-label">输入2 补码：</span>
            <span class="binary-value">{{ binaryInput2Complement }}</span>
          </div>
        </div>
      </div>

      <!-- 物理全加器电路 -->
      <div class="circuit-section">
        <el-divider>十位全加器物理电路</el-divider>
        <div class="circuit-container">
          <!-- 输入总线 -->
          <div class="bus-row input-bus-a">
            <div class="bus-label">输入 A</div>
            <div class="bus-lines">
              <div
                  v-for="(adder, index) in adders"
                  :key="`bus-a-${index}`"
                  class="bus-line"
                  :class="{ 'line-active': isLineActive(index, 'input-a') }"
              >
                <div class="line-value" :class="{ 'value-visible': adder.a !== null }">
                  {{ adder.a !== null ? adder.a : (binaryInput1 ? binaryInput1.split('').reverse()[index] : '?') }}
                </div>
              </div>
            </div>
          </div>

          <div class="bus-row input-bus-b">
            <div class="bus-label">输入 B</div>
            <div class="bus-lines">
              <div
                  v-for="(adder, index) in adders"
                  :key="`bus-b-${index}`"
                  class="bus-line"
                  :class="{ 'line-active': isLineActive(index, 'input-b') }"
              >
                <div class="line-value" :class="{ 'value-visible': adder.b !== null }">
                  {{
                    adder.b !== null ? adder.b : (binaryInput2 || binaryInput2Complement ? (operator === '-' ? binaryInput2Complement : binaryInput2).split('').reverse()[index] : '?')
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- 全加器电路 -->
          <div class="adders-circuit">
            <div
                v-for="(adder, index) in adders"
                :key="index"
                class="adder-circuit-wrapper"
            >
              <!-- 进位输入线（从上一个全加器） -->
              <div
                  v-if="index > 0"
                  class="carry-wire carry-in-wire"
                  :class="{ 'wire-active': isCarryActive(index, 'in') }"
              >
                <div class="wire-line" :class="{ 'line-active': isCarryActive(index, 'in') }"></div>
                <div class="carry-label carry-in-label">C<sub>in</sub></div>
                <div class="carry-value"
                     :class="{ 'value-visible': adder.cin !== null, 'value-active': isCarryActive(index, 'in') }">
                  {{ adder.cin !== null ? adder.cin : '' }}
                </div>
              </div>

              <!-- 全加器芯片 -->
              <div class="adder-chip" :class="{ 'chip-active': adder.dataFlow === 'processing' }">
                <div class="chip-label">FA{{ index }}</div>

                <!-- 输入端口 -->
                <div class="chip-ports chip-inputs">
                  <div class="port port-a" :class="{ 'port-active': isPortActive(adder, 'a') }">
                    <div class="port-label">A</div>
                    <div class="port-value">{{ adder.a !== null ? adder.a : '?' }}</div>
                    <div class="port-wire" :class="{ 'wire-active': isPortActive(adder, 'a') }"></div>
                  </div>
                  <div class="port port-b" :class="{ 'port-active': isPortActive(adder, 'b') }">
                    <div class="port-label">B</div>
                    <div class="port-value">{{ adder.b !== null ? adder.b : '?' }}</div>
                    <div class="port-wire" :class="{ 'wire-active': isPortActive(adder, 'b') }"></div>
                  </div>
                  <div class="port port-cin" :class="{ 'port-active': isPortActive(adder, 'cin') }">
                    <div class="port-label">C<sub>in</sub></div>
                    <div class="port-value">{{ adder.cin !== null ? adder.cin : '?' }}</div>
                    <div class="port-wire" :class="{ 'wire-active': isPortActive(adder, 'cin') }"></div>
                  </div>
                </div>

                <!-- 芯片内部处理指示 -->
                <div class="chip-process" v-if="adder.dataFlow === 'processing'">
                  <div class="process-indicator">
                    <i class="el-icon-loading"></i>
                    <span>处理中...</span>
                  </div>
                </div>

                <!-- 输出端口 -->
                <div class="chip-ports chip-outputs">
                  <div class="port port-s" :class="{ 'port-active': isPortActive(adder, 's') }">
                    <div class="port-label">S</div>
                    <div class="port-value">{{ adder.s !== null ? adder.s : '?' }}</div>
                    <div class="port-wire" :class="{ 'wire-active': isPortActive(adder, 's') }"></div>
                  </div>
                  <div
                      v-if="index < adders.length - 1"
                      class="port port-cout"
                      :class="{ 'port-active': isPortActive(adder, 'cout') }"
                  >
                    <div class="port-label">C<sub>out</sub></div>
                    <div class="port-value">{{ adder.cout !== null ? adder.cout : '?' }}</div>
                    <div class="port-wire" :class="{ 'wire-active': isPortActive(adder, 'cout') }"></div>
                  </div>
                </div>
              </div>

              <!-- 进位输出线（到下一个全加器） -->
              <div
                  v-if="index < adders.length - 1"
                  class="carry-wire carry-out-wire"
                  :class="{ 'wire-active': isCarryActive(index, 'out') }"
              >
                <div class="wire-line" :class="{ 'line-active': isCarryActive(index, 'out') }"></div>
                <div class="carry-label carry-out-label">C<sub>out</sub></div>
                <div class="carry-value"
                     :class="{ 'value-visible': adder.cout !== null, 'value-active': isCarryActive(index, 'out') }">
                  {{ adder.cout !== null ? adder.cout : '' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 输出总线 -->
          <div class="bus-row output-bus">
            <div class="bus-label">输出 S</div>
            <div class="bus-lines">
              <div
                  v-for="(adder, index) in adders"
                  :key="`bus-s-${index}`"
                  class="bus-line"
                  :class="{ 'line-active': isLineActive(index, 'output-s') }"
              >
                <div class="line-value" :class="{ 'value-visible': adder.s !== null }">
                  {{ adder.s !== null ? adder.s : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果展示 -->
      <div v-if="finalResult !== null" class="result-section">
        <el-divider>最终结果</el-divider>
        <div class="result-display">
          <div class="result-item">
            <span class="result-label">二进制结果：</span>
            <span class="result-value">{{ binaryResult }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">十进制结果：</span>
            <span class="result-value highlight">{{ finalResult }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ToolCpu',
  data () {
    // 初始化10个全加器
    const initAdders = () => {
      return Array(10).fill(null).map((_, index) => ({
        bit: index,
        a: null,
        b: null,
        cin: null,
        s: null,
        cout: null,
        dataFlow: 'idle'
      }))
    }

    return {
      input1: null,
      input2: null,
      operator: '+',
      result: '',
      binaryInput1: '',
      binaryInput2: '',
      binaryInput2Complement: '',
      adders: initAdders(), // 初始化时就创建10个全加器
      finalResult: null,
      binaryResult: '',
      calculating: false,
      animationTimer: null,
      activeLines: new Set(), // 当前活跃的线路
      activeCarries: new Set(), // 当前活跃的进位
      showIntroDialog: false // 控制简介对话框显示
    }
  },
  methods: {
    // 将数字转换为10位二进制（补码表示）
    toBinary (num, bits = 10) {
      if (num >= 0) {
        return num.toString(2).padStart(bits, '0')
      } else {
        const positive = Math.abs(num)
        const binary = positive.toString(2).padStart(bits, '0')
        let inverted = ''
        for (let i = 0; i < bits; i++) {
          inverted += binary[i] === '0' ? '1' : '0'
        }
        let complement = ''
        let carry = 1
        for (let i = bits - 1; i >= 0; i--) {
          const bit = parseInt(inverted[i])
          const sum = bit + carry
          complement = (sum % 2) + complement
          carry = Math.floor(sum / 2)
        }
        return complement
      }
    },

    // 二进制转十进制（补码）
    binaryToDecimal (binary) {
      const bits = binary.length
      if (binary[0] === '1') {
        let inverted = ''
        for (let i = 0; i < bits; i++) {
          inverted += binary[i] === '0' ? '1' : '0'
        }
        let positive = ''
        let carry = 1
        for (let i = bits - 1; i >= 0; i--) {
          const bit = parseInt(inverted[i])
          const sum = bit + carry
          positive = (sum % 2) + positive
          carry = Math.floor(sum / 2)
        }
        return -parseInt(positive, 2)
      } else {
        return parseInt(binary, 2)
      }
    },

    // 全加器运算
    fullAdder (a, b, cin) {
      const s = (a ^ b ^ cin) & 1
      const cout = ((a & b) | (cin & (a ^ b))) & 1
      return { s, cout }
    },

    // 判断线路是否活跃
    isLineActive (index, type) {
      const key = `${type}-${index}`
      return this.activeLines.has(key)
    },

    // 判断进位是否活跃
    isCarryActive (index, direction) {
      const key = `carry-${direction}-${index}`
      return this.activeCarries.has(key)
    },

    // 判断端口是否活跃
    isPortActive (adder, port) {
      if (!adder) return false
      if (port === 'a' && adder.dataFlow === 'input') return true
      if (port === 'b' && adder.dataFlow === 'input') return true
      if (port === 'cin' && adder.dataFlow === 'carry-in') return true
      if (port === 's' && adder.dataFlow === 'output') return true
      if (port === 'cout' && adder.dataFlow === 'carry-out') return true
      return false
    },

    // 开始计算
    async startCalculation () {
      if (this.input1 === null || this.input2 === null || this.input1 === '' || this.input2 === '') {
        this.$message.warning('请输入两个数字')
        return
      }

      const num1 = parseInt(this.input1)
      const num2 = parseInt(this.input2)

      if (isNaN(num1) || isNaN(num2)) {
        this.$message.warning('请输入有效的数字')
        return
      }

      if (Math.abs(num1) > 1023 || Math.abs(num2) > 1023) {
        this.$message.warning('输入数字必须在 -1023 到 1023 之间')
        return
      }

      this.calculating = true
      this.activeLines.clear()
      this.activeCarries.clear()
      this.finalResult = null
      this.result = ''

      // 重置所有全加器状态
      this.adders.forEach(adder => {
        adder.a = null
        adder.b = null
        adder.cin = null
        adder.s = null
        adder.cout = null
        adder.dataFlow = 'idle'
      })

      // 转换为二进制
      const bits = 10
      this.binaryInput1 = this.toBinary(num1, bits)
      this.binaryInput2 = this.toBinary(num2, bits)

      // 如果是减法，计算第二个数的补码
      let binary2 = this.binaryInput2
      if (this.operator === '-') {
        let inverted = ''
        for (let i = 0; i < bits; i++) {
          inverted += this.binaryInput2[i] === '0' ? '1' : '0'
        }
        let complement = ''
        let carry = 1
        for (let i = bits - 1; i >= 0; i--) {
          const bit = parseInt(inverted[i])
          const sum = bit + carry
          complement = (sum % 2) + complement
          carry = Math.floor(sum / 2)
        }
        binary2 = complement
        this.binaryInput2Complement = binary2
      } else {
        this.binaryInput2Complement = ''
      }

      // 准备数据
      const binary1Reversed = this.binaryInput1.split('').reverse()
      const binary2Reversed = binary2.split('').reverse()

      // 执行计算并动画展示数据流
      await this.animateDataFlow(binary1Reversed, binary2Reversed, bits)
    },

    // 动画展示数据流转过程
    async animateDataFlow (binary1Reversed, binary2Reversed, bits) {
      let carry = 0
      let resultBinary = ''

      // 从最低位到最高位逐位计算
      for (let i = 0; i < bits; i++) {
        const bit1 = parseInt(binary1Reversed[i])
        const bit2 = parseInt(binary2Reversed[i])

        // 阶段1: 输入A数据到达
        this.activeLines.add(`input-a-${i}`)
        this.adders[i].a = bit1
        this.adders[i].dataFlow = 'input'
        await this.delay(300)
        this.$forceUpdate()

        // 阶段2: 输入B数据到达
        this.activeLines.add(`input-b-${i}`)
        this.adders[i].b = bit2
        await this.delay(300)
        this.$forceUpdate()

        // 阶段3: 进位输入（如果不是最低位）
        if (i > 0) {
          this.activeCarries.add(`carry-in-${i}`)
          await this.delay(200)
          this.adders[i].cin = carry
          this.adders[i].dataFlow = 'carry-in'
          await this.delay(300)
          this.$forceUpdate()
        } else {
          this.adders[i].cin = 0
        }

        // 阶段4: 全加器处理
        this.adders[i].dataFlow = 'processing'
        await this.delay(400)

        // 阶段5: 计算输出
        const { s, cout } = this.fullAdder(bit1, bit2, carry)
        this.adders[i].s = s
        this.adders[i].cout = cout
        this.adders[i].dataFlow = 'output'
        this.activeLines.add(`output-s-${i}`)
        await this.delay(300)
        this.$forceUpdate()

        // 阶段6: 进位输出传递到下一个全加器
        if (i < bits - 1) {
          this.activeCarries.add(`carry-out-${i}`)
          this.adders[i].dataFlow = 'carry-out'
          await this.delay(300)
          this.$forceUpdate()
          // 清除当前进位输出状态
          this.activeCarries.delete(`carry-out-${i}`)
        }

        // 清除输入线路状态
        this.activeLines.delete(`input-a-${i}`)
        this.activeLines.delete(`input-b-${i}`)
        if (i > 0) {
          this.activeCarries.delete(`carry-in-${i}`)
        }

        resultBinary = s + resultBinary
        carry = cout

        // 重置当前全加器状态为完成
        this.adders[i].dataFlow = 'completed'
      }

      // 清除所有输出线路状态
      for (let i = 0; i < bits; i++) {
        this.activeLines.delete(`output-s-${i}`)
      }

      // 计算最终结果
      this.finalResult = this.binaryToDecimal(resultBinary)

      // 检查溢出
      const maxValue = Math.pow(2, bits - 1) - 1
      const minValue = -Math.pow(2, bits - 1)

      if (this.finalResult > maxValue || this.finalResult < minValue) {
        this.$message.warning(`结果溢出！10位补码范围：${minValue} 到 ${maxValue}`)
        this.result = `${this.finalResult} (溢出)`
      } else {
        this.result = this.finalResult.toString()
      }

      this.binaryResult = resultBinary
      this.calculating = false
      this.$forceUpdate()
    },

    // 延迟函数
    delay (ms) {
      return new Promise(resolve => {
        this.animationTimer = setTimeout(resolve, ms)
      })
    }
  },
  beforeUnmount () {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
    }
  }
}
</script>

<style lang="scss" scoped>
.cpu-simulator-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;

  .card-header {
    font-size: 18px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .intro-btn {
      font-size: 14px;
      color: #409eff;
      padding: 0;

      &:hover {
        color: #66b1ff;
      }
    }
  }

  .input-section {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .input-field {
      flex: 1;
      min-width: 150px;
      max-width: 200px;

      &.result-field {
        background-color: #f5f7fa;
      }
    }

    .operator-select {
      width: 100px;
    }

    .equals-sign {
      font-size: 24px;
      font-weight: bold;
      color: #409eff;
    }

    .calculate-btn {
      min-width: 120px;
    }
  }

  .intro-dialog {
    .intro-content {
      line-height: 1.8;
      color: #606266;
      max-height: 60vh;
      overflow-y: auto;
      padding-right: 10px;

      h3 {
        color: #409eff;
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;

        &:first-child {
          margin-top: 0;
        }
      }

      p {
        margin-bottom: 15px;
        text-align: justify;
      }

      ul, ol {
        margin-bottom: 15px;
        padding-left: 25px;

        li {
          margin-bottom: 8px;

          strong {
            color: #303133;
            font-weight: 600;
          }
        }
      }

      ol {
        li {
          margin-bottom: 10px;
        }
      }
    }

    .dialog-footer {
      text-align: right;
    }
  }

  .binary-section {
    margin: 20px 0;

    .binary-display {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .binary-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .binary-label {
          font-weight: 500;
          min-width: 150px;
        }

        .binary-value {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          color: #409eff;
          font-weight: bold;
          letter-spacing: 2px;
        }
      }
    }
  }

  .circuit-section {
    margin: 30px 0;
    overflow-x: auto;

    .circuit-container {
      min-width: 1400px;
      padding: 30px;
      background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      border: 2px solid #e4e7ed;

      // 总线样式
      .bus-row {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding: 10px;
        background-color: #fafafa;
        border-radius: 4px;

        .bus-label {
          width: 80px;
          font-weight: bold;
          color: #606266;
          text-align: right;
          padding-right: 15px;
        }

        .bus-lines {
          display: flex;
          gap: 8px;
          flex: 1;

          .bus-line {
            flex: 1;
            height: 30px;
            background-color: #e4e7ed;
            border: 2px solid #dcdfe6;
            border-radius: 4px;
            position: relative;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;

            &.line-active {
              background-color: #409eff;
              border-color: #409eff;
              box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
              animation: pulse-line 0.8s infinite;
            }

            .line-value {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              font-weight: bold;
              color: #606266;
              opacity: 0;
              transition: opacity 0.3s;

              &.value-visible {
                opacity: 1;
                color: white;
              }
            }
          }
        }

        &.input-bus-a .bus-line.line-active {
          background-color: #409eff;
        }

        &.input-bus-b .bus-line.line-active {
          background-color: #67c23a;
        }

        &.output-bus .bus-line.line-active {
          background-color: #e6a23c;
        }
      }

      // 全加器电路
      .adders-circuit {
        display: flex;
        gap: 20px;
        margin: 40px 0;
        position: relative;

        .adder-circuit-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 120px;

          // 进位线
          .carry-wire {
            width: 100%;
            position: relative;
            margin: 10px 0;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;

            .wire-line {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 100%;
              background-color: #dcdfe6;
              border-radius: 2px;
              transition: all 0.3s;

              &.line-active {
                background-color: #67c23a;
                box-shadow: 0 0 10px rgba(103, 194, 58, 0.8);
                animation: pulse-wire-line 0.8s infinite;
              }
            }

            .carry-label {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              font-size: 11px;
              color: #909399;
              font-weight: 500;
              z-index: 5;
            }

            .carry-in-label {
              top: -18px;
            }

            .carry-out-label {
              bottom: -18px;
            }

            .carry-value {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              width: 32px;
              height: 32px;
              background-color: #67c23a;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: bold;
              opacity: 0;
              transition: all 0.3s;
              z-index: 10;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

              &.value-visible {
                opacity: 1;
              }

              &.value-active {
                animation: pulse-value 0.8s infinite;
                box-shadow: 0 0 15px rgba(103, 194, 58, 0.8);
              }
            }

            &.carry-in-wire {
              margin-bottom: 5px;

              .carry-value {
                top: 15px;
              }
            }

            &.carry-out-wire {
              margin-top: 5px;

              .carry-value {
                bottom: 15px;
              }
            }
          }

          // 全加器芯片
          .adder-chip {
            width: 100%;
            min-height: 200px;
            padding: 15px;
            background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
            border: 4px solid #dcdfe6;
            border-radius: 12px;
            position: relative;
            transition: all 0.4s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

            &.chip-active {
              border-color: #409eff;
              background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
              box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
              animation: chip-pulse 1s infinite;
            }

            .chip-label {
              text-align: center;
              font-weight: bold;
              color: #909399;
              font-size: 14px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e4e7ed;
            }

            // 端口
            .chip-ports {
              display: flex;
              flex-direction: column;
              gap: 12px;

              &.chip-inputs {
                margin-bottom: 20px;
              }

              &.chip-outputs {
                margin-top: 20px;
              }

              .port {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                background-color: #fff;
                border: 3px solid #e4e7ed;
                border-radius: 6px;
                transition: all 0.3s;
                position: relative;

                &.port-active {
                  border-color: #409eff;
                  background-color: #ecf5ff;
                  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
                }

                .port-label {
                  font-size: 12px;
                  color: #909399;
                  font-weight: 500;
                }

                .port-value {
                  font-family: 'Courier New', monospace;
                  font-size: 18px;
                  font-weight: bold;
                  color: #409eff;
                  min-width: 20px;
                  text-align: center;
                }

                .port-wire {
                  position: absolute;
                  width: 4px;
                  height: 20px;
                  background-color: #e4e7ed;
                  transition: all 0.3s;

                  &.wire-active {
                    background-color: #409eff;
                    box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
                  }
                }

                &.port-a .port-wire {
                  left: -8px;
                  top: 50%;
                  transform: translateY(-50%);
                }

                &.port-b .port-wire {
                  left: -8px;
                  top: 50%;
                  transform: translateY(-50%);
                }

                &.port-cin .port-wire {
                  left: -8px;
                  top: 50%;
                  transform: translateY(-50%);
                }

                &.port-s .port-wire {
                  right: -8px;
                  top: 50%;
                  transform: translateY(-50%);
                }

                &.port-cout .port-wire {
                  right: -8px;
                  top: 50%;
                  transform: translateY(-50%);
                }

                &.port-cin {
                  background-color: #f0fdf4;
                  border-color: #b3e19d;

                  &.port-active {
                    border-color: #67c23a;
                    background-color: #f0f9ff;
                  }
                }

                &.port-s {
                  background-color: #fef0f0;
                  border-color: #fbc4c4;

                  &.port-active {
                    border-color: #e6a23c;
                    background-color: #fdf6ec;
                  }

                  .port-value {
                    color: #e6a23c;
                  }
                }

                &.port-cout {
                  background-color: #f0fdf4;
                  border-color: #b3e19d;

                  &.port-active {
                    border-color: #67c23a;
                    background-color: #f0f9ff;
                  }

                  .port-value {
                    color: #67c23a;
                  }
                }
              }
            }

            .chip-process {
              text-align: center;
              margin: 15px 0;

              .process-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                color: #409eff;
                font-size: 12px;

                i {
                  font-size: 20px;
                }
              }
            }
          }
        }
      }
    }
  }

  .result-section {
    margin: 20px 0;

    .result-display {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
      color: white;

      .result-item {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0;
        }

        .result-label {
          font-weight: 500;
          font-size: 16px;
        }

        .result-value {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: bold;

          &.highlight {
            font-size: 24px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }
  }
}

@keyframes pulse-line {
  0%, 100% {
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(64, 158, 255, 0.8);
  }
}

@keyframes pulse-wire-line {
  0%, 100% {
    box-shadow: 0 0 10px rgba(103, 194, 58, 0.8);
    transform: translateX(-50%) scaleX(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(103, 194, 58, 1);
    transform: translateX(-50%) scaleX(1.2);
  }
}

@keyframes pulse-value {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 10px rgba(103, 194, 58, 0.6);
  }
  50% {
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 0 20px rgba(103, 194, 58, 1);
  }
}

@keyframes move-pulse {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes chip-pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  }
  50% {
    box-shadow: 0 6px 24px rgba(64, 158, 255, 0.5);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .cpu-simulator-container {
    .input-section {
      flex-direction: column;
      align-items: stretch;

      .input-field,
      .operator-select {
        max-width: 100%;
      }
    }

    .circuit-section {
      .circuit-container {
        min-width: auto;
      }
    }
  }
}
</style>
