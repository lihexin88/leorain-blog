import authApi from '@/apis/auth'

function getApiHost () {
  return (import.meta.env.VITE_API_HOST || '').replace(/\/$/, '')
}

/**
 * 向前端 API 兑换一次性 code，并拼出 api 域名上的 session 桥接 URL。
 * @param {string} redirect 相对路径，如 /dashboard
 * @returns {Promise<string|null>}
 */
export async function buildBackendSessionUrl (redirect = '/dashboard') {
  const apiHost = getApiHost()
  const token = localStorage.getItem('token')
  if (!apiHost || !token) {
    return null
  }

  const response = await authApi.createSessionCode()
  const code = response?.code || response?.data?.code
  if (!code) {
    return null
  }

  const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard'

  const params = new URLSearchParams({
    code,
    redirect: safeRedirect
  })

  return `${apiHost}/auth/token-login?${params.toString()}`
}

/**
 * 通过隐藏 iframe 在 api 域名静默建立 web session。
 * 登录成功后调用，之后直接打开 /dashboard 即可带上 session cookie。
 */
export async function syncBackendSession () {
  try {
    const url = await buildBackendSessionUrl('/auth/token-login/ok')
    if (!url || typeof document === 'undefined') {
      return false
    }

    return await new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'display:none;width:0;height:0;border:0;'
      iframe.setAttribute('aria-hidden', 'true')

      let settled = false
      const finish = (ok) => {
        if (settled) return
        settled = true
        iframe.remove()
        resolve(ok)
      }

      iframe.onload = () => finish(true)
      iframe.onerror = () => finish(false)
      setTimeout(() => finish(true), 5000)

      iframe.src = url
      document.body.appendChild(iframe)
    })
  } catch (error) {
    console.error('Sync backend session failed:', error)
    return false
  }
}

/**
 * 打开后台页面：先兑换 code 再跳转，确保带上 web session。
 * @param {string} path 如 /dashboard 或 /dashboard/articles/1/edit
 */
export async function openBackendUrl (path = '/dashboard') {
  const apiHost = getApiHost()
  const fallback = `${apiHost}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const url = await buildBackendSessionUrl(path)
    window.open(url || fallback, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Open backend url failed:', error)
    window.open(fallback, '_blank', 'noopener,noreferrer')
  }
}

export function getBackendUrl (path = '/dashboard') {
  const apiHost = getApiHost()
  return `${apiHost}${path.startsWith('/') ? path : `/${path}`}`
}
