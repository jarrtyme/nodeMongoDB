const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const {
  fileUpload,
  handleUploadError,
  getFileType,
  getRelativePath,
  uploadDir
} = require('../middlewares/uploadMiddleware')
const { authenticateToken, refreshTokenIfNeeded } = require('../middlewares/authMiddleware')
const { addFileUrl } = require('../utils/fileUrl')
const {
  normalizeUrl,
  normalizeUrlForStorage,
  cleanFilePath,
  normalizeFilePath
} = require('../utils/urlUtils')
const {
  validateFilePath,
  validateAndResolvePath,
  safeDeleteFile,
  validateFilename
} = require('../utils/pathValidator')
const MediaService = require('../services/mediaService')
const { publicDir, uploadsDir } = require('../config/paths')

// 所有上传路由都需要鉴权，并支持无感刷新 token
router.use(authenticateToken)
router.use(refreshTokenIfNeeded)

/**
 * 统一上传接口
 * POST /upload
 * 支持多文件上传，支持所有文件类型，自动按文件类型分类存储
 * 请求参数：files (multipart/form-data) - 文件数组，支持单个或多个文件
 */
router.post('/', fileUpload.array('files', 10), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件',
        data: null
      })
    }

    // 处理上传的文件
    const uploadedFiles = req.files.map((file) => {
      // 获取文件的相对路径（包含分类目录）
      const relativePath = getRelativePath(file.path)

      return {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath, // 包含分类目录的路径，如 /uploads/images/xxx.jpg
        size: file.size,
        mimetype: file.mimetype,
        fileType: getFileType(file.mimetype),
        uploadTime: new Date().toISOString()
      }
    })

    // 添加完整 URL（传入 req 以自动匹配协议）
    const filesWithUrl = addFileUrl(uploadedFiles, req)

    // 按文件类型分组统计
    const fileTypeCount = uploadedFiles.reduce((acc, file) => {
      acc[file.fileType] = (acc[file.fileType] || 0) + 1
      return acc
    }, {})

    // 如果只有一个文件，返回单个文件对象
    if (uploadedFiles.length === 1) {
      return res.json({
        code: 200,
        message: '文件上传成功',
        data: filesWithUrl[0]
      })
    }

    // 多个文件返回数组
    res.json({
      code: 200,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: {
        files: filesWithUrl,
        count: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
        typeCount: fileTypeCount
      }
    })
  } catch (error) {
    console.error('文件上传错误:', error)
    res.status(500).json({
      code: 500,
      message: '文件上传失败',
      data: null
    })
  }
})

/**
 * 删除文件接口（通用，支持所有文件类型）
 * POST /upload/delete
 * 删除指定的文件（图片、文档、压缩包等）
 * 支持分类目录下的文件删除
 * 支持单个删除和批量删除
 *
 * 单个删除：{ filename: 'xxx.jpg', filePath: '/uploads/images/xxx.jpg' }
 * 批量删除：{ files: [{ filename: 'xxx.jpg', filePath: '/uploads/images/xxx.jpg' }, ...] }
 */
router.post('/delete', (req, res) => {
  try {
    const { filename, filePath, files } = req.body

    // 批量删除模式
    if (files && Array.isArray(files) && files.length > 0) {
      const results = []
      const errors = []

      files.forEach((file, index) => {
        try {
          const { filename: itemFilename, filePath: itemFilePath } = file
          const deleteResult = deleteSingleFile(itemFilename, itemFilePath)
          if (deleteResult.success) {
            results.push({
              index,
              filename: itemFilename || path.basename(itemFilePath),
              success: true
            })
          } else {
            errors.push({
              index,
              filename: itemFilename || path.basename(itemFilePath),
              error: deleteResult.error
            })
          }
        } catch (error) {
          errors.push({
            index,
            filename: file.filename || 'unknown',
            error: error.message
          })
        }
      })

      return res.json({
        code: errors.length === 0 ? 200 : 207, // 207 = Multi-Status
        message: `批量删除完成：成功 ${results.length} 个，失败 ${errors.length} 个`,
        data: {
          success: results,
          failed: errors,
          total: files.length,
          successCount: results.length,
          failCount: errors.length
        }
      })
    }

    // 单个删除模式（保持向后兼容）
    const deleteResult = deleteSingleFile(filename, filePath)
    if (deleteResult.success) {
      res.json({
        code: 200,
        message: '文件删除成功',
        data: {
          filename: filename || path.basename(filePath),
          path: deleteResult.path
        }
      })
    } else {
      res.status(deleteResult.status || 404).json({
        code: deleteResult.status || 404,
        message: deleteResult.error,
        data: null
      })
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除文件失败: ' + error.message,
      data: null
    })
  }
})

