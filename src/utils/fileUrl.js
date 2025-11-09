/**
 * 文件 URL 工具函数
 * 用于生成完整的文件访问 URL
 */

// 确保 dotenv 已加载（如果还没有加载）
// 这确保在模块被 require 时，环境变量已经可用
if (typeof require !== 'undefined') {
  try {
    // 尝试加载 dotenv（如果还没有加载）
    const dotenv = require('dotenv')
    const path = require('path')
    // 只在当前目录查找 .env 文件
    dotenv.config({ path: path.join(__dirname, '../../.env') })
  } catch (e) {
    // dotenv 可能已经加载或不存在，忽略错误
    // console.warn('无法加载 dotenv:', e.message)
  }
}

/**
 * 获取文件完整 URL
 * @param {string} filePath - 文件路径（如：/uploads/filename.jpg）
 * @param {object} req - Express 请求对象（可选，用于自动获取协议和主机）
 * @returns {string} 完整的文件 URL
 */
function getFileUrl(filePath, req = null) {
  if (!filePath) {
    return ''
  }

  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  // 如果提供了 req 对象，优先使用请求的协议和主机（自动匹配 HTTP/HTTPS）
  if (req) {
    // 从请求头中获取协议（支持代理场景）
    const protocol =
      req.protocol ||
      (req.secure ? 'https' : 'http') ||
      (req.get && req.get('X-Forwarded-Proto')) ||
      'https'
    // 从请求头中获取主机（支持代理场景）
    const host = (req.get && req.get('host')) || req.headers.host || 'www.wdmlzffonline.top'

    const cleanFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`
    return `${protocol}://${host}${cleanFilePath}`
  }

  // 如果没有 req 对象，使用环境变量配置
  // 获取配置的域名（从环境变量，运行时读取）
  // 默认使用 https://www.wdmlzffonline.top
  let baseUrl = process.env.FILE_BASE_URL

  // 如果环境变量不存在，尝试再次加载 dotenv
  if (!baseUrl) {
    try {
      const dotenv = require('dotenv')
      const path = require('path')
      dotenv.config({ path: path.join(__dirname, '../../.env') })
      baseUrl = process.env.FILE_BASE_URL
    } catch (e) {
      // 忽略错误
    }
  }

  // 如果还是没有，使用默认值
  baseUrl = baseUrl || 'https://www.wdmlzffonline.top'

  // 确保 baseUrl 不以 / 结尾，filePath 以 / 开头
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  const cleanFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`

  return `${cleanBaseUrl}${cleanFilePath}`
}

/**
 * 批量处理文件对象，添加完整 URL
 * @param {Object|Array} fileData - 文件对象或文件对象数组
 * @param {object} req - Express 请求对象（可选，用于自动获取协议和主机）
 * @returns {Object|Array} 添加了 url 字段的文件对象或数组
 */
function addFileUrl(fileData, req = null) {
  if (Array.isArray(fileData)) {
    return fileData.map((file) => {
      // 优先使用 path，如果没有则根据 filename 生成 path
      const filePath = file.path || (file.filename ? `/uploads/${file.filename}` : '')
      return {
        ...file,
        url: getFileUrl(filePath, req)
      }
    })
  }

  if (fileData && typeof fileData === 'object') {
    // 优先使用 path，如果没有则根据 filename 生成 path
    const filePath = fileData.path || (fileData.filename ? `/uploads/${fileData.filename}` : '')
    return {
      ...fileData,
      url: getFileUrl(filePath, req)
    }
  }

  return fileData
}

module.exports = {
  getFileUrl,
  addFileUrl
}
