// 数据库配置文件
// 注意：环境变量由启动脚本加载（dotenv/config），这里不再重复加载

// 根据环境构建MongoDB连接URL
const getMongoUrl = () => {
  // 如果直接提供了完整的MONGODB_URI，优先使用（支持 mongodb:// 和 mongodb+srv://）
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI
  }

  // 根据环境选择不同的连接方式
  const host = process.env.MONGODB_HOST || 'localhost'
  const port = process.env.MONGODB_PORT || '27017'
  const database = process.env.MONGODB_DATABASE || 'clothing_inventory'
  const user = process.env.MONGODB_USER
  const password = process.env.MONGODB_PASSWORD
  const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin'

  // 如果有用户名和密码，使用认证连接（生产环境通常需要）
  if (user && password) {
    // 如果端口是 27017 或未指定，使用标准格式
    // 如果使用 MongoDB Atlas 或其他云服务，可能需要 mongodb+srv://
    const protocol = process.env.MONGODB_PROTOCOL || 'mongodb'
    if (protocol === 'mongodb+srv') {
      // MongoDB Atlas 或其他云服务使用 SRV 记录
      return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(
        password
      )}@${host}/${database}?authSource=${authSource}`
    } else {
      // 标准 MongoDB 连接
      return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(
        password
      )}@${host}:${port}/${database}?authSource=${authSource}`
    }
  }

  // 开发环境使用简单连接（无认证）
  if (process.env.NODE_ENV === 'development') {
    return `mongodb://${host}:${port}/${database}`
  }

  // 测试环境使用本地连接
  if (process.env.NODE_ENV === 'test') {
    return `mongodb://127.0.0.1:27017/${database}`
  }

  // 生产环境如果没有提供认证信息，使用默认连接（但会报错，需要配置认证）
  console.warn('⚠️  警告：生产环境未配置 MongoDB 认证信息，可能导致连接失败')
  return `mongodb://${host}:${port}/${database}`
}

// 获取连接选项
const getConnectionOptions = () => {
  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2
  }

  // 如果有认证信息，添加认证选项
  if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
    options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin'
  }

  return options
}

module.exports = {
  url: getMongoUrl(),
  options: getConnectionOptions()
}
