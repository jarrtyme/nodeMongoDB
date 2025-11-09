const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const {
  upload,
  fileUpload,
  handleUploadError,
  getFileType,
  uploadDir
} = require('../middlewares/uploadMiddleware')
const { authenticateToken, refreshTokenIfNeeded } = require('../middlewares/authMiddleware')
const { addFileUrl } = require('../utils/fileUrl')

// 所有上传路由都需要鉴权，并支持无感刷新 token
router.use(authenticateToken)
router.use(refreshTokenIfNeeded)

/**
 * 批量上传图片接口
 * POST /upload/images
 * 支持多文件上传，返回上传成功的文件信息
 */
router.post('/images', upload.array('file', 10), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片文件',
        data: null
      })
    }

    // 处理上传的文件
    const uploadedFiles = req.files.map((file) => {
      return {
        originalName: file.originalname,
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadTime: new Date().toISOString()
      }
    })

    // 添加完整 URL（传入 req 以自动匹配协议）
    const filesWithUrl = addFileUrl(uploadedFiles, req)

    res.json({
      code: 200,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: {
        files: filesWithUrl,
        count: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
      }
    })
  } catch (error) {
    console.error('图片上传错误:', error)
    res.status(500).json({
      code: 500,
      message: '图片上传失败',
      data: null
    })
  }
})

/**
 * 单个图片上传接口
 * POST /upload/image
 * 上传单个图片文件
 */
router.post('/image', upload.single('file'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片文件',
        data: null
      })
    }

    const uploadedFile = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadTime: new Date().toISOString()
    }

    // 添加完整 URL（传入 req 以自动匹配协议）
    const fileWithUrl = addFileUrl(uploadedFile, req)

    res.json({
      code: 200,
      message: '图片上传成功',
      data: fileWithUrl
    })
  } catch (error) {
    console.error('图片上传错误:', error)
    res.status(500).json({
      code: 500,
      message: '图片上传失败',
      data: null
    })
  }
})

/**
 * 删除文件接口（通用，支持所有文件类型）
 * POST /upload/delete
 * 删除指定的文件（图片、文档、压缩包等）
 */
router.post('/delete', (req, res) => {
  try {
    const { filename } = req.body

    if (!filename) {
      return res.status(400).json({
        code: 400,
        message: '文件名不能为空',
        data: null
      })
    }

    // 验证文件名格式（防止路径遍历攻击）
    // 允许文件名包含点、下划线、连字符和字母数字
    if (!/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/.test(filename)) {
      return res.status(400).json({
        code: 400,
        message: '无效的文件名',
        data: null
      })
    }

    const filePath = path.join(__dirname, '../../public/uploads', filename)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        data: null
      })
    }

    // 删除文件
    fs.unlinkSync(filePath)

    res.json({
      code: 200,
      message: '文件删除成功',
      data: {
        filename: filename,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('文件删除错误:', error)
    res.status(500).json({
      code: 500,
      message: '文件删除失败',
      data: null
    })
  }
})

/**
 * 获取上传的文件列表（所有文件类型）
 * POST /upload/list
 * 返回所有已上传的文件信息（包括图片、文档、压缩包等）
 */
router.post('/list', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../public/uploads')

    if (!fs.existsSync(uploadDir)) {
      return res.json({
        code: 200,
        message: '暂无上传的文件',
        data: {
          images: [],
          files: [],
          count: 0
        }
      })
    }

    const files = fs.readdirSync(uploadDir)

    // 获取所有文件信息
    const allFiles = files.map((filename) => {
      const filePath = path.join(uploadDir, filename)
      const stats = fs.statSync(filePath)
      const ext = path.extname(filename).toLowerCase()

      // 判断文件类型
      let fileType = 'other'
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        fileType = 'image'
      } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
        fileType = 'document'
      } else if (['.zip', '.rar', '.7z'].includes(ext)) {
        fileType = 'archive'
      } else if (['.txt', '.csv'].includes(ext)) {
        fileType = 'text'
      }

      return {
        filename: filename,
        originalName: filename, // 兼容旧接口
        path: `/uploads/${filename}`,
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString(),
        fileType: fileType,
        mimetype: getMimeType(ext)
      }
    })

    // 添加完整 URL（传入 req 以自动匹配协议）
    const allFilesWithUrl = addFileUrl(allFiles, req)

    // 为了兼容旧代码，同时返回 images（仅图片）和 files（所有文件）
    const imageFiles = allFilesWithUrl.filter((file) => file.fileType === 'image')

    res.json({
      code: 200,
      message: '获取文件列表成功',
      data: {
        images: imageFiles, // 兼容旧接口，仅图片
        files: allFilesWithUrl, // 所有文件
        list: allFilesWithUrl, // 兼容别名
        count: allFilesWithUrl.length,
        totalSize: allFilesWithUrl.reduce((sum, file) => sum + file.size, 0)
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

/**
 * 单个文件上传接口（通用）
 * POST /upload/file
 * 支持图片、文档、压缩包等多种文件类型
 */
router.post('/file', fileUpload.single('file'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件',
        data: null
      })
    }

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      fileType: getFileType(req.file.mimetype),
      uploadTime: new Date().toISOString()
    }

    // 添加完整 URL（传入 req 以自动匹配协议）
    const fileInfoWithUrl = addFileUrl(fileInfo, req)

    res.json({
      code: 200,
      message: '文件上传成功',
      data: fileInfoWithUrl
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
 * 批量文件上传接口（通用）
 * POST /upload/files
 * 支持多文件上传，支持多种文件类型
 */
router.post('/files', fileUpload.array('files', 10), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件',
        data: null
      })
    }

    const uploadedFiles = req.files.map((file) => {
      return {
        originalName: file.originalname,
        filename: file.filename,
        path: `/uploads/${file.filename}`,
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
    console.error('批量文件上传错误:', error)
    res.status(500).json({
      code: 500,
      message: '批量文件上传失败',
      data: null
    })
  }
})

module.exports = router
