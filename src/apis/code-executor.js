import http from './base'

/**
 * 执行代码
 * @param {string} endpoint - The execution endpoint (e.g., 'php', 'python').
 * @param {string} code - The code to execute.
 * @param {string|number} version - The version of the language to use.
 * @returns {Promise}
 */
export function executeCode (endpoint, code, version) {
  return http.post(`/api/exec/${endpoint}`, {
    code,
    version
  })
}

/**
 * 获取执行结果
 * @param {string} recordId - The ID of the execution record.
 * @returns {Promise}
 */
export function getExecuteResult (recordId) {
  return http.post('/api/exec/get_result', {
    record_id: recordId
  })
}
