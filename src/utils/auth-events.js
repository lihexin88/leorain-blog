export const USER_LOGIN_SUCCESS_EVENT = 'user:login-success'

export function dispatchUserLoginSuccess (detail) {
  window.dispatchEvent(new CustomEvent(USER_LOGIN_SUCCESS_EVENT, { detail }))
}

export const USER_LOGOUT_SUCCESS_EVENT = 'user:logout-success'

export function dispatchUserLogoutSuccess () {
  window.dispatchEvent(new CustomEvent(USER_LOGOUT_SUCCESS_EVENT, {}))
}
