/**
 * 文件 URL 工具函数
 * 用于生成完整的文件访问 URL
 */

/**
 * 获取文件完整 URL
 * @param {string} filePath - 文件路径（如：/uploads/filename.jpg）
 * @returns {string} 完整的文件 URL
 */
function getFileUrl(filePath) {
  if (!filePath) {
    return ''
  }

  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  // 获取配置的域名（从环境变量）
  // 默认使用 https://www.wdmlzffonline.top
  const baseUrl = process.env.FILE_BASE_URL || 'https://www.wdmlzffonline.top'

  // 确保 baseUrl 不以 / 结尾，filePath 以 / 开头
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  const cleanFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`

  return `${cleanBaseUrl}${cleanFilePath}`
}

/**
 * 批量处理文件对象，添加完整 URL
 * @param {Object|Array} fileData - 文件对象或文件对象数组
 * @returns {Object|Array} 添加了 url 字段的文件对象或数组
 */
function addFileUrl(fileData) {
  if (Array.isArray(fileData)) {
    return fileData.map((file) => {
      // 优先使用 path，如果没有则根据 filename 生成 path
      const filePath = file.path || (file.filename ? `/uploads/${file.filename}` : '')
      return {
        ...file,
        url: getFileUrl(filePath)
      }
    })
  }

  if (fileData && typeof fileData === 'object') {
    // 优先使用 path，如果没有则根据 filename 生成 path
    const filePath = fileData.path || (fileData.filename ? `/uploads/${fileData.filename}` : '')
    return {
      ...fileData,
      url: getFileUrl(filePath)
    }
  }

  return fileData
}

module.exports = {
  getFileUrl,
  addFileUrl
}