// 删除单个文件的辅助函数
function deleteSingleFile(filename, filePath) {
  try {
    // 优先使用 filePath（包含分类目录），如果没有则使用 filename
    let targetPath
    if (filePath) {
      // 清理路径：移除可能的 /api 前缀和查询参数
      let cleanPath = cleanFilePath(filePath)

      // 验证并解析路径（使用工具函数）
      const pathResult = validateAndResolvePath(cleanPath, publicDir, {
        requireUploadsPrefix: true,
        requireCategory: true
      })

      if (!pathResult.valid) {
        return {
          success: false,
          status: 400,
          error: pathResult.error || '无效的文件路径'
        }
      }

      targetPath = pathResult.absolutePath
    } else if (filename) {
      // 如果只提供文件名，需要在所有分类目录中查找
      // 验证文件名格式（使用工具函数）
      const filenameValidation = validateFilename(filename)
      if (!filenameValidation.valid) {
        return {
          success: false,
          status: 400,
          error: filenameValidation.error || '无效的文件名'
        }
      }

      // 如果只提供文件名，在所有分类目录中查找文件
      const categories = ['images', 'videos', 'documents', 'archives', 'texts', 'others']
      let found = false
      for (const category of categories) {
        const categoryPath = path.join(uploadsDir, category, filename)
        if (fs.existsSync(categoryPath)) {
          targetPath = categoryPath
          found = true
          break
        }
      }

      // 如果分类目录中没找到，尝试根目录（处理旧文件）
      if (!found) {
        targetPath = path.join(uploadsDir, filename)
      }
    } else {
      return {
        success: false,
        status: 400,
        error: '文件名或文件路径不能为空'
      }
    }

    // 如果已经有 targetPath，直接删除
    if (targetPath) {
      if (!fs.existsSync(targetPath)) {
        return {
          success: false,
          status: 404,
          error: '文件不存在',
          path: targetPath
        }
      }
      fs.unlinkSync(targetPath)
      return {
        success: true,
        path: targetPath
      }
    } else {
      // 如果没有 targetPath，说明只提供了文件名，已经在循环中处理
      return {
        success: false,
        status: 400,
        error: '文件名或文件路径不能为空'
      }
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    return {
      success: false,
      status: 500,
      error: '删除文件失败: ' + error.message
    }
  }
}

/**
 * 获取上传的文件列表（所有文件类型）
 * POST /upload/list
 * 返回所有已上传的文件信息（包括图片、文档、压缩包等）
 * 支持分类目录扫描
 * 支持分页查询和文件类型筛选
 * 支持描述模糊查询
 *
 * 请求参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * - fileType: 文件类型筛选（可选：'image', 'video', 'document', 'archive', 'text', 'other'）
 * - description: 描述搜索关键字（模糊查询，可选）
 */
router.post('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, fileType, description } = req.body
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10))) // 限制最大每页100条

    const baseUploadDir = uploadsDir

    if (!fs.existsSync(baseUploadDir)) {
      return res.json({
        code: 200,
        message: '暂无上传的文件',
        data: {
          list: [],
          images: [],
          files: [],
          count: 0,
          total: 0,
          page: pageNum,
          limit: limitNum,
          pages: 0
        }
      })
    }

    // 分类目录列表
    const categories = ['images', 'videos', 'documents', 'archives', 'texts', 'others']
    const allFiles = []

    // 遍历所有分类目录
    categories.forEach((category) => {
      const categoryDir = path.join(baseUploadDir, category)
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir)
        files.forEach((filename) => {
          const filePath = path.join(categoryDir, filename)
          const stats = fs.statSync(filePath)

          // 只处理文件，忽略目录
          if (stats.isFile()) {
            const ext = path.extname(filename).toLowerCase()
            const relativePath = `/uploads/${category}/${filename}`

            // 判断文件类型
            let fileType = 'other'
            if (category === 'images') {
              fileType = 'image'
            } else if (category === 'videos') {
              fileType = 'video'
            } else if (category === 'documents') {
              fileType = 'document'
            } else if (category === 'archives') {
              fileType = 'archive'
            } else if (category === 'texts') {
              fileType = 'text'
            }

            allFiles.push({
              filename: filename,
              originalName: filename, // 原始文件名（与filename相同）
              path: relativePath, // 包含分类目录的路径
              size: stats.size,
              uploadTime: stats.birthtime.toISOString(),
              lastModified: stats.mtime.toISOString(),
              fileType: fileType,
              mimetype: getMimeType(ext)
            })
          }
        })
      }
    })

    // 扫描根目录（处理未分类的旧文件）
    const rootFiles = fs.readdirSync(baseUploadDir)
    rootFiles.forEach((filename) => {
      const filePath = path.join(baseUploadDir, filename)
      const stats = fs.statSync(filePath)

      // 只处理文件，忽略目录
      if (stats.isFile()) {
        const ext = path.extname(filename).toLowerCase()

        // 判断文件类型
        let fileType = 'other'
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
          fileType = 'image'
        } else if (
          ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'].includes(ext)
        ) {
          fileType = 'video'
        } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
          fileType = 'document'
        } else if (['.zip', '.rar', '.7z'].includes(ext)) {
          fileType = 'archive'
        } else if (['.txt', '.csv'].includes(ext)) {
          fileType = 'text'
        }

        allFiles.push({
          filename: filename,
          originalName: filename,
          path: `/uploads/${filename}`, // 根目录路径
          size: stats.size,
          uploadTime: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          fileType: fileType,
          mimetype: getMimeType(ext)
        })
      }
    })

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

    // 描述模糊查询筛选
    if (description && description.trim()) {
      try {
        const searchKeyword = description.trim()
        console.log('开始描述查询，关键字:', searchKeyword)

        // 查询媒体库中匹配描述的文件
        // 使用 $elemMatch 确保在数组元素中匹配
        const searchQuery = {
          descriptions: {
            $elemMatch: {
              text: {
                $regex: searchKeyword,
                $options: 'i' // 不区分大小写
              }
            }
          }
        }

        console.log('查询条件:', JSON.stringify(searchQuery, null, 2))
        const matchedMedia = await MediaService.find(searchQuery, 1, 10000) // 获取所有匹配的媒体记录
        console.log('匹配到的媒体记录数量:', matchedMedia.length)

        if (matchedMedia.length > 0) {
          console.log('匹配到的媒体记录示例:', JSON.stringify(matchedMedia[0], null, 2))
        }

        // 提取匹配的URL列表（需要标准化URL格式以便匹配）
        const matchedUrls = new Set()
        const matchedPaths = new Set()

        matchedMedia.forEach((media) => {
          let mediaUrl = media.url || ''
          console.log('原始媒体URL:', mediaUrl)

          // 标准化URL：移除协议、域名和/api前缀
          mediaUrl = normalizeUrl(mediaUrl)

          console.log('标准化后的URL:', mediaUrl)

          // 添加标准化后的URL
          matchedUrls.add(mediaUrl)
          matchedPaths.add(mediaUrl)

          // 也尝试添加不带前导斜杠的版本（以防万一）
          if (mediaUrl.startsWith('/')) {
            matchedPaths.add(mediaUrl.substring(1))
          } else {
            matchedPaths.add('/' + mediaUrl)
          }
        })

        console.log('匹配的URL列表:', Array.from(matchedUrls))
        console.log('筛选前的文件数量:', filteredFiles.length)

        // 只保留URL匹配的文件
        if (matchedUrls.size > 0) {
          const beforeFilterCount = filteredFiles.length
          filteredFiles = filteredFiles.filter((file) => {
            // 标准化文件路径以便匹配
            const filePath = normalizeFilePath(file.path || '')
            // 标准化路径（统一处理前导斜杠）
            const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath
            const normalizedPathNoSlash = filePath.startsWith('/')
              ? filePath.substring(1)
              : filePath

            // 尝试多种匹配方式
            const matches =
              matchedUrls.has(filePath) ||
              matchedPaths.has(filePath) ||
              matchedUrls.has(normalizedPath) ||
              matchedPaths.has(normalizedPath) ||
              matchedUrls.has(normalizedPathNoSlash) ||
              matchedPaths.has(normalizedPathNoSlash)

            if (matches) {
              console.log('文件匹配成功 - 文件路径:', filePath, '文件名:', file.filename)
            }
            return matches
          })
          console.log(`筛选前: ${beforeFilterCount} 个文件, 筛选后: ${filteredFiles.length} 个文件`)
        } else {
          // 如果没有匹配的媒体记录，返回空列表
          console.log('没有匹配的媒体记录，返回空列表')
          filteredFiles = []
        }
      } catch (error) {
        console.error('描述查询错误:', error)
        console.error('错误堆栈:', error.stack)
        // 查询失败时返回空列表
        filteredFiles = []
      }
    }

    // 计算分页
    const total = filteredFiles.length
    const pages = Math.ceil(total / limitNum)
    const skip = (pageNum - 1) * limitNum
    const paginatedFiles = filteredFiles.slice(skip, skip + limitNum)

    // 添加完整 URL
    const allFilesWithUrl = addFileUrl(paginatedFiles, req)

    // 获取当前页文件对应的媒体库信息（只查询当前页的文件，提高性能）
    const mediaMap = {}
    try {
      // 提取当前页所有文件的路径（使用与存储时相同的标准化逻辑）
      const normalizedFilePaths = allFilesWithUrl.map((file) => {
        // 使用 normalizeUrlForStorage 确保格式与媒体库存储格式一致（以 / 开头）
        return normalizeUrlForStorage(file.path || '')
      })

      // 查询媒体库中匹配这些路径的记录
      if (normalizedFilePaths.length > 0) {
        const MediaService = require('../services/mediaService')

        // 调试日志：记录要查询的文件路径
        console.log(`[upload/list] 准备查询 ${normalizedFilePaths.length} 个文件的媒体库信息`)
        console.log(`[upload/list] 文件路径示例: ${normalizedFilePaths.slice(0, 3).join(', ')}...`)

        // 使用 $or 查询匹配多个路径（支持多种格式）
        const mediaQuery = {
          $or: normalizedFilePaths.flatMap((path) => {
            // 支持多种路径格式匹配（媒体库中可能存储了不同格式）
            return [
              { url: path }, // 标准格式：/uploads/images/xxx.jpg
              { url: path.startsWith('/') ? path.substring(1) : path }, // 不带前导斜杠：uploads/images/xxx.jpg
              { url: '/' + path.replace(/^\/+/, '') } // 确保只有一个前导斜杠
            ]
          })
        }

        // 调试日志：记录查询条件（只记录前几个，避免日志过长）
        const querySample = mediaQuery.$or.slice(0, 3)
        console.log(`[upload/list] 查询条件示例: ${JSON.stringify(querySample)}...`)

        // 查询媒体库记录，确保返回 isAddedToLibrary 字段
        const matchedMedia = await MediaService.find(mediaQuery, 1, 1000)

        // 调试日志：记录查询结果
        console.log(
          `[upload/list] 查询到 ${matchedMedia.length} 条媒体库记录（共查询 ${normalizedFilePaths.length} 个文件）`
        )
        if (matchedMedia.length > 0) {
          console.log(
            `[upload/list] 媒体库记录示例: ${matchedMedia
              .slice(0, 3)
              .map((m) => m.url)
              .join(', ')}...`
          )
        }

        // 构建媒体库映射（通过标准化路径匹配）
        matchedMedia.forEach((media) => {
          // 媒体库中的 URL 已经是标准化后的格式（以 / 开头）
          // 使用 normalizeUrlForStorage 确保格式一致
          let mediaUrl = normalizeUrlForStorage(media.url || '')

          // 调试日志：记录媒体库中的 URL
          console.log(
            `[upload/list] 媒体库 URL: ${mediaUrl}, isAddedToLibrary: ${media.isAddedToLibrary}`
          )

          // 匹配文件路径（使用标准化后的路径进行精确匹配）
          const matchedPath = normalizedFilePaths.find((path) => {
            // 标准化路径进行比较（都使用 normalizeUrlForStorage 标准化，格式应该一致）
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
            // 确保 isAddedToLibrary 字段存在（旧数据可能没有此字段，默认为 true）
            const isAddedToLibrary =
              media.isAddedToLibrary !== undefined ? media.isAddedToLibrary : true

            const mediaInfo = {
              _id: media._id.toString(),
              descriptions: media.descriptions || [],
              isAddedToLibrary: isAddedToLibrary
            }

            // 调试日志：记录匹配成功
            console.log(
              `[upload/list] 路径匹配成功: ${matchedPath} -> 媒体库 URL: ${mediaUrl}, isAddedToLibrary: ${isAddedToLibrary}`
            )

            // 使用标准化路径作为 key（与查找时使用的格式一致）
            mediaMap[matchedPath] = mediaInfo
            // 也使用不带前导斜杠的版本（双重保障）
            if (matchedPath.startsWith('/')) {
              mediaMap[matchedPath.substring(1)] = mediaInfo
            } else {
              mediaMap['/' + matchedPath] = mediaInfo
            }
            // 也使用媒体库中的原始 URL 格式作为 key（以防万一）
            mediaMap[mediaUrl] = mediaInfo
            if (mediaUrl.startsWith('/')) {
              mediaMap[mediaUrl.substring(1)] = mediaInfo
            } else {
              mediaMap['/' + mediaUrl] = mediaInfo
            }
          } else {
            // 调试日志：记录未匹配的媒体库记录
            console.log(
              `[upload/list] 媒体库记录未匹配到文件 - 媒体库 URL: ${mediaUrl}, 文件路径列表前3个: ${normalizedFilePaths
                .slice(0, 3)
                .join(', ')}...`
            )
          }
        })
      } else {
        console.log(`[upload/list] 没有文件需要查询媒体库信息`)
      }
    } catch (error) {
      console.error('获取媒体库信息失败:', error)
      console.error('错误堆栈:', error.stack)
      // 媒体库查询失败不影响文件列表返回
    }

    // 为每个文件添加 isAddedToLibrary 字段和媒体库信息
    const filesWithMediaInfo = allFilesWithUrl.map((file) => {
      // 标准化文件路径（与创建媒体库时的标准化逻辑一致）
      let filePath = normalizeUrlForStorage(file.path || '')

      // 从 mediaMap 中查找匹配的媒体库信息（支持多种格式）
      let mediaInfo =
        mediaMap[filePath] ||
        mediaMap[filePath.substring(1)] || // 不带前导斜杠
        mediaMap['/' + filePath.replace(/^\/+/, '')] // 确保只有一个前导斜杠

      // 调试日志：记录查找结果
      if (!mediaInfo && filePath) {
        console.log(
          `[upload/list] 未找到媒体库信息 - 文件路径: ${filePath}, 原始路径: ${file.path}`
        )
        console.log(
          `[upload/list] mediaMap keys: ${Object.keys(mediaMap).slice(0, 5).join(', ')}...`
        )
      }

      // 如果找到了媒体信息，说明已添加到媒体库
      const isAddedToLibrary = mediaInfo
        ? mediaInfo.isAddedToLibrary !== undefined
          ? mediaInfo.isAddedToLibrary
          : true
        : false

      return {
        ...file,
        mediaId: mediaInfo ? mediaInfo._id : null,
        isAddedToLibrary: isAddedToLibrary,
        descriptions: mediaInfo ? mediaInfo.descriptions || [] : []
      }
    })

    // 筛选出图片文件（用于兼容旧接口）
    const imageFiles = filesWithMediaInfo.filter((file) => file.fileType === 'image')

    res.json({
      code: 200,
      message: '获取文件列表成功',
      data: {
        list: filesWithMediaInfo, // 分页后的文件列表（已包含 isAddedToLibrary 字段）
        images: imageFiles, // 仅图片文件（分页后）
        files: filesWithMediaInfo, // 所有文件（分页后，已包含 isAddedToLibrary 字段）
        count: filesWithMediaInfo.length, // 当前页数量
        total: total, // 总数量
        page: pageNum, // 当前页码
        limit: limitNum, // 每页数量
        pages: pages, // 总页数
        totalSize: filteredFiles.reduce((sum, file) => sum + file.size, 0) // 筛选后的总大小
      }
    })
  } catch (error) {
    console.error('获取文件列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '获取文件列表失败',
      data: null
    })
  }
})

/**
 * 根据文件扩展名获取 MIME 类型
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.txt': 'text/plain',
    '.csv': 'text/csv'
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

module.exports = router
