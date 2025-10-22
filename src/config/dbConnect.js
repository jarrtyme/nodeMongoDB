const mongoose = require('mongoose')
const dbConfig = require('./database')

// 获取当前环境的数据库配置
const getDbConfig = () => {
  const env = dbConfig.current
  return dbConfig[env]
}

// 连接数据库
const connectDB = async () => {
  try {
    const config = getDbConfig()
    console.log(`正在连接到 ${dbConfig.current} 数据库...`)
    console.log(`连接URL: ${config.url}`)
    
    // 设置连接选项
    const options = {
      serverSelectionTimeoutMS: 10000, // 10秒超时
      connectTimeoutMS: 10000,         // 10秒连接超时
      socketTimeoutMS: 45000,          // 45秒socket超时
      maxPoolSize: 10,                 // 最大连接池大小
      minPoolSize: 2,                  // 最小连接池大小
    }
    
    // 先设置事件监听器
    mongoose.connection.once('open', () => {
      console.log(`✅ 成功连接到 MongoDB - ${dbConfig.current} 环境`)
      console.log(`数据库名称: ${mongoose.connection.db.databaseName}`)
    })
    
    await mongoose.connect(config.url, options)
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 连接错误:', err.message)
      console.error('错误详情:', err)
    })
    
    mongoose.connection.on('close', () => {
      console.log('🔌 MongoDB 连接已关闭')
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB 连接已断开')
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB 重新连接成功')
    })
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.error('完整错误信息:', error)
    
    // 不要立即退出，给用户一些时间查看错误
    console.log('请检查:')
    console.log('1. 数据库服务器是否正在运行')
    console.log('2. 网络连接是否正常')
    console.log('3. 用户名和密码是否正确')
    console.log('4. 数据库名称是否存在')
    
    // 延迟5秒后退出
    setTimeout(() => {
      process.exit(1)
    }, 5000)
  }
}

module.exports = connectDB
