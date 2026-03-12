import axios from 'axios'
import { useUserStore } from '@/store/user'

const api = axios.create({
  baseURL: '/api/frontend',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.url.startsWith('/api/')) {
      config.baseURL = ''
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    return response.data
  },
  error => {
    if (error.status === 401) {
      const userStore = useUserStore()
      userStore.setShowLoginDialog(true)
    }
    // 对响应错误做点什么
    return Promise.reject(error)
  }
)

export default api
