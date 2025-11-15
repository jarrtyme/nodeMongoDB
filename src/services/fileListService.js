const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const MediaService = require('./mediaService')
const { normalizeUrl, normalizeUrlForStorage, normalizeFilePath } = require('../utils/urlUtils')
const { uploadsDir } = require('../config/paths')
const {
  getMimeType,
  getFileTypeFromCategory,
  getFileTypeFromExtension
} = require('../utils/fileTypeUtils')

// 使用异步 API 替代同步 API
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

/**
 * 扫描分类目录中的文件
 */
async function scanCategoryDirectory(categoryDir, category) {
  const files = []
  try {
    if (!fs.existsSync(categoryDir)) {
      return files
    }

    const filenames = await readdir(categoryDir)

    for (const filename of filenames) {
      const filePath = path.join(categoryDir, filename)
      const stats = await stat(filePath)

      if (stats.isFile()) {
        const ext = path.extname(filename).toLowerCase()
        const relativePath = `/uploads/${category}/${filename}`
        const fileType = getFileTypeFromCategory(category)

        files.push({
          filename,
          originalName: filename,
          path: relativePath,
          size: stats.size,
          uploadTime: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          fileType,
          mimetype: getMimeType(ext)
        })
      }
    }
  } catch (error) {
    console.error(`扫描分类目录 ${categoryDir} 失败:`, error)
  }
  return files
}

/**
 * 扫描根目录中的文件（处理未分类的旧文件）
 */
async function scanRootDirectory(baseUploadDir) {
  const files = []
  try {
    if (!fs.existsSync(baseUploadDir)) {
      return files
    }

    const filenames = await readdir(baseUploadDir)

    for (const filename of filenames) {
      const filePath = path.join(baseUploadDir, filename)
      const stats = await stat(filePath)

      if (stats.isFile()) {
        const ext = path.extname(filename).toLowerCase()
        const fileType = getFileTypeFromExtension(ext)

        files.push({
          filename,
          originalName: filename,
          path: `/uploads/${filename}`,
          size: stats.size,
          uploadTime: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          fileType,
          mimetype: getMimeType(ext)
        })
      }
    }
  } catch (error) {
    console.error(`扫描根目录 ${baseUploadDir} 失败:`, error)
  }
  return files
}

/**
 * 根据描述关键词筛选文件
 */
async function filterByDescription(files, description) {
  if (!description || !description.trim()) {
    return files
  }

  try {
    const keywords = description
      .split('|')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (keywords.length === 0) {
      return files
    }

    // 构建查询条件
    let searchQuery
    if (keywords.length === 1) {
      searchQuery = {
        descriptions: {
          $elemMatch: {
            text: {
              $regex: keywords[0],
              $options: 'i'
            }
          }
        }
      }
    } else {
      searchQuery = {
        $or: keywords.map((keyword) => ({
          descriptions: {
            $elemMatch: {
              text: {
                $regex: keyword,
                $options: 'i'
              }
            }
          }
        }))
      }
    }

    const matchedMedia = await MediaService.find(searchQuery, 1, 10000)
    const matchedUrls = new Set()
    const matchedPaths = new Set()

    matchedMedia.forEach((media) => {
      let mediaUrl = normalizeUrl(media.url || '')
      matchedUrls.add(mediaUrl)
      matchedPaths.add(mediaUrl)

      if (mediaUrl.startsWith('/')) {
        matchedPaths.add(mediaUrl.substring(1))
      } else {
        matchedPaths.add('/' + mediaUrl)
      }
    })

    if (matchedUrls.size > 0) {
      return files.filter((file) => {
        const filePath = normalizeFilePath(file.path || '')
        const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath
        const normalizedPathNoSlash = filePath.startsWith('/') ? filePath.substring(1) : filePath

        return (
          matchedUrls.has(filePath) ||
          matchedPaths.has(filePath) ||
          matchedUrls.has(normalizedPath) ||
          matchedPaths.has(normalizedPath) ||
          matchedUrls.has(normalizedPathNoSlash) ||
          matchedPaths.has(normalizedPathNoSlash)
        )
      })
    }

    return []
  } catch (error) {
    console.error('描述查询错误:', error)
    return []
  }
}

/**
 * 获取媒体库信息映射
 */
