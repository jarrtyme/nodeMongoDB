// 加载环境变量
require('dotenv').config()

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')

// 只在非测试环境中连接数据库
if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./src/config/dbConnect')
  connectDB()
}

const { responseMiddleware } = require('./src/middlewares/responseMiddleware')

const clothingRoutes = require('./src/routes/clothingRoutes') // 引入服装路由文件
const uploadRoutes = require('./src/routes/uploadRoutes') // 引入图片上传路由文件
const authRoutes = require('./src/routes/authRoutes') // 引入认证路由文件
const mediaRoutes = require('./src/routes/mediaRoutes') // 引入媒体库路由文件
const pageComponentRoutes = require('./src/routes/pageComponentRoutes') // 引入页面组件路由文件
const pageRoutes = require('./src/routes/pageRoutes') // 引入页面路由文件
const settingsRoutes = require('./src/routes/settingsRoutes') // 引入系统设置路由文件

const app = express()

// 信任代理（用于在 Nginx 等反向代理场景下正确获取协议和主机）
// 这样 req.protocol 和 req.get('host') 才能正确工作
app.set('trust proxy', true)

// 配置跨域 - 允许所有请求
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // 允许的源，开发环境可以用 *，生产环境建议指定具体域名
    credentials: true, // 允许携带凭证（cookies等）
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'], // 允许所有HTTP方法
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'], // 允许所有常用请求头
    exposedHeaders: ['X-New-Token'] // 允许前端读取响应头中的 X-New-Token（用于无感刷新 token）
  })
)

// API应用，不需要视图引擎
// 允许所有HTTP方法（已移除方法限制）
app.use(responseMiddleware)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// 认证路由（无需鉴权）
app.use('/auth', authRoutes)

// 业务路由（需要鉴权）
app.use('/clothing', clothingRoutes)
app.use('/upload', uploadRoutes)
app.use('/media', mediaRoutes)
app.use('/page-component', pageComponentRoutes)
app.use('/page', pageRoutes)
app.use('/settings', settingsRoutes)

// catch 404 and forward to error handler
app.use('*', function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // 返回JSON错误响应
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal Server Error',
    data: null
  })
})

module.exports = app
