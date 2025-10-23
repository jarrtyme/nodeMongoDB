const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const { upload, fileUpload, handleUploadError, getFileType, uploadDir } = require('../middlewares/uploadMiddleware')
const { authenticateToken } = require('../middlewares/authMiddleware')

// 所有上传路由都需要鉴权
router.use(authenticateToken)

/**
 * 批量上传图片接口
 * POST /upload/images
 * 支持多文件上传，返回上传成功的文件信息
 */
router.post('/images', upload.array('images', 10), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片文件',
        data: null
      })
    }

    // 处理上传的文件
    const uploadedFiles = req.files.map(file => {
      return {
        originalName: file.originalname,
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadTime: new Date().toISOString()
      }
    })

    res.json({
      code: 200,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: {
        files: uploadedFiles,
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
router.post('/image', upload.single('image'), handleUploadError, (req, res) => {
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

    res.json({
      code: 200,
      message: '图片上传成功',
      data: uploadedFile
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
 * 删除图片接口
 * POST /upload/delete
 * 删除指定的图片文件
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
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename)) {
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
      message: '图片删除成功',
      data: {
        filename: filename,
        deletedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('图片删除错误:', error)
    res.status(500).json({
      code: 500,
      message: '图片删除失败',
      data: null
    })
  }
})

/**
 * 获取上传的图片列表
 * POST /upload/list
 * 返回所有已上传的图片信息
 */
router.post('/list', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../public/uploads')
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        code: 200,
        message: '暂无上传的图片',
        data: {
          images: [],
          count: 0
        }
      })
    }

    const files = fs.readdirSync(uploadDir)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
    })

    const images = imageFiles.map(filename => {
      const filePath = path.join(uploadDir, filename)
      const stats = fs.statSync(filePath)
      
      return {
        filename: filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString()
      }
    })

    res.json({
      code: 200,
      message: '获取图片列表成功',
      data: {
        images: images,
        count: images.length,
        totalSize: images.reduce((sum, img) => sum + img.size, 0)
      }
    })

  } catch (error) {
    console.error('获取图片列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '获取图片列表失败',
      data: null
    })
    }
})

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

    res.json({
      code: 200,
      message: '文件上传成功',
      data: fileInfo
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

    const uploadedFiles = req.files.map(file => {
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

    // 按文件类型分组统计
    const fileTypeCount = uploadedFiles.reduce((acc, file) => {
      acc[file.fileType] = (acc[file.fileType] || 0) + 1
      return acc
    }, {})

    res.json({
      code: 200,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      data: {
        files: uploadedFiles,
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
