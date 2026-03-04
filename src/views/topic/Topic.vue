<template>
  <div class="topic-container">
    <div style="padding-bottom: 10px">
      <div class="topic-title" style="display: flex;justify-content: center">
        {{ topicObject.title }}
      </div>
      <div style="font-size: .9em">
        <i>{{ topicObject.description }}</i>
      </div>
    </div>
    <div v-for="(question, index) in questionsObject" :key="index" :id="`question_id_${question.id}`">
      {{ index + 1 }}: {{ question.question }}
      <br>
      <div class="question-input-container">
        <div class="question-input" v-for="(option, optIndex) in question.parsedOptions" :key="optIndex">
          <input
              required
              v-if="question.answer_num > 1"
              type="checkbox"
              :name="question.id"
              :id="`question_id_${question.id}_${optIndex}`"
              :value="option.value"
              class="custom-checkbox"
              v-model="question.selectedOptions"
          >
          <input
              v-else
              required
              type="radio"
              :name="question.id"
              :id="`question_id_${question.id}_${optIndex}`"
              :value="option.value"
              class="custom-radio"
              v-model="question.selectedOption"
          >
          <label :for="`question_id_${question.id}_${optIndex}`" class="custom-label">
            {{ option.desc }}
          </label>
          <br>
        </div>
      </div>
      <hr/>
    </div>
    <div class="topic-submit">
      <button class="btn btn-success topic-submit-button" type="button" @click="submitForm">提交</button>
    </div>
    <el-dialog
        v-model="showMbtiResult"
        title="测试结果"
        width="500px"
    >
      <div>
        <div style="display: flex;justify-content: center;align-items: center">
          <div>你的MBTI人格为</div>
          <div style="font-size: large;padding-left: 3px">{{ mbtiString }}</div>
        </div>
        <div>
          <div>
            <div>
              <div v-for="(result,index) in mbtiResult" :key="index">
                {{ result.primary }}:
                <el-progress :show-text="true" :text-inside="true" :stroke-width="20"
                             :percentage="result.progress"></el-progress>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="closeResult">我知道了</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { nextTick } from 'vue'
import Swal from 'sweetalert2'
import { topicApi } from '@/apis'
import { useUserStore } from '@/store/user'

export default {
  name: 'TopicDetail',
  components: {},
  props: {
    questions: {
      type: String,
      default: ''
    },
    topic: {
      type: String,
      default: ''
    },
    dialogVisible: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      questionsObject: [],
      topicObject: {},
      showMbtiResult: false,
      mbtiString: null,
      mbtiResult: [],
      unauthorized: false
    }
  },
  mounted () {
    if (this.questions) {
      this.questionsObject = JSON.parse(this.questions).map(question => ({
        ...question,
        parsedOptions: JSON.parse(question.options),
        selectedOptions: [],
        selectedOption: ''
      }))
    }
    if (this.topic) {
      this.topicObject = JSON.parse(this.topic)
    }
    // 使用 Pinia 的 user store 判断是否登录，不再调用接口
    const userStore = useUserStore()
    this.unauthorized = !(userStore && userStore.user)
    if (this.unauthorized) {
      userStore.setShowLoginDialog(true)
    }

    // 若通过路由进入（无 props 提供），在挂载时根据 slug 获取话题详情
    const slug = this.$route && this.$route.params ? this.$route.params.slug : null
    if (slug && (!this.topic || !this.questions)) {
      topicApi.getTopicDetail(slug)
        .then((res) => {
          const data = res && res.data ? res.data : res
          // 兼容返回结构：可能为 { data: {...} } 或直接为对象
          const topicData = data && data.data ? data.data : data
          // 题目列表字段可能为 questions 或 topicData.questions
          const questions = topicData && topicData.questions ? topicData.questions : (data && data.questions ? data.questions : [])

          if (topicData) {
            // 避免把 questions 放入 topicObject，单独存放
            const restTopic = { ...topicData }
            if (Object.prototype.hasOwnProperty.call(restTopic, 'questions')) {
              delete restTopic.questions
            }
            this.topicObject = restTopic
          }
          if (questions && Array.isArray(questions)) {
            this.questionsObject = questions.map(q => ({
              ...q,
              parsedOptions: typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []),
              selectedOptions: [],
              selectedOption: ''
            }))
          }
        })
        .catch((error) => {
          console.error('加载话题详情失败:', error)
        })
    }
  },
  methods: {
    closeResult () {
      this.showMbtiResult = false
    },
    async submitForm () {
      let isFormValid = true

      for (let i = 0; i < this.questionsObject.length; i++) {
        const question = this.questionsObject[i]
        const answer = question.answer_num > 1 ? question.selectedOptions : question.selectedOption
        const isAnswerValid = question.answer_num > 1 ? answer.length > 0 : !!answer

        if (question.answer_num > 0 && !isAnswerValid) {
          isFormValid = false

          await nextTick()
          const questionSelectorId = `#question_id_${question.id}`
          const questionElement = document.querySelector(questionSelectorId)
          if (questionElement) {
            questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => {
              questionElement.classList.add('flash-border-box')
            }, 1000)
            questionElement.classList.remove('flash-border-box')
          }

          Swal.fire({
            title: '未回答的问题',
            text: `请回答问题 ${i + 1}: ${question.question}`,
            icon: 'warning',
            confirmButtonText: '确定'
          })

          break
        }
      }

      if (!isFormValid) return

      const formData = this.questionsObject.map(question => ({
        question_id: question.id,
        answer: question.answer_num > 1 ? question.selectedOptions : question.selectedOption
      }))

      try {
        const response = await topicApi.submitTopicAnswers(this.topicObject.slug, formData)
        const mbtiSum = response.data.mbti_sum
        const mbti = mbtiSum.toString(2).padStart(4, '0')
        let resultString = ''
        const section = response.data.score_sum.section
        this.mbtiResult = []

        if (parseInt(mbti[3]) === 1) {
          resultString += 'I'
          this.mbtiResult.push({
            primary: 'I',
            progress: (section[1] / 7) * 100
          })
        } else {
          resultString += 'E'
          this.mbtiResult.push({
            primary: 'E',
            progress: (1 - section[1] / 7) * 100
          })
        }
        if (parseInt(mbti[2]) === 1) {
          resultString += 'N'
          this.mbtiResult.push({
            primary: 'N',
            progress: (section[2] / 7) * 100
          })
        } else {
          resultString += 'S'
          this.mbtiResult.push({
            primary: 'S',
            progress: (1 - section[2] / 7) * 100
          })
        }
        if (parseInt(mbti[1]) === 1) {
          resultString += 'F'
          this.mbtiResult.push({
            primary: 'F',
            progress: (section[3] / 7) * 100
          })
        } else {
          resultString += 'T'
          this.mbtiResult.push({
            primary: 'T',
            progress: (1 - section[3] / 7) * 100
          })
        }
        if (parseInt(mbti[0]) === 1) {
          resultString += 'P'
          this.mbtiResult.push({
            primary: 'P',
            progress: (section[4] / 7) * 100
          })
        } else {
          resultString += 'J'
          this.mbtiResult.push({
            primary: 'J',
            progress: (1 - section[4] / 7) * 100
          })
        }

        this.showMbtiResult = true
        this.mbtiString = resultString
      } catch (err) {
        console.error(err)
        if (err.response) {
          switch (err.response.status) {
            case 401:
              this.unauthorized = true
              break
            case 422:
              Swal.fire({
                title: '填写信息有误',
                text: err.response.data.message,
                icon: 'error',
                confirmButtonText: '确定'
              })
              break
            default:
              Swal.fire({
                title: '发生错误',
                text: '请检查选项',
                icon: 'error',
                confirmButtonText: '确定'
              })
              break
          }
        } else {
          Swal.fire({
            title: '发生错误',
            text: '网络请求失败',
            icon: 'error',
            confirmButtonText: '确定'
          })
        }
      }
    }
  }
}
</script>

