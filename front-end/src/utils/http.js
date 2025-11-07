/**
 * HTTP/HTTPS 协议处理工具
 * 用于处理混合协议请求
 */

/**
 * 获取当前页面的协议
 * @returns {string} 'http:' 或 'https:'
 */
export function getCurrentProtocol() {
  return window.location.protocol
}

/**
 * 检查 URL 是否包含协议
 * @param {string} url - URL 地址
 * @returns {boolean}
 */
export function hasProtocol(url) {
  return /^https?:\/\//i.test(url)
}

/**
 * 获取协议无关的 URL（移除协议）
 * @param {string} url - URL 地址
 * @returns {string}
 */
export function getProtocolFreeUrl(url) {
  return url.replace(/^https?:\/\//i, '')
}

/**
 * 根据当前页面协议自动选择请求协议
 * 如果 URL 已经包含协议，直接返回
 * 如果不包含协议，根据当前页面协议自动添加
 * @param {string} url - URL 地址
 * @returns {string} 带协议的完整 URL
 */
export function autoProtocolUrl(url) {
  if (hasProtocol(url)) {
    return url
  }

  const protocol = getCurrentProtocol()
  const protocolFreeUrl = url.startsWith('//') ? url : `//${getProtocolFreeUrl(url)}`

  return `${protocol}${protocolFreeUrl}`
}

/**
 * 切换 URL 的协议
 * @param {string} url - URL 地址
 * @param {string} targetProtocol - 目标协议 ('http' 或 'https')
 * @returns {string} 切换协议后的 URL
 */
export function switchProtocol(url, targetProtocol = 'http') {
  if (!hasProtocol(url)) {
    return url
  }

  const protocol = targetProtocol.replace(/:$/, '') // 移除可能存在的冒号
  return url.replace(/^https?:\/\//i, `${protocol}://`)
}

/**
 * 尝试 HTTP，如果失败则尝试 HTTPS（或反之）
 * @param {string} url - URL 地址（不带协议或带协议）
 * @param {Function} requestFn - 请求函数
 * @param {object} options - 请求选项
 * @returns {Promise}
 */
export async function tryBothProtocols(url, requestFn, options = {}) {
  const protocols = ['http', 'https']
  const originalUrl = hasProtocol(url) ? url : autoProtocolUrl(url)

  for (const protocol of protocols) {
    try {
      const testUrl = switchProtocol(originalUrl, protocol)
      return await requestFn(testUrl, options)
    } catch (error) {
      // 如果所有协议都失败，抛出最后一个错误
      if (protocol === protocols[protocols.length - 1]) {
        throw error
      }
      // 继续尝试下一个协议
      console.warn(`尝试 ${protocol} 失败，切换到下一个协议`)
    }
  }
}
