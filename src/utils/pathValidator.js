/**
 * 路径验证和安全工具函数
 * 用于验证文件路径的安全性，防止路径遍历攻击
 */

const path = require('path')
const fs = require('fs')

/**
 * 验证文件路径是否安全（防止路径遍历攻击）
 *
 * @param {string} filePath - 要验证的文件路径
 * @param {object} options - 配置选项
 * @param {boolean} options.requireUploadsPrefix - 是否要求路径以 /uploads/ 开头（默认：true）
 * @param {boolean} options.requireCategory - 是否要求路径包含分类目录（默认：false）
 * @param {array} options.allowedCategories - 允许的分类目录列表（默认：['images', 'videos', 'documents', 'archives', 'texts', 'others']）
 * @returns {object} 验证结果 { valid: boolean, error?: string }
 *
 * @example
 * validateFilePath('/uploads/images/test.jpg')
 * // => { valid: true }
 *
 * validateFilePath('../../../etc/passwd')
 * // => { valid: false, error: '无效的文件路径' }
 */
function validateFilePath(filePath, options = {}) {
  const {
    requireUploadsPrefix = true,
    requireCategory = false,
    allowedCategories = ['images', 'videos', 'documents', 'archives', 'texts', 'others']
  } = options

  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: '文件路径不能为空' }
  }

  // 检查路径遍历攻击
  if (filePath.includes('../') || filePath.includes('..\\')) {
    return { valid: false, error: '无效的文件路径：检测到路径遍历攻击' }
  }

  // 检查双斜杠（可能导致路径问题）
  if (filePath.includes('//')) {
    return { valid: false, error: '无效的文件路径：包含双斜杠' }
  }

  // 使用 path.normalize 标准化路径后再次检查
  const normalizedPath = path.normalize(filePath)
  if (normalizedPath.includes('..')) {
    return { valid: false, error: '无效的文件路径：标准化后检测到路径遍历' }
  }

  // 如果要求以 /uploads/ 开头
  if (requireUploadsPrefix && !filePath.startsWith('/uploads/')) {
    return { valid: false, error: '无效的文件路径：必须以 /uploads/ 开头' }
  }

  // 如果要求包含分类目录
  if (requireCategory) {
    const categoryPattern = new RegExp(`^/uploads/(${allowedCategories.join('|')})/`)
    if (!categoryPattern.test(filePath)) {
      return {
        valid: false,
        error: `无效的文件路径：必须在以下分类目录中：${allowedCategories.join(', ')}`
      }
    }
  }

  return { valid: true }
}

/**
 * 验证文件路径并解析为绝对路径
 *
 * @param {string} filePath - 相对文件路径（如：/uploads/images/test.jpg）
 * @param {string} baseDir - 基础目录（默认：项目根目录下的 public）
 * @param {object} options - 验证选项（传递给 validateFilePath）
 * @returns {object} 结果 { valid: boolean, absolutePath?: string, error?: string }
 */
function validateAndResolvePath(filePath, baseDir = null, options = {}) {
  // 验证路径
  const validation = validateFilePath(filePath, options)
  if (!validation.valid) {
    return validation
  }

  // 如果没有指定基础目录，使用默认值
  if (!baseDir) {
    baseDir = path.join(__dirname, '../../public')
  }

  // 将相对路径转换为绝对路径
  const absolutePath = path.join(baseDir, filePath)

  // 确保目标路径在允许的目录内（双重安全检查）
  const allowedBaseDir = path.join(baseDir, 'uploads')
  const resolvedPath = path.resolve(absolutePath)
  const resolvedBaseDir = path.resolve(allowedBaseDir)

  if (!resolvedPath.startsWith(resolvedBaseDir)) {
    return { valid: false, error: '无效的文件路径：路径超出允许的目录范围' }
  }

  return {
    valid: true,
    absolutePath: resolvedPath
  }
}

/**
 * 安全删除文件
 *
 * @param {string} filePath - 相对文件路径
 * @param {string} baseDir - 基础目录（默认：项目根目录下的 public）
 * @param {object} options - 验证选项（传递给 validateFilePath）
 * @returns {object} 删除结果 { success: boolean, error?: string, path?: string }
 */
function safeDeleteFile(filePath, baseDir = null, options = {}) {
  try {
    // 验证并解析路径
    const pathResult = validateAndResolvePath(filePath, baseDir, options)
    if (!pathResult.valid) {
      return {
        success: false,
        error: pathResult.error
      }
    }

    const absolutePath = pathResult.absolutePath

    // 检查文件是否存在
    if (!fs.existsSync(absolutePath)) {
      return {
        success: false,
        error: '文件不存在',
        path: absolutePath
      }
    }

    // 删除文件
    fs.unlinkSync(absolutePath)

    return {
      success: true,
      path: absolutePath
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    return {
      success: false,
      error: '删除文件失败: ' + error.message
    }
  }
}

/**
 * 验证文件名格式（用于仅提供文件名的情况）
 *
 * @param {string} filename - 文件名
 * @returns {object} 验证结果 { valid: boolean, error?: string }
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: '文件名不能为空' }
  }

  // 检查文件名格式（允许字母、数字、下划线、连字符、点）
  // 但不允许路径分隔符和特殊字符
  if (!/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    return { valid: false, error: '无效的文件名格式' }
  }

  // 检查路径遍历攻击
  if (
    filename.includes('../') ||
    filename.includes('..\\') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return { valid: false, error: '无效的文件名：包含非法字符' }
  }

  return { valid: true }
}

module.exports = {
  validateFilePath,
  validateAndResolvePath,
  safeDeleteFile,
  validateFilename
}
