const responseMiddleware = (req, res, next) => {
  // 成功响应
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({ code: statusCode, message, data })
  }
  // 错误响应
  res.error = (message = 'Error', statusCode = 500, data = null) => {
    res.status(statusCode).json({ code: statusCode, message, data })
  }
  next()
}

module.exports = {
  responseMiddleware
}
