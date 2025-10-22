const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

// 只在非测试环境中连接数据库
if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./src/config/dbConnect')
  connectDB()
}

const { responseMiddleware, methodCheckMiddleware } = require('./src/middlewares/responseMiddleware')

const clothingRoutes = require('./src/routes/clothingRoutes') // 引入服装路由文件
const uploadRoutes = require('./src/routes/uploadRoutes') // 引入图片上传路由文件
const authRoutes = require('./src/routes/authRoutes') // 引入认证路由文件

const app = express()

// API应用，不需要视图引擎
// 定义允许的请求方法
app.use(methodCheckMiddleware(['POST']))
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

// catch 404 and forward to error handler
app.use('*', function (req, res, next) {
  next(createError(404))
})
app.use((req, res) => {
  res.status(405).json({ success: false, message: 'Method Not Allowed' })
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