/**
 * URL 和路径标准化工具函数
 * 用于统一处理 URL 和文件路径的标准化逻辑
 */

/**
 * 标准化 URL 路径（用于匹配和存储）
 * 移除协议、域名、/api 前缀、查询参数，并确保格式一致
 *
 * @param {string} url - 原始 URL 或路径
 * @param {object} options - 配置选项
 * @param {boolean} options.ensureLeadingSlash - 是否确保以 / 开头（默认：false）
 * @returns {string} 标准化后的路径
 *
 * @example
 * normalizeUrl('http://example.com/api/uploads/image.jpg?size=100')
 * // => '/uploads/image.jpg'
 *
 * normalizeUrl('/api/uploads/image.jpg', { ensureLeadingSlash: true })
 * // => '/uploads/image.jpg'
 */
function normalizeUrl(url, options = {}) {
  if (!url) return ''

  const { ensureLeadingSlash = false } = options
  let normalized = url.trim()

  // 移除协议和域名
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const urlObj = new URL(normalized)
      normalized = urlObj.pathname
    } catch {
      normalized = normalized.replace(/^https?:\/\/[^/]+/, '')
    }
  }

  // 移除 /api 前缀
  if (normalized.startsWith('/api')) {
    normalized = normalized.substring(4)
  }

  // 移除查询参数
  const queryIndex = normalized.indexOf('?')
  if (queryIndex !== -1) {
    normalized = normalized.substring(0, queryIndex)
  }

  // 确保以 / 开头（如果需要）
  if (ensureLeadingSlash && !normalized.startsWith('/')) {
    normalized = '/' + normalized
  }

  return normalized
}

/**
 * 标准化 URL 用于存储（确保以 / 开头）
 * 这是 normalizeUrl 的便捷方法，专门用于媒体库存储
 *
 * @param {string} url - 原始 URL 或路径
 * @returns {string} 标准化后的路径（以 / 开头）
 */
function normalizeUrlForStorage(url) {
  return normalizeUrl(url, { ensureLeadingSlash: true })
}

/**
 * 清理文件路径（移除 /api 前缀和查询参数）
 * 用于文件操作前的路径清理
 *
 * @param {string} filePath - 文件路径
 * @returns {string} 清理后的路径
 */
function cleanFilePath(filePath) {
  if (!filePath) return ''

  let cleanPath = filePath.trim()

  // 移除 /api 前缀
  if (cleanPath.startsWith('/api')) {
    cleanPath = cleanPath.substring(4)
  }

  // 移除查询参数
  const queryIndex = cleanPath.indexOf('?')
  if (queryIndex !== -1) {
    cleanPath = cleanPath.substring(0, queryIndex)
  }

  return cleanPath
}

/**
 * 标准化文件路径（用于匹配）
 * 移除 /api 前缀和查询参数，确保格式一致
 *
 * @param {string} filePath - 文件路径
 * @param {object} options - 配置选项
 * @param {boolean} options.ensureLeadingSlash - 是否确保以 / 开头（默认：false）
 * @returns {string} 标准化后的路径
 */
function normalizeFilePath(filePath, options = {}) {
  return normalizeUrl(filePath, options)
}

module.exports = {
  normalizeUrl,
  normalizeUrlForStorage,
  cleanFilePath,
  normalizeFilePath
}
