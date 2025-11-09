const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_随机数_原文件名
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}_${uniqueSuffix}${ext}`)
  }
})

// 图片文件过滤器
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'), false)
  }
}

// 通用文件过滤器（支持更多文件类型，包括视频）
const generalFileFilter = (req, file, cb) => {
  // 允许的文件类型（包括视频）
  const allowedTypes =
    /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|txt|csv|mp4|webm|ogg|mov|avi|wmv|flv|mkv/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())

  if (extname) {
    return cb(null, true)
  } else {
    cb(
      new Error(
        '不支持的文件类型。允许的类型：图片(jpg,png,gif,webp)、视频(mp4,webm,ogg,mov,avi,wmv,flv,mkv)、文档(pdf,doc,docx,xls,xlsx,ppt,pptx)、压缩包(zip,rar,7z)、文本(txt,csv)'
      ),
      false
    )
  }
}

// 文件大小限制
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB（用于图片和一般文件）
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB（用于视频）
const MAX_FILES = 10

// 图片上传配置（仅图片，10MB）
const imageUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
})

// 通用文件上传配置（支持多种类型，包括视频，50MB）
const fileUpload = multer({
  storage: storage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // 增加到50MB以支持视频
    files: MAX_FILES
  }
})

// 识别文件类型
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (
    mimetype.includes('pdf') ||
    mimetype.includes('document') ||
    mimetype.includes('word') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel') ||
    mimetype.includes('presentation') ||
    mimetype.includes('powerpoint')
  )
    return 'document'
  if (
    mimetype.includes('zip') ||
    mimetype.includes('rar') ||
    mimetype.includes('7z') ||
    mimetype.includes('compressed')
  )
    return 'archive'
  if (mimetype.startsWith('text/')) return 'text'
  return 'other'
}

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      // 根据请求路径判断是图片还是通用文件上传
      const isImageUpload = req.path.includes('/image')
      const maxSize = isImageUpload ? '10MB' : '50MB'
      return res.status(400).json({
        code: 400,
        message: `文件大小超过限制 (最大${maxSize})`,
        data: null
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 400,
        message: '文件数量超过限制 (最多10个)',
        data: null
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        code: 400,
        message: '意外的文件字段',
        data: null
      })
    }
  }

  if (error.message) {
    return res.status(400).json({
      code: 400,
      message: error.message,
      data: null
    })
  }

  next(error)
}

module.exports = {
  // 图片上传（兼容旧接口）
  upload: imageUpload,
  // 通用文件上传（支持视频，50MB）
  fileUpload: fileUpload,
  // 错误处理
  handleUploadError,
  // 文件类型识别
  getFileType,
  // 导出配置常量
  uploadDir,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_FILES
}
