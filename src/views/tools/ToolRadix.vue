<template>
  <div class="radix-converter-container">
    <el-card class="box-card info-card">
      <template v-slot:header>
        <div class="clearfix">
          <i class="el-icon-info"></i>
          <span>进制介绍</span>
        </div>
      </template>
      <p>在数学中，进制是一种记数方式，亦称进位制或进位计数法。最常用的的是十进制，它使用10个数字（0-9）。在计算机科学中，二进制（0-1）、八进制（0-7）和十六进制（0-9,
        A-F）非常重要。</p>
    </el-card>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" class="card-col">
        <el-card class="box-card">
          <template v-slot:header>
            <div class="clearfix">
              <span>常用进制转换</span>
            </div>
          </template>
          <el-form ref="form" :model="radixData" label-width="100px">
            <el-form-item v-for="radix in commonRadixes" :key="radix.base" :label="radix.label">
              <el-input v-model="radixData['r' + radix.base]" @input="updateFrom(radix.base)"
                        :placeholder="radix.placeholder"></el-input>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" class="card-col">
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
              <el-input :value="customRadixResult" readonly placeholder="转换结果"></el-input>
            </el-form-item>
          </el-form>
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
    }
  }
}
</script>

<style scoped lang="scss">
.radix-converter-container {
  padding: 20px;
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

@media (max-width: 768px) {
  .card-col {
    margin-bottom: 20px;
  }
}
</style>
