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
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}_${uniqueSuffix}${ext}`)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'), false)
  }
}

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 文件大小限制
    files: 10 // 最多10个文件
  }
})

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制 (最大5MB)',
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
  
  if (error.message.includes('只允许上传图片文件')) {
    return res.status(400).json({
      code: 400,
      message: error.message,
      data: null
    })
  }
  
  next(error)
}

module.exports = {
  upload,
  handleUploadError
}
