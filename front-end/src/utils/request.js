// 封装请求工具，支持 HTTP 和 HTTPS

const BASE_URL = import.meta.env.VITE_API_PREFIX || '/api'

/**
 * 获取 token（从 localStorage 或 store）
 * @returns {string|null} token
 */
function getToken() {
  // 优先从 localStorage 获取（避免循环依赖）
  return localStorage.getItem('token') || null
}

/**
 * 获取完整的请求 URL
 * 支持相对路径和绝对路径
 * 如果是绝对路径且包含协议，直接使用
 * 如果是相对路径，使用 BASE_URL
 * @param {string} url - 请求地址
 * @returns {string} 完整的请求 URL
 */
function getRequestUrl(url) {
  // 如果已经是完整的 URL（包含协议），直接返回
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  // 如果是绝对路径（以 / 开头），使用 BASE_URL
  if (url.startsWith('/')) {
    // 判断当前页面协议，自动匹配
    const protocol = window.location.protocol
    const baseUrl = BASE_URL.startsWith('http')
      ? BASE_URL
      : `${protocol}//${window.location.host}${BASE_URL}`
    return `${baseUrl}${url}`
  }

  // 相对路径
  return `${BASE_URL}${url}`
}

/**
 * 处理请求错误，自动尝试 HTTP/HTTPS 切换
 * @param {string} url - 原始 URL
 * @param {object} config - 请求配置
 * @param {number} retryCount - 重试次数
 * @returns {Promise}
 */
async function requestWithRetry(url, config, retryCount = 0) {
  try {
    const requestUrl = getRequestUrl(url)
    const response = await fetch(requestUrl, config)

    // 尝试解析响应（无论成功与否）
    let responseData
    try {
      responseData = await response.json()
    } catch {
      // 如果响应不是 JSON，使用空对象
      responseData = {}
    }

    // 处理 401 未授权（token 过期或无效）
    if (response.status === 401 || responseData.code === 401) {
      // 清除 token
      localStorage.removeItem('token')
      // 可以在这里触发登出逻辑或跳转到登录页
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        console.warn('Token 已过期，请重新登录')
        // 可选：自动跳转到登录页
        // window.location.href = '/login'
      }
      throw new Error(responseData.message || '登录已过期，请重新登录')
    }

    // 处理后端的业务错误码（即使HTTP状态码是200，但code不是成功状态）
    if (responseData.code && responseData.code !== 200 && responseData.code !== 201) {
      const errorMessage = responseData.message || `请求失败，错误码: ${responseData.code}`
      throw new Error(errorMessage)
    }

    // 处理其他HTTP错误状态码
    if (!response.ok) {
      const errorMessage =
        responseData.message || responseData.error || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    return responseData
  } catch (error) {
    // 如果是协议问题，尝试切换协议（最多重试一次）
    if (retryCount === 0 && /^https?:\/\//i.test(url) && error.name !== 'TypeError') {
      const alternateUrl = url.replace(/^https:/i, 'http:').replace(/^http:/i, 'https:')
      console.warn(`请求失败，尝试切换协议: ${url} -> ${alternateUrl}`)
      return requestWithRetry(alternateUrl, config, retryCount + 1)
    }

    console.error('Request failed:', error)
    throw error
  }
}

/**
 * 通用请求方法
 * @param {string} url - 请求地址（支持相对路径和绝对路径）
 * @param {object} options - 请求配置
 * @returns {Promise}
 */
export function request(url, options = {}) {
  const { method = 'GET', data, headers = {}, ...rest } = options

  // 自动添加 Authorization header
  const token = getToken()
  const authHeaders = {}
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers
    },
    ...rest
  }

  // 处理请求体
  if (data) {
    if (method === 'GET') {
      // GET 请求将参数拼接到 URL
      const params = new URLSearchParams(data).toString()
      url = `${url}?${params}`
    } else {
      // POST/PUT/DELETE 请求将参数放在 body
      config.body = JSON.stringify(data)
    }
  }

  return requestWithRetry(url, config)
}

/**
 * GET 请求
 */
export function get(url, params, options = {}) {
  return request(url, {
    method: 'GET',
    data: params,
    ...options
  })
}

/**
 * POST 请求
 */
export function post(url, data, options = {}) {
  return request(url, {
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
export function put(url, data, options = {}) {
  return request(url, {
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
export function del(url, options = {}) {
  return request(url, {
    method: 'DELETE',
    ...options
  })
}
