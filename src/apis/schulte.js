import api from './base'

const schulteApi = {
  // 获取舒尔特表格题目
  getTopic () {
    return api.get('/topic/schulte')
  },
  // 提交舒尔特表格答案
  submitAnswer (data) {
    return api.patch('/topic/schulte/submit', data)
  },
  // 获取舒尔特表格历史答案/排名数据
  getAnswers () {
    return api.get('/schulte-answers')
  }
}

export default schulteApi
