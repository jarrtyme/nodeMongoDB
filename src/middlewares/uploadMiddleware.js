const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { uploadsDir } = require('../config/paths')

// 基础上传目录
const baseUploadDir = uploadsDir

// 确保基础上传目录存在
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true })
}

// 根据文件类型获取存储目录
function getStorageDir(mimetype, originalname) {
  // 根据 MIME 类型和扩展名判断文件类型
  const ext = path.extname(originalname).toLowerCase()

  // 图片类型
  if (
    mimetype.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)
  ) {
    return path.join(baseUploadDir, 'images')
  }
  // 视频类型
  if (
    mimetype.startsWith('video/') ||
    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'].includes(ext)
  ) {
    return path.join(baseUploadDir, 'videos')
  }
  // 文档类型
  if (
    mimetype.includes('pdf') ||
    mimetype.includes('document') ||
    mimetype.includes('word') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel') ||
    mimetype.includes('presentation') ||
    mimetype.includes('powerpoint') ||
    ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)
  ) {
    return path.join(baseUploadDir, 'documents')
  }
  // 压缩包类型
  if (
    mimetype.includes('zip') ||
    mimetype.includes('rar') ||
    mimetype.includes('7z') ||
    mimetype.includes('compressed') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)
  ) {
    return path.join(baseUploadDir, 'archives')
  }
  // 文本类型
  if (mimetype.startsWith('text/') || ['.txt', '.csv', '.json', '.xml', '.md'].includes(ext)) {
    return path.join(baseUploadDir, 'texts')
  }
  // 其他类型
  return path.join(baseUploadDir, 'others')
}

// 配置存储（支持按文件类型分类）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const storageDir = getStorageDir(file.mimetype, file.originalname)
    // 确保目录存在
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }
    cb(null, storageDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_随机数_原文件名
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}_${uniqueSuffix}${ext}`)
  }
})

// 通用文件过滤器（支持更多文件类型，包括视频）
const generalFileFilter = (req, file, cb) => {
  // 允许的文件类型（包括视频）
  const allowedTypes =
    /jpeg|jpg|png|gif|webp|bmp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|txt|csv|json|xml|md|mp4|webm|ogg|mov|avi|wmv|flv|mkv/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())

  if (extname) {
    return cb(null, true)
  } else {
    cb(
      new Error(
        '不支持的文件类型。允许的类型：图片(jpg,png,gif,webp,bmp,svg)、视频(mp4,webm,ogg,mov,avi,wmv,flv,mkv)、文档(pdf,doc,docx,xls,xlsx,ppt,pptx)、压缩包(zip,rar,7z,tar,gz)、文本(txt,csv,json,xml,md)'
      ),
      false
    )
  }
}

// 根据文件存储路径获取相对路径（用于返回给前端）
function getRelativePath(filePath) {
  // 将绝对路径转换为相对于 public/uploads 的路径
  const normalizedPath = path.normalize(filePath)
  const uploadsIndex = normalizedPath.indexOf('uploads')
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex - 1) // 包含 /uploads
  }
  return `/uploads/${path.basename(filePath)}` // 如果找不到，返回默认路径
}

// 文件大小限制
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB（用于所有文件类型）
const MAX_FILES = 200

// 通用文件上传配置（支持多种类型，包括视频，100MB）
const fileUpload = multer({
  storage: storage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // 增加到100MB以支持视频
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
      return res.status(400).json({
        code: 400,
        message: `文件大小超过限制 (最大100MB)`,
        data: null
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 400,
        message: '文件数量超过限制 (最多200个)',
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
  // 通用文件上传（支持所有文件类型，100MB）
  fileUpload: fileUpload,
  // 错误处理
  handleUploadError,
  // 文件类型识别
  getFileType,
  // 获取存储目录函数
  getStorageDir,
  // 获取相对路径函数
  getRelativePath,
  // 导出配置常量
  uploadDir: baseUploadDir,
  MAX_VIDEO_SIZE,
  MAX_FILES
}
