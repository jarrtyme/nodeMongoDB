const reqMiddleware = (req, res, next) => {
  next()
}
const responseMiddleware = (req, res, next) => {
  // 成功响应
  res.success = (data = null, message = 'Success') => {
    res.json({ code: 200, message, data })
  }
  // 错误响应
  res.error = (message = 'Error', statusCode = 500, data = null) => {
    res.status(statusCode).json({ code: 500, message, data })
  }
  next()
}

module.exports = {
  reqMiddleware,
  responseMiddleware
}
