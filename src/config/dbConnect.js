const mongoose = require('mongoose')
const config = require('./database')

// 连接数据库
const connectDB = async () => {
  try {
    console.log(`正在连接到数据库...`)
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
    console.log(`连接URL: ${config.url}`)
    
    // 先设置事件监听器
    mongoose.connection.once('open', () => {
      console.log(`✅ 成功连接到 MongoDB`)
      console.log(`数据库名称: ${mongoose.connection.db.databaseName}`)
    })
    
    await mongoose.connect(config.url, config.options)
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 连接错误:', err.message)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB 连接已断开')
    })
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB 连接已关闭，应用退出')
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message)
    console.error('连接详情:', {
      url: config.url,
      error: error.stack
    })
    process.exit(1)
  }
}

module.exports = connectDB
