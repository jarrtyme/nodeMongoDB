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
const FileListService = require('../services/fileListService')
const { publicDir, uploadsDir } = require('../config/paths')

// 所有上传路由都需要鉴权，并支持无感刷新 token（除了 /list 路由）
router.use((req, res, next) => {
  // 排除 /list 路由，不需要鉴权
  if (req.path === '/list' && req.method === 'POST') {
    return next()
  }
  // 其他路由需要鉴权
  authenticateToken(req, res, next)
})

router.use((req, res, next) => {
  // 排除 /list 路由，不需要刷新 token
  if (req.path === '/list' && req.method === 'POST') {
    return next()
  }
  // 其他路由需要刷新 token
  refreshTokenIfNeeded(req, res, next)
})

/**
 * 统一上传接口
 * POST /upload
 * 支持多文件上传，支持所有文件类型，自动按文件类型分类存储
 * 请求参数：files (multipart/form-data) - 文件数组，支持单个或多个文件
 */
router.post('/', fileUpload.array('files', 200), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.error('请选择要上传的文件', 400)
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
      return res.success(filesWithUrl[0], '文件上传成功')
    }

    // 多个文件返回数组
    res.success(
      {
        files: filesWithUrl,
        count: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
        typeCount: fileTypeCount
      },
      `成功上传 ${uploadedFiles.length} 个文件`
    )
  } catch (error) {
    console.error('文件上传错误:', error)
    res.error('文件上传失败', 500)
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

      const statusCode = errors.length === 0 ? 200 : 207 // 207 = Multi-Status
      return res.success(
        {
          success: results,
          failed: errors,
          total: files.length,
          successCount: results.length,
          failCount: errors.length
        },
        `批量删除完成：成功 ${results.length} 个，失败 ${errors.length} 个`,
        statusCode
      )
    }

    // 单个删除模式（保持向后兼容）
    const deleteResult = deleteSingleFile(filename, filePath)
    if (deleteResult.success) {
      res.success(
        {
          filename: filename || path.basename(filePath),
          path: deleteResult.path
        },
        '文件删除成功'
      )
    } else {
      res.error(deleteResult.error, deleteResult.status || 404)
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    res.error('删除文件失败: ' + error.message, 500)
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

    // 使用文件列表服务获取文件列表
    const result = await FileListService.getFileList({ page, limit, fileType, description })

    // 添加完整 URL
    const filesWithUrl = addFileUrl(result.list, req)
    const imagesWithUrl = addFileUrl(result.images, req)

    res.success(
      {
        list: filesWithUrl,
        images: imagesWithUrl,
        files: filesWithUrl,
        count: result.count,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
        totalSize: result.totalSize
      },
      '获取文件列表成功'
    )
  } catch (error) {
    console.error('获取文件列表错误:', error)
    res.error('获取文件列表失败', 500)
  }
})

module.exports = router
