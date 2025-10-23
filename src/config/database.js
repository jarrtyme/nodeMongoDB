// 数据库配置文件
// 加载环境变量
require('dotenv').config()

// 根据环境构建MongoDB连接URL
const getMongoUrl = () => {
  // 如果直接提供了完整的MONGODB_URI，优先使用
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI
  }

  // 根据环境选择不同的连接方式
  const host = process.env.MONGODB_HOST || 'localhost'
  const port = process.env.MONGODB_PORT || '27017'
  const database = process.env.MONGODB_DATABASE || 'clothing_inventory'
  const user = process.env.MONGODB_USER
  const password = process.env.MONGODB_PASSWORD

  // 生产环境需要认证
  if (process.env.NODE_ENV === 'production' && user && password) {
    return `mongodb://${user}:${password}@${host}:${port}/${database}`
  }

  // 开发环境使用简单连接
  if (process.env.NODE_ENV === 'development') {
    return `mongodb://${host}:${port}/${database}`
  }

  // 测试环境使用本地连接
  return `mongodb://127.0.0.1:27017/${database}`
}

module.exports = {
  url: getMongoUrl(),
  options: {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
  }
}