async function getMediaInfoMap(filePaths) {
  const mediaMap = {}

  try {
    if (filePaths.length === 0) {
      return mediaMap
    }

    const normalizedFilePaths = filePaths.map((path) => normalizeUrlForStorage(path || ''))

    const mediaQuery = {
      $or: normalizedFilePaths.flatMap((path) => [
        { url: path },
        { url: path.startsWith('/') ? path.substring(1) : path },
        { url: '/' + path.replace(/^\/+/, '') }
      ])
    }

    const matchedMedia = await MediaService.find(mediaQuery, 1, 1000)

    matchedMedia.forEach((media) => {
      let mediaUrl = normalizeUrlForStorage(media.url || '')

      const matchedPath = normalizedFilePaths.find((path) => {
        const pathNoSlash = path.startsWith('/') ? path.substring(1) : path
        const mediaUrlNoSlash = mediaUrl.startsWith('/') ? mediaUrl.substring(1) : mediaUrl
        return (
          path === mediaUrl ||
          pathNoSlash === mediaUrl ||
          path === mediaUrlNoSlash ||
          pathNoSlash === mediaUrlNoSlash
        )
      })

      if (matchedPath) {
        const isAddedToLibrary =
          media.isAddedToLibrary !== undefined ? media.isAddedToLibrary : true
        const mediaInfo = {
          _id: media._id.toString(),
          descriptions: media.descriptions || [],
          isAddedToLibrary
        }

        mediaMap[matchedPath] = mediaInfo
        if (matchedPath.startsWith('/')) {
          mediaMap[matchedPath.substring(1)] = mediaInfo
        } else {
          mediaMap['/' + matchedPath] = mediaInfo
        }
        mediaMap[mediaUrl] = mediaInfo
        if (mediaUrl.startsWith('/')) {
          mediaMap[mediaUrl.substring(1)] = mediaInfo
        } else {
          mediaMap['/' + mediaUrl] = mediaInfo
        }
      }
    })
  } catch (error) {
    console.error('获取媒体库信息失败:', error)
  }

  return mediaMap
}

/**
 * 获取文件列表
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @param {string} options.fileType - 文件类型筛选
 * @param {string} options.description - 描述搜索关键字
 * @returns {Promise<Object>} 文件列表结果
 */
async function getFileList(options = {}) {
  const { page = 1, limit = 10, fileType, description } = options
  const pageNum = Math.max(1, parseInt(page, 10))
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)))

  const baseUploadDir = uploadsDir

  if (!fs.existsSync(baseUploadDir)) {
    return {
      list: [],
      images: [],
      files: [],
      count: 0,
      total: 0,
      page: pageNum,
      limit: limitNum,
      pages: 0,
      totalSize: 0
    }
  }

  // 分类目录列表
  const categories = ['images', 'videos', 'documents', 'archives', 'texts', 'others']
  const allFiles = []

  // 并行扫描所有分类目录（使用异步 API）
  const categoryScans = categories.map((category) => {
    const categoryDir = path.join(baseUploadDir, category)
    return scanCategoryDirectory(categoryDir, category)
  })

  const categoryResults = await Promise.all(categoryScans)
  categoryResults.forEach((files) => {
    allFiles.push(...files)
  })

  // 扫描根目录
  const rootFiles = await scanRootDirectory(baseUploadDir)
  allFiles.push(...rootFiles)

  // 按上传时间倒序排序
  allFiles.sort((a, b) => {
    const timeA = new Date(a.uploadTime).getTime()
    const timeB = new Date(b.uploadTime).getTime()
    return timeB - timeA
  })

  // 文件类型筛选
  let filteredFiles = allFiles
  if (fileType && fileType.trim()) {
    filteredFiles = allFiles.filter((file) => file.fileType === fileType.trim())
  }

  // 描述筛选
  if (description && description.trim()) {
    filteredFiles = await filterByDescription(filteredFiles, description)
  }

  // 计算分页
  const total = filteredFiles.length
  const pages = Math.ceil(total / limitNum)
  const skip = (pageNum - 1) * limitNum
  const paginatedFiles = filteredFiles.slice(skip, skip + limitNum)

  // 获取媒体库信息（只查询当前页的文件）
  const filePaths = paginatedFiles.map((file) => file.path || '')
  const mediaMap = await getMediaInfoMap(filePaths)

  // 为每个文件添加媒体库信息
  const filesWithMediaInfo = paginatedFiles.map((file) => {
    let filePath = normalizeUrlForStorage(file.path || '')
    let mediaInfo =
      mediaMap[filePath] ||
      mediaMap[filePath.substring(1)] ||
      mediaMap['/' + filePath.replace(/^\/+/, '')]

    const isAddedToLibrary = mediaInfo
      ? mediaInfo.isAddedToLibrary !== undefined
        ? mediaInfo.isAddedToLibrary
        : true
      : false

    return {
      ...file,
      mediaId: mediaInfo ? mediaInfo._id : null,
      isAddedToLibrary,
      descriptions: mediaInfo ? mediaInfo.descriptions || [] : []
    }
  })

  // 筛选出图片文件（用于兼容旧接口）
  const imageFiles = filesWithMediaInfo.filter((file) => file.fileType === 'image')

  return {
    list: filesWithMediaInfo,
    images: imageFiles,
    files: filesWithMediaInfo,
    count: filesWithMediaInfo.length,
    total,
    page: pageNum,
    limit: limitNum,
    pages,
    totalSize: filteredFiles.reduce((sum, file) => sum + file.size, 0)
  }
}

module.exports = {
  getFileList
}
