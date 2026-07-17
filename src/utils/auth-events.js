export const USER_LOGIN_SUCCESS_EVENT = 'user:login-success'

export function dispatchUserLoginSuccess (detail) {
  window.dispatchEvent(new CustomEvent(USER_LOGIN_SUCCESS_EVENT, { detail }))
}

export const USER_LOGOUT_SUCCESS_EVENT = 'user:logout-success'

export function dispatchUserLogoutSuccess () {
  window.dispatchEvent(new CustomEvent(USER_LOGOUT_SUCCESS_EVENT, {}))
}

/**
 * 监听其他标签页的登录成功（localStorage token 写入）。
 * - storage 事件：其他标签页写入 token 时触发（同标签页自身写入不会触发）
 * - visibilitychange：切回当前标签页时再校验一次，避免漏掉后台期间的变化
 * @param {(payload: { token: string, source: 'storage' | 'visibility' }) => void} callback
 * @returns {() => void} 取消监听
 */
export function watchCrossTabLogin (callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {}
  }

  // 记录挂载时的 token，仅当其他标签页写入了新 token 时才通知
  const baselineToken = localStorage.getItem('token')
  let handled = false

  const notify = (token, source) => {
    if (handled || !token || token === baselineToken) return
    handled = true
    callback({ token, source })
  }

  const onStorage = (event) => {
    // storage 事件仅在「其他」标签页修改 localStorage 时触发
    if (event.key === 'token' && event.newValue) {
      notify(event.newValue, 'storage')
    }
  }

  const onVisibility = () => {
    // 切回当前标签时兜底检查，防止个别环境下 storage 事件丢失
    if (document.visibilityState !== 'visible') return
    const token = localStorage.getItem('token')
    if (token) {
      notify(token, 'visibility')
    }
  }

  window.addEventListener('storage', onStorage)
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    window.removeEventListener('storage', onStorage)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