<style>
/* 样式保持不变 */
.custom-checkbox, .custom-radio {
  display: none;
}

.topic-container {
  background-color: white;
  padding: 10px;
  border-radius: 2px;
  margin-bottom: 30px;
}

.custom-label {
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 16px;
  line-height: 30px;
  color: #333;
  width: 100%;
  transition: box-shadow .1s ease-in-out;
}

.custom-label:hover {
  box-shadow: 0 0 8px 4px rgba(99, 149, 218, 0.5);
  border-radius: 4px;
}

.custom-label::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #007BFF;
  background-color: #fff;
  transition: background-color 0.2s;
}

.question-input-container {
  margin-left: 20px;
  margin-top: 10px;
}

.custom-checkbox:checked + .custom-label::before,
.custom-radio:checked + .custom-label::before {
  background-color: #007BFF;
}

.custom-checkbox:checked + .custom-label::after,
.custom-radio:checked + .custom-label::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 0;
  color: white;
  font-size: 14px;
}

.topic-submit-button {
  width: 50%;
  z-index: 10;
}

@media screen and (max-aspect-ratio: 1/1) {
  .topic-submit-button {
    width: 100%;
  }
}

.topic-title {
  margin-bottom: 20px;
}

.topic-submit {
  position: fixed;
  width: 20%;
  bottom: 12%;
  right: 40%;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes flash-border-box {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
  }
}

.flash-border-box {
  animation: flash-border-box 1s ease-in-out 0.5s 3;
  border: 2px solid transparent;
  border-radius: 4px;
}
</style>

<style>
/* 样式适用于复选框和单选框 */
.custom-checkbox, .custom-radio {
  display: none;
}

.topic-container {
  background-color: white;
  padding: 10px;
  border-radius: 2px;
  margin-bottom: 30px;
}

/* 定义复选框和单选框的标签样式 */
.custom-label {
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 16px;
  line-height: 30px;
  color: #333;
  width: 100%;
  transition: box-shadow .1s ease-in-out;
}

.custom-label:hover {
  box-shadow: 0 0 8px 4px rgba(99, 149, 218, 0.5); /* 发光边框效果 */
  border-radius: 4px; /* 圆角边框 */
}

/* 圆形复选框或单选框 */
.custom-label::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #007BFF;
  background-color: #fff;
  transition: background-color 0.2s;
}

.question-input-container {
  margin-left: 20px;
  margin-top: 10px;
}

.question-input {
}

/* 选中时的样式 */
.custom-checkbox:checked + .custom-label::before,
.custom-radio:checked + .custom-label::before {
  background-color: #007BFF;
}

.custom-checkbox:checked + .custom-label::after,
.custom-radio:checked + .custom-label::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 0;
  color: white;
  font-size: 14px;
}

/* 提交按钮样式 */
.topic-submit-button {
  width: 50%;
  z-index: 10;
}

@media screen and (max-aspect-ratio: 1/1) {
  .topic-submit-button {
    width: 100%;
  }
}

.topic-title {
  margin-bottom: 20px;
}

.topic-submit {
  position: fixed;
  width: 20%;
  bottom: 12%;
  right: 40%;
  display: flex;
  justify-content: center;
  align-items: center;

}

/* 闪烁边框动画 */
@keyframes flash-border-box {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
  }
}

.flash-border-box {
  animation: flash-border-box 1s ease-in-out 0.5s 3; /* 1秒动画, 延迟0.5秒, 重复3次 */
  border: 2px solid transparent;
  border-radius: 4px;
}
</style>
