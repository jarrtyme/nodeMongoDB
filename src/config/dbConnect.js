const mongoose = require('mongoose')
const config = require('./database')

// 连接数据库
const connectDB = async () => {
  try {
    console.log(`正在连接到数据库...`)
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`)

    // 隐藏密码的连接URL（用于日志显示）
    const safeUrl = config.url.replace(/:([^:@]+)@/, ':****@')
    console.log(`连接URL: ${safeUrl}`)
    if (config.options.authSource) {
      console.log(`认证数据库 (authSource): ${config.options.authSource}`)
    }

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

    // 提供更详细的错误信息和解决建议
    if (error.message.includes('Authentication failed')) {
      console.error('\n🔍 认证失败，请检查以下配置：')
      console.error('1. 确认用户名和密码是否正确')
      console.error('2. 确认 authSource 配置是否正确（用户是在哪个数据库中创建的）')
      console.error('   - 如果用户是在目标数据库中创建的，authSource 应该是数据库名')
      console.error('   - 如果用户是在 admin 数据库中创建的，设置 MONGODB_AUTH_SOURCE=admin')
      console.error('3. 确认用户是否有访问该数据库的权限')
      console.error('\n当前配置：')
      console.error(`  - 数据库名: ${process.env.MONGODB_DATABASE || 'clothing_inventory'}`)
      console.error(`  - 用户名: ${process.env.MONGODB_USER || '未设置'}`)
      console.error(`  - authSource: ${config.options.authSource || '未设置'}`)
    }

    console.error('\n连接详情:', {
      url: config.url.replace(/:([^:@]+)@/, ':****@'), // 隐藏密码
      authSource: config.options.authSource,
      error: error.message
    })
    process.exit(1)
  }
}

module.exports = connectDB
