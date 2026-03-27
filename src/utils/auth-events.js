export const USER_LOGIN_SUCCESS_EVENT = 'user:login-success'

export function dispatchUserLoginSuccess (detail) {
  window.dispatchEvent(new CustomEvent(USER_LOGIN_SUCCESS_EVENT, { detail }))
}
