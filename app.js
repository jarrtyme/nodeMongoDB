const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const { responseMiddleware, methodCheckMiddleware } = require('./middlewares/responseMiddleware')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const bookRoutes = require('./routes/bookRoutes') // 引入路由文件
// console.log(bookRoutes)

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
// 定义允许的请求方法
app.use(methodCheckMiddleware(['GET', 'POST']))
app.use(responseMiddleware)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/book', bookRoutes)

// catch 404 and forward to error handler
app.use('*', function (req, res, next) {
  next(createError(404))
})
app.use((req, res) => {
  res.status(405).json({ success: false, message: 'Method Not Allowed' })
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
