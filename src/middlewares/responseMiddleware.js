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
const methodCheckMiddleware = (allowedMethods) => (req, res, next) => {
  if (!allowedMethods.includes(req.method)) {
    return res.status(401).json({ success: false, message: 'Unauthorized request method' })
  }
  next()
}

module.exports = {
  reqMiddleware,
  methodCheckMiddleware,
  responseMiddleware
}
