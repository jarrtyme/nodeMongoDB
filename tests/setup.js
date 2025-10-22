const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongoServer

// 测试前设置
beforeAll(async () => {
  // 如果已经有连接，先关闭
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  
  // 启动内存MongoDB服务器
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // 连接到内存数据库
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

// 测试后清理
afterAll(async () => {
  // 关闭数据库连接
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  
  // 停止内存MongoDB服务器
  if (mongoServer) {
    await mongoServer.stop()
  }
})

// 每个测试后清理数据库
afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})
