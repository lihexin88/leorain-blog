const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'

/**
 * 保存登录/注册成功后要回到的地址（含 query）
 */
export function savePostLoginRedirect (pathWithQuery) {
  if (!pathWithQuery || typeof pathWithQuery !== 'string') return
  // 避免死循环：登录页本身不作为回跳
  if (pathWithQuery === '/login' || pathWithQuery.startsWith('/login?')) return
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, pathWithQuery)
}

/**
 * 从当前路由对象保存完整路径
 */
export function savePostLoginRedirectFromRoute (route) {
  if (!route) return
  const fullPath = route.fullPath || `${route.path}${route.query ? '' : ''}`
  savePostLoginRedirect(fullPath)
}

/**
 * 读取并清除回跳地址
 */
export function consumePostLoginRedirect () {
  const path = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
  if (path) {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  }
  return path
}

/**
 * 仅读取，不清除
 */
export function peekPostLoginRedirect () {
  return sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
}

export function clearPostLoginRedirect () {
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
}
